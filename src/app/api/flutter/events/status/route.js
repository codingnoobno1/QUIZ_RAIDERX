import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import Event from '@/models/Event';
import EventActivity from '@/models/EventActivity';
import QuizSubmission from '@/models/QuizSubmission';
import EventVote from '@/models/EventVote';
import HuntProgress from '@/models/HuntProgress';
import AudiencePollVote from '@/models/AudiencePollVote';
import FastestFingerSubmission from '@/models/FastestFingerSubmission';
import EventRegistration from '@/models/EventRegistration';
import LiveAnswer from '@/models/LiveAnswer';
import { buildKbcPayload } from '@/lib/kbc/viewerPayload';
import { ROUND_STATE, effectiveRoundState, isTargeted, leaderNameOf, resolveParticipantTeam } from '@/lib/live/rounds';
import { invalidIdResponse, notFound, requireEventUser, serverError } from '@/lib/apiGuards';

/**
 * GET /api/flutter/events/status?eventId=[id]&participantId=[id]
 *
 * The poll. Every phone in the room and every browser in the lobby hits this on
 * a 7-30s cadence, so it is the one route that must never throw and must stay
 * cheap: three indexed lookups, no population, projection everywhere.
 *
 * Secrets withheld: the hunt's `quizRef`/`externalUrl` (revealed on scan) and
 * the external activity's `secretKey`.
 *
 * VERSIONED PAYLOAD: pass `v=2`.
 *
 * v1 includes each question's `correctAnswer` for `rapid_fire`/`preloaded`,
 * because those clients grade locally for instant feedback — which means anyone
 * reading the network tab can score full marks. Removing it needs the client
 * changed in the same breath, and a build of that client is already deployed,
 * so the fix is a version rather than an edit: v1 keeps the old contract for
 * phones in the wild, v2 withholds every answer and hands out `liveRound`
 * instead. Delete v1 once the store build has rolled over.
 *
 * v2 adds, for host-paced (`custom_live`) quizzes, a `liveRound` block: the
 * open question's `instanceId`, its absolute `endsAt`, whether this viewer's
 * team is the one being asked, what they have already answered, and — only
 * after the host reveals — the correct answer. Clients render it; they never
 * compute it.
 */
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const participantId = searchParams.get('participantId');
    const version = Number(searchParams.get('v')) >= 2 ? 2 : 1;

    if (!eventId) {
        return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    // A malformed id used to become a CastError -> 500, which reads to a client
    // as an outage and gets retried. It is a 400.
    const invalid = invalidIdResponse(eventId, 'eventId');
    if (invalid) return invalid;

    try {
        await connectDB();

        const event = await Event.findById(eventId).select('title onDuty').lean();
        if (!event) return notFound('Event not found');

        const activeActivity = await EventActivity.findOne({ eventId, status: 'active' }).lean();

        if (!activeActivity) {
            return NextResponse.json({
                success: true,
                data: {
                    eventId,
                    onDuty: event.onDuty,
                    activeActivity: null,
                    serverTime: new Date().toISOString(),
                    // Nothing is running: back off. The cadence is dictated
                    // here rather than hardcoded per client so a room full of
                    // phones can be sped up or calmed down from one place.
                    pollAfterMs: 10000
                }
            });
        }

        // Has this participant already taken part? Previously answered for
        // quizzes only, so the lobby offered "Join now" for a poll you had
        // already voted in, and a hunt you were already running.
        const hasSubmitted = await participantHasSubmitted(activeActivity, participantId);

        const safe = {
            _id: activeActivity._id,
            type: activeActivity.type,
            title: activeActivity.title,
            description: activeActivity.description,
            status: activeActivity.status,
            activatedAt: activeActivity.activatedAt,
            hasSubmitted
        };

        // KBC is role-derived: what comes back depends on who is asking and
        // which phase the show is in. Every other quiz type keeps the payload
        // it has always had, so the Flutter client is unaffected.
        if (activeActivity.type === 'quiz' && activeActivity.quiz?.quizType === 'kbc') {
            safe.quiz = await buildKbc(activeActivity, participantId, eventId);
            return NextResponse.json({
                success: true,
                data: {
                    eventId,
                    onDuty: event.onDuty,
                    activeActivity: safe,
                    serverTime: new Date().toISOString(),
                    pollAfterMs: 2000
                }
            });
        }

        if (activeActivity.type === 'quiz') {
            const q = activeActivity.quiz ?? {};
            const questions = Array.isArray(q.questions) ? q.questions : [];

            // Host-paced rounds index off the round, not off `currentQuestion`,
            // so a stale write to one cannot desync the other. They are kept in
            // step on open; this just picks the authoritative one.
            const rawIndex = q.quizType === 'custom_live' && q.liveRound?.instanceId
                ? q.liveRound.questionIndex
                : q.currentQuestion;

            // Clamp: a host who advances past the last question (or a config
            // written by hand) must not produce an out-of-range read.
            const index = Math.min(Math.max(Number(rawIndex) || 0, 0), Math.max(questions.length - 1, 0));
            const current = questions[index];

            safe.quiz = {
                quizType: q.quizType,
                scope: q.scope ?? 'individual',
                timePerQuestion: q.timePerQuestion,
                totalQuestions: questions.length,
                currentQuestion: index,
                autoAdvance: q.autoAdvance,
                shuffle: q.shuffle,
                // custom_live: only the current question, and never its answer.
                activeQuestion: q.quizType === 'custom_live' && current ? {
                    // The id is what the grader matches on. Without it the client
                    // could only send the index, which matched nothing — every
                    // host-paced answer scored zero.
                    _id: current._id,
                    index,
                    text: current.text,
                    options: current.options,
                    points: current.points
                } : null,
                // rapid_fire / preloaded: the pack. v1 carries the answers for
                // local grading (see the version note above); v2 does not, and
                // those clients read their score from the submit response.
                // A generated-paper quiz sends no questions here at all. Its
                // list is the whole bank — 60 questions, every reserve included
                // — and each team is meant to see only its own 23, dealt by the
                // paper endpoint. The flag tells the client to go there.
                paper: q.paper?.enabled
                    ? {
                        enabled: true,
                        durationMinutes: q.paper.durationMinutes ?? 30,
                        questionsPerPaper: (q.paper.counts?.easy ?? 8)
                            + (q.paper.counts?.medium ?? 10)
                            + (q.paper.counts?.hard ?? 5),
                        power: q.paper.power?.enabled
                            ? { count: q.paper.power.count ?? 2, pointsEach: q.paper.power.points ?? 25 }
                            : null,
                    }
                    : null,
                questions: q.quizType !== 'custom_live' && !q.paper?.enabled
                    ? questions.map(qu => ({
                        _id: qu._id,
                        text: qu.text,
                        options: qu.options,
                        ...(version === 1 ? { correctAnswer: qu.correctAnswer } : {}),
                        points: qu.points,
                        imageUrl: qu.imageUrl
                    }))
                    : undefined
            };

            if (version >= 2 && q.quizType === 'custom_live') {
                safe.quiz.liveRound = await buildLiveRound({
                    activity: activeActivity,
                    quiz: q,
                    question: current,
                    req,
                    participantId
                });
            }
        }

        if (activeActivity.type === 'voting') {
            safe.voting = {
                question: activeActivity.voting?.question,
                options: activeActivity.voting?.options,
                allowMultiple: activeActivity.voting?.allowMultiple,
                showLiveResults: activeActivity.voting?.showLiveResults,
                votingDurationSeconds: activeActivity.voting?.votingDurationSeconds
            };
        }

        if (activeActivity.type === 'hunt') {
            safe.hunt = {
                totalCheckpoints: activeActivity.hunt?.checkpoints?.length || 0,
                ordered: activeActivity.hunt?.ordered,
                checkpoints: (activeActivity.hunt?.checkpoints || []).map(cp => ({
                    checkpointId: cp.checkpointId,
                    hint: cp.hint,
                    challengeType: cp.challengeType,
                    order: cp.order
                    // quizRef and externalUrl are revealed only after scanning
                }))
            };
        }

        if (activeActivity.type === 'external') {
            safe.external = {
                url: activeActivity.external?.url,
                points: activeActivity.external?.points,
                durationMinutes: activeActivity.external?.durationMinutes
                // secretKey is NEVER exposed
            };
        }

        if (activeActivity.type === 'announcement') {
            safe.announcement = {
                message: activeActivity.announcement?.message,
                displaySeconds: activeActivity.announcement?.displaySeconds
            };
        }

        return NextResponse.json({
            success: true,
            data: {
                eventId,
                onDuty: event.onDuty,
                activeActivity: safe,
                serverTime: new Date().toISOString(),
                // A question that is open is worth a tight loop — a second of
                // skew between two phones is a second of unfair thinking time.
                // Everything else can wait.
                pollAfterMs: safe.quiz?.liveRound?.state === 'open' ? 1000 : 5000
            }
        });

    } catch (error) {
        return serverError(error, 'flutter/events/status');
    }
}

