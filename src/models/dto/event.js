/**
 * Normalisers for everything the event API returns.
 *
 * Ported from the Flutter models (`lib/models/*.dart`). The rule they follow and
 * we follow here: **every field gets a default**, so a malformed or partial
 * payload degrades into a readable card instead of a blank screen or a throw.
 *
 * Derived rules (isUpcoming, isLive, ...) live on the returned object, not in
 * components — so availability is computed in exactly one place.
 */

const str = (v, fallback = '') => (typeof v === 'string' && v.trim() ? v : fallback);
const num = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);
const bool = (v, fallback = false) => (typeof v === 'boolean' ? v : fallback);
const list = (v) => (Array.isArray(v) ? v : []);
const date = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const id = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return str(v._id ?? v.id ?? '');
};

/** Event.fromJson — event.dart:70 */
export function toEvent(json) {
  if (!json || typeof json !== 'object') return null;

  const when = date(json.date);

  return {
    id: id(json._id ?? json.id),
    title: str(json.title, 'Untitled event'),
    description: str(json.description),
    date: when,
    time: str(json.time, 'TBA'),
    location: str(json.location, 'TBA'),
    imageUrl: str(json.imageUrl) || null,
    tags: list(json.tags).map((t) => str(t)).filter(Boolean),
    onDuty: bool(json.onDuty),
    createdAt: date(json.createdAt),
    participantCount: num(json.participantCount),
    modes: list(json.modes).map((m) => ({
      type: str(m?.type, 'custom'),
      config: m?.config && typeof m.config === 'object' ? m.config : {},
    })),
    activeMode: json.activeMode?.type
      ? { type: str(json.activeMode.type), startedAt: date(json.activeMode.startedAt) }
      : null,

    // Optional page content. Empty arrays rather than null so a component can
    // ask `.length` without guarding, and each section decides for itself
    // whether it has enough to render.
    organizer: json.organizer?.name
      ? {
          name: str(json.organizer.name),
          subtitle: str(json.organizer.subtitle),
          logoUrl: str(json.organizer.logoUrl) || null,
          contact: str(json.organizer.contact),
        }
      : null,
    eligibility: list(json.eligibility).map((e) => str(e)).filter(Boolean),
    rules: list(json.rules).map((r) => str(r)).filter(Boolean),
    prizes: list(json.prizes)
      .map((p) => ({ place: str(p?.place), reward: str(p?.reward) }))
      .filter((p) => p.place || p.reward),
    schedule: list(json.schedule)
      .map((s) => ({ time: str(s?.time), label: str(s?.label) }))
      .filter((s) => s.label),
    faq: list(json.faq)
      .map((f) => ({ question: str(f?.question), answer: str(f?.answer) }))
      .filter((f) => f.question),
    registrationClosesAt: date(json.registrationClosesAt),

    /** The activity running right now, if any — the thing people can join. */
    liveActivity: json.liveActivity?.id
      ? {
          id: str(json.liveActivity.id),
          type: str(json.liveActivity.type, 'activity'),
          title: str(json.liveActivity.title, 'Live activity'),
        }
      : null,

    // ── derived (event.dart:43-55) ──
    get isUpcoming() {
      return this.date ? this.date.getTime() > Date.now() : false;
    },
    get isPast() {
      return this.date ? this.date.getTime() < Date.now() : false;
    },
    get isToday() {
      if (!this.date) return false;
      const now = new Date();
      return this.date.toDateString() === now.toDateString();
    },
    /**
     * Live means "there is something to join".
     *
     * A running activity counts even when the organiser never set activeMode —
     * those two were tracked separately and disagreed, so an event could be
     * running a poll while every badge said it was idle.
     */
    get isLive() {
      return Boolean(this.liveActivity) || Boolean(this.activeMode?.type) || this.onDuty;
    },
    get registrationOpen() {
      if (this.isPast) return false;
      if (this.registrationClosesAt) return this.registrationClosesAt.getTime() > Date.now();
      return true;
    },
    /**
     * Where the event is in its life, as one word.
     *
     * The page used to show only ENDED or REGISTERED, which answers neither
     * "what happens next" nor "do I need to do something now".
     */
    get stage() {
      if (this.isLive) return 'live';
      if (this.isPast) return 'ended';
      if (this.isToday) return 'today';
      return this.registrationOpen ? 'open' : 'closed';
    },
  };
}