/**
 * Gather only the counts the payload builder needs, then let it decide what
 * this particular viewer is allowed to see.
 */
async function buildKbc(activity, participantId, eventId) {
    const quiz = activity.quiz ?? {};
    const pollIndex = quiz.audiencePoll?.questionIndex ?? quiz.currentQuestion ?? 0;
    const ffIndex = quiz.fastestFinger?.questionIndex ?? 0;

    const [pollVotes, myPollVote, ffSubmissions, myFf, ranking, audience] = await Promise.all([
        AudiencePollVote.find({ activityId: activity._id, questionIndex: pollIndex }).select('option').lean(),
        participantId
            ? AudiencePollVote.findOne({ activityId: activity._id, questionIndex: pollIndex, participantId }).select('option').lean()
            : null,
        FastestFingerSubmission.countDocuments({ activityId: activity._id, questionIndex: ffIndex }),
        participantId
            ? FastestFingerSubmission.findOne({ activityId: activity._id, questionIndex: ffIndex, participantId })
                  .select('elapsedMs correct').lean()
            : null,
        FastestFingerSubmission.find({ activityId: activity._id, questionIndex: ffIndex })
            .sort({ elapsedMs: 1 }).limit(10)
            .select('participantId name teamName elapsedMs correct').lean(),
        EventRegistration.countDocuments({ eventId }),
    ]);

    const pollTally = pollVotes.reduce((acc, v) => {
        acc[v.option] = (acc[v.option] ?? 0) + 1;
        return acc;
    }, {});

    return buildKbcPayload({
        quiz,
        viewerId: participantId || null,
        isHost: false, // the console has its own endpoint; this one is never host
        counts: { pollVotes: pollVotes.length, pollTally, ffSubmissions, audience },
        myPollVote,
        myFfSubmission: myFf,
        ranking,
    });
}

/**
 * One indexed `_id`-only lookup per type. A failure here must not fail the
 * poll — the participant would lose the whole lobby over a "have you voted?"
 * question, so it degrades to false.
 */
async function participantHasSubmitted(activity, participantId) {
    if (!participantId) return false;

    try {
        switch (activity.type) {
            case 'quiz': {
                const found = await QuizSubmission.findOne({ activityId: activity._id, participantId })
                    .select('_id').lean();
                return Boolean(found);
            }
            case 'voting': {
                const found = await EventVote.findOne({ activityId: activity._id, participantId })
                    .select('_id').lean();
                return Boolean(found);
            }
            case 'hunt': {
                const found = await HuntProgress.findOne({ eventId: activity.eventId, participantId })
                    .select('status').lean();
                return found?.status === 'finished';
            }
            default:
                return false;
        }
    } catch (error) {
        console.error('[api:flutter/events/status] hasSubmitted lookup failed', error);
        return false;
    }
}

/**
 * The round as this particular viewer is allowed to see it.
 *
 * Three things here are deliberately server-decided rather than left to the
 * client: whether this viewer's team is the one being asked, what they have
 * already answered, and whether the answer may be shown yet. A client that
 * decided any of them could show a non-targeted team the question early, or
 * reveal the answer to whoever opened the developer tools.
 */