export const toEvents = (json) => list(json).map(toEvent).filter(Boolean);

/** A participant's registration for one event. */
export function toRegistration(json) {
  if (!json || typeof json !== 'object') return null;

  const members = list(json.members).map((m) => ({
    name: str(m?.name, 'Unnamed'),
    email: str(m?.email),
    enrollmentNumber: str(m?.enrollmentNumber),
    semester: str(m?.semester),
    inviteStatus: str(m?.inviteStatus, 'pending'),
    role: str(m?.role, 'member'),
  }));

  // Rows written before `leaderEmail` existed have no explicit owner; the
  // registrant leads those by construction. Everywhere else, the field wins.
  const leaderEmail = (str(json.leaderEmail) || str(json.email)).toLowerCase();

  return {
    id: id(json._id ?? json.id),
    eventId: id(json.eventId),
    /** Populated by some endpoints, a bare id in others. */
    event: json.eventId && typeof json.eventId === 'object' ? toEvent(json.eventId) : null,
    registrationType: str(json.registrationType, 'solo'),
    teamId: str(json.teamId) || null,
    teamName: str(json.teamName) || null,
    name: str(json.name, 'Unnamed'),
    email: str(json.email),
    enrollmentNumber: str(json.enrollmentNumber),
    semester: str(json.semester),
    members,
    /** Who leads the team. Not necessarily `email`: leadership can be handed over. */
    leaderEmail,
    status: str(json.status, 'pending'),
    entryTime: date(json.entryTime),
    exitTime: date(json.exitTime),
    entryCount: num(json.entryCount),
    exitCount: num(json.exitCount),

    // ── derived ──
    get isTeam() {
      return this.registrationType === 'team';
    },
    /** Does this address lead the team? Case-insensitive. */
    isLedBy(email) {
      return Boolean(email) && this.leaderEmail === String(email).toLowerCase();
    },
    /** What the QR encodes — teamId for a team, registration id for a solo. */
    get passId() {
      return this.teamId || this.id;
    },
    get displayName() {
      return this.isTeam ? this.teamName || 'Unnamed team' : this.name;
    },
    get hasEntered() {
      return this.entryCount > 0;
    },
    get hasExited() {
      return this.exitCount > 0;
    },
    get teamSize() {
      return this.isTeam ? this.members.length + 1 : 1;
    },
  };
}

export const toRegistrations = (json) => list(json?.data ?? json).map(toRegistration).filter(Boolean);

/**
 * The live activity from GET /api/flutter/events/status.
 * Shapes are per-type and defined server-side in that route.
 */
export function toLiveActivity(json) {
  if (!json || typeof json !== 'object') return null;

  const type = str(json.type, 'announcement');

  const base = {
    id: id(json._id ?? json.id),
    type,
    title: str(json.title, 'Live activity'),
    description: str(json.description),
    status: str(json.status, 'inactive'),
    activatedAt: date(json.activatedAt),
    hasSubmitted: bool(json.hasSubmitted),
  };

  // KBC arrives already tailored to this viewer by the server, so it passes
  // through as-is. Re-normalising it here would only risk inventing fields the
  // server deliberately withheld.
  if (type === 'quiz' && json.quiz?.quizType === 'kbc') {
    base.quiz = json.quiz;
    return base;
  }

  if (type === 'quiz') {
    const q = json.quiz ?? {};
    base.quiz = {
      quizType: str(q.quizType, 'rapid_fire'),
      timePerQuestion: num(q.timePerQuestion, 10),
      roundDurationSeconds: num(q.roundDurationSeconds),
      roundClock: q.roundClock
        ? {
            startedAt: date(q.roundClock.startedAt),
            endsAt: date(q.roundClock.endsAt),
            durationSeconds: num(q.roundClock.durationSeconds),
          }
        : null,
      totalQuestions: num(q.totalQuestions),
      currentQuestion: num(q.currentQuestion),
      autoAdvance: bool(q.autoAdvance, true),
      shuffle: bool(q.shuffle),
      qualified: q.qualified !== false,
      /** custom_live: the host controls which question is showing. */
      activeQuestion: q.activeQuestion
        ? {
            /** What the grader matches on. Answers submitted without it score zero. */
            id: id(q.activeQuestion._id ?? q.activeQuestion.id),
            index: num(q.activeQuestion.index),
            text: str(q.activeQuestion.text, 'Question unavailable'),
            type: str(q.activeQuestion.type, 'choice'),
            options: list(q.activeQuestion.options).map((o) => str(o)),
            points: num(q.activeQuestion.points, 10),
          }
        : null,
      /**
       * rapid_fire / preloaded: the question pack, without answers. The v2
       * status payload withholds them and the server grades on submit; there is
       * deliberately no `correctAnswer` here for a component to reach for.
       */
      questions: list(q.questions).map((qu) => ({
        id: id(qu?._id ?? qu?.id),
        text: str(qu?.text, 'Question unavailable'),
        type: str(qu?.type, 'choice'),
        options: list(qu?.options).map((o) => str(o)),
        points: num(qu?.points, 10),
        imageUrl: str(qu?.imageUrl) || null,
      })),
      scope: str(q.scope, 'individual'),
      /** Round 2: each team is dealt its own paper by the paper endpoint. */
      paper: q.paper?.enabled
        ? {
            enabled: true,
            durationMinutes: num(q.paper.durationMinutes, 30),
            questionsPerPaper: num(q.paper.questionsPerPaper, 23),
            power: q.paper.power
              ? { count: num(q.paper.power.count, 2), pointsEach: num(q.paper.power.pointsEach, 25) }
              : null,
          }
        : null,
      /** custom_live: the server's round — deadline, targeting, answer state. */
      liveRound: q.liveRound ? toLiveRound(q.liveRound) : null,
    };
  }

  if (type === 'voting') {
    const v = json.voting ?? {};
    base.voting = {
      question: str(v.question, 'Cast your vote'),
      options: list(v.options).map((o) => str(o)).filter(Boolean),
      allowMultiple: bool(v.allowMultiple),
      showLiveResults: bool(v.showLiveResults),
      votingDurationSeconds: num(v.votingDurationSeconds),
    };
  }

  if (type === 'hunt') {
    const h = json.hunt ?? {};
    base.hunt = {
      totalCheckpoints: num(h.totalCheckpoints),
      ordered: bool(h.ordered),
      checkpoints: list(h.checkpoints)
        .map((cp) => ({
          checkpointId: str(cp?.checkpointId),
          hint: str(cp?.hint, 'No hint given'),
          challengeType: str(cp?.challengeType, 'hint-only'),
          order: num(cp?.order),
        }))
        .sort((a, b) => a.order - b.order),
    };
  }

  if (type === 'external') {
    const e = json.external ?? {};
    base.external = {
      url: str(e.url) || null,
      points: num(e.points),
      durationMinutes: num(e.durationMinutes),
    };
  }

  if (type === 'announcement') {
    const a = json.announcement ?? {};
    base.announcement = {
      message: str(a.message, str(json.description)),
      displaySeconds: num(a.displaySeconds, 15),
    };
  }

  return base;
}

/**
 * The host-paced round, as the server describes it. Nothing here is computed on
 * the client: whether this device may answer, how long is left, and whether the
 * answer may be shown are all the server's.
 */