async function buildLiveRound({ activity, quiz, question, req, participantId }) {
    const round = quiz.liveRound ?? {};
    const now = new Date();

    if (!round.instanceId) {
        return { state: ROUND_STATE.IDLE, instanceId: null, questionIndex: round.questionIndex ?? 0 };
    }

    const state = effectiveRoundState(round, now);
    const isTeamScope = quiz.scope === 'team';
    const targetsTeams = round.target?.kind === 'teams';

    // Prefer the verified identity. The `participantId` query parameter is
    // unauthenticated and is used only to look up what this viewer already
    // answered — a wrong one shows the wrong badge and authorises nothing,
    // because every write goes through the answer endpoint's own session check.
    const auth = await requireEventUser(req);
    const viewer = auth.ok ? auth.email : (participantId || null);

    const team = (isTeamScope || targetsTeams) && viewer
        ? await resolveParticipantTeam(activity.eventId, viewer)
        : { teamId: null, teamName: null };

    const [mine, targetTeams] = await Promise.all([
        findMyAnswer(round.instanceId, viewer, isTeamScope ? team.teamId : null),
        targetsTeams ? namesForTeams(activity.eventId, round.target.teamIds) : Promise.resolve([]),
    ]);

    const revealed = state === ROUND_STATE.REVEALED;

    return {
        instanceId: String(round.instanceId),
        questionIndex: round.questionIndex ?? 0,
        state,
        openedAt: round.openedAt,
        // The deadline, as an absolute instant. Clients count down to this
        // corrected by `serverTime`; they never start a timer of their own.
        endsAt: round.endsAt,
        durationSeconds: round.durationSeconds,

        scope: isTeamScope ? 'team' : 'individual',
        // The three fields the "it is your team's turn" screen is built from:
        // whether this phone is being asked, which team the host named, and who
        // leads it. Resolved here because a phone knows only the address it
        // signed in with — it cannot work out who leads its own team.
        targeted: isTargeted(round, team.teamId),
        targetKind: round.target?.kind ?? 'all',
        targetTeams,
        myTeamId: team.teamId,
        myTeamName: team.teamName,
        myTeamLeaderName: team.leaderName ?? null,
        isTeamLeader: Boolean(team.isLeader),

        answered: Boolean(mine),
        myOption: mine?.option ?? null,
        // In team scope this is the teammate who got there first, which the app
        // shows instead of a bare "already answered".
        answeredBy: mine && mine.participantId !== viewer ? (mine.name || null) : null,

        // Correctness exists on the row from the moment it is written, and is
        // withheld until the host reveals. Anything else lets the first answer
        // in the room tell everyone else what to pick.
        reveal: revealed ? {
            correctAnswer: question?.correctAnswer ?? null,
            isCorrect: mine?.isCorrect ?? false,
            pointsAwarded: mine?.pointsAwarded ?? 0,
        } : null,
    };
}

function findMyAnswer(instanceId, viewer, teamKey) {
    if (!viewer && !teamKey) return Promise.resolve(null);
    const where = teamKey ? { instanceId, teamKey } : { instanceId, participantId: viewer };
    return LiveAnswer.findOne(where)
        .select('option participantId name isCorrect pointsAwarded')
        .lean()
        .catch(() => null);
}

async function namesForTeams(eventId, teamIds) {
    const ids = Array.isArray(teamIds) ? teamIds.filter(Boolean) : [];
    if (!ids.length) return [];

    try {
        const regs = await EventRegistration.find({ eventId, teamId: { $in: ids } })
            .select('teamId teamName name email leaderEmail members').lean();

        return regs.map((r) => ({
            teamId: r.teamId,
            teamName: r.teamName ?? r.teamId,
            // Announced on every phone in the room, not just the team's own —
            // "Team Kernel Panic, led by Priya" is how a host names who is up.
            leaderName: leaderNameOf(r),
        }));
    } catch {
        // A missing name is cosmetic; the round still runs on ids.
        return ids.map((teamId) => ({ teamId, teamName: teamId, leaderName: null }));
    }
}