function toLiveRound(r) {
  return {
    instanceId: str(r.instanceId) || null,
    questionIndex: num(r.questionIndex),
    state: str(r.state, 'idle'),
    endsAt: date(r.endsAt),
    durationSeconds: num(r.durationSeconds),
    scope: str(r.scope, 'individual'),
    qualified: r.qualified !== false,
    targeted: r.targeted !== false,
    targetKind: str(r.targetKind, 'all'),
    targetTeams: list(r.targetTeams).map((t) => ({
      teamId: str(t?.teamId),
      teamName: str(t?.teamName),
      leaderName: str(t?.leaderName) || null,
    })),
    myTeamName: str(r.myTeamName) || null,
    myTeamLeaderName: str(r.myTeamLeaderName) || null,
    isTeamLeader: bool(r.isTeamLeader),
    answered: bool(r.answered),
    myOption: str(r.myOption) || null,
    answeredBy: str(r.answeredBy) || null,
    reveal: r.reveal
      ? {
          correctAnswer: str(r.reveal.correctAnswer) || null,
          isCorrect: bool(r.reveal.isCorrect),
          pointsAwarded: num(r.reveal.pointsAwarded),
        }
      : null,
  };
}

/** The whole status envelope: { success, data: { activeActivity, onDuty, serverTime } } */
export function toEventStatus(json) {
  const data = json?.data ?? json ?? {};
  return {
    eventId: str(data.eventId),
    onDuty: bool(data.onDuty),
    activeActivity: data.activeActivity ? toLiveActivity(data.activeActivity) : null,
    serverTime: date(data.serverTime),
    /** The server's requested cadence: tight while a question is open. */
    pollAfterMs: num(data.pollAfterMs, 0) || null,
    get isLive() {
      return Boolean(this.activeActivity);
    },
  };
}

/** An invitation is a registration where *you* are a pending member. */
export const toInvitations = (json) => list(json?.data ?? json).map(toRegistration).filter(Boolean);

/**
 * The vote tally from `/api/flutter/events/vote`.
 *
 * The server sends `{ option: { count, percentage } }`. A component that
 * assumed a flat `{ option: count }` rendered `NaN%` bars, which is exactly the
 * kind of shape drift this layer exists to absorb — so the normalisation lives
 * here and both readings are accepted.
 */
export function toVoteResults(json) {
  const data = json?.data ?? json ?? {};
  const raw = data.results && typeof data.results === 'object' ? data.results : {};

  const results = {};
  let total = 0;

  for (const [option, value] of Object.entries(raw)) {
    const count = num(typeof value === 'object' ? value?.count : value);
    results[option] = { count, percentage: num(value?.percentage) };
    total += count;
  }

  // Recompute rather than trust the server's rounding, so the bars always sum
  // against the same total the counts do.
  for (const option of Object.keys(results)) {
    if (total > 0) results[option].percentage = Math.round((results[option].count / total) * 100);
  }

  return {
    question: str(data.question),
    results,
    total,
    myVote: str(data.myVote) || null,
    /** False when the organiser has live results switched off. */
    resultsVisible: bool(data.resultsVisible, Object.keys(results).length > 0),
    activityStatus: str(data.activityStatus, 'active'),
    get hasVoted() {
      return Boolean(this.myVote);
    },
  };
}

/**
 * The qualifier board from `/api/flutter/events/rounds` — which teams are
 * through to each round.
 *
 * `youAreIn` is the server's answer, not ours: every client must agree about
 * whether a team made the cut, and a board that computed it locally would
 * disagree the first time a name was edited.
 */
export function toEventRounds(json) {
  const data = json?.data ?? json ?? {};

  return {
    eventId: str(data.eventId),
    yourTeamId: str(data.yourTeamId) || null,
    yourTeamName: str(data.yourTeamName) || null,
    rounds: list(data.rounds).map((r) => ({
      id: id(r.id ?? r._id),
      roundNumber: num(r.roundNumber, 0),
      title: str(r.title, 'Round'),
      format: str(r.format, 'other'),
      status: str(r.status, 'published'),
      teamCount: num(r.teamCount, list(r.teams).length),
      publishedAt: date(r.publishedAt),
      youAreIn: bool(r.youAreIn),
      teams: list(r.teams).map((t) => ({
        teamId: str(t.teamId),
        teamName: str(t.teamName, 'Unnamed team'),
        isYou: bool(t.isYou),
      })),
    })),
  };
}
