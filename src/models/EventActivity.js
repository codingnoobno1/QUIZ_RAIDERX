import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    /**
     * `choice` keeps the existing A/B/C/D behaviour. `text` is the no-choice
     * path used by written/typed live questions; it is graded server-side after
     * trimming whitespace and folding case.
     */
    type: { type: String, enum: ['choice', 'text'], default: 'choice' },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true },
    /**
     * What a generated paper draws on, and what decides the question's value
     * when the paper defines a points table. Questions written before this
     * existed count as medium.
     *
     * `impossible` is the fourth tier a team can choose in a difficulty round.
     * Generated papers deal from `counts`, which names only the first three, so
     * an impossible question is never dealt onto an ordinary paper by accident.
     */
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'impossible'],
        default: 'medium',
        index: true,
    },
    /**
     * Which draw a question belongs to. `regular` questions make up papers;
     * `power` questions are dealt only to teams that submit early; `tiebreak`
     * questions are held back for resolving ties. Kept apart so a reserve
     * question can never turn up on someone's ordinary paper.
     */
    pool: { type: String, enum: ['regular', 'power', 'tiebreak'], default: 'regular' },
    /** Fallback value, used when no paper points table applies. */
    points: { type: Number, default: 10 },
    imageUrl: { type: String }
}, { _id: true });

const CheckpointSchema = new mongoose.Schema({
    checkpointId: { type: String, required: true },
    hint: { type: String, required: true },
    location: { type: String },
    challengeType: {
        type: String,
        enum: ['quiz', 'hint-only', 'external-game'],
        default: 'hint-only'
    },
    quizRef: { type: mongoose.Schema.Types.ObjectId, ref: 'EventActivity' },
    externalUrl: { type: String },
    points: { type: Number, default: 100 },
    order: { type: Number, required: true }
}, { _id: true });

const EventActivitySchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
        type: String,
        enum: ['quiz', 'voting', 'hunt', 'external', 'announcement'],
        required: true, index: true
    },
    status: {
        type: String,
        enum: ['inactive', 'active', 'completed'],
        default: 'inactive', index: true
    },
    quiz: {
        quizType: { type: String, enum: ['rapid_fire', 'custom_live', 'preloaded', 'kbc'], default: 'rapid_fire' },
        questions: [QuestionSchema],
        timePerQuestion: { type: Number, default: 10 },
        /** Overall host-paced envelope. Starts with the first opened question. */
        roundDurationSeconds: { type: Number, default: 1800, min: 0 },
        scoring: { type: String, enum: ['correct_only', 'speed_bonus', 'partial'], default: 'correct_only' },

        /**
         * What a wrong answer costs, per difficulty.
         *
         * A round where teams pick their own difficulty needs a reason not to
         * pick the highest one every time; without a penalty the expected value
         * of guessing at 300 points is never worse than answering an easy
         * question correctly.
         *
         * Held as positive magnitudes and subtracted, so a glance at the config
         * cannot leave you wondering whether a stored -50 means minus fifty or
         * minus minus fifty. Off by default with every tier at zero, so no
         * existing round starts scoring differently.
         *
         * Only a wrong answer is charged. Not answering is not a wrong answer —
         * a team that runs out of time, or skips, scores zero rather than
         * losing points for staying silent.
         */
        /**
         * Whose turn it is, and at what tier — a difficulty round's own small
         * state, kept apart from `liveRound` because choosing happens between
         * questions, never during one. Written only by the live command route
         * and the team's own choice endpoint, never by a config edit.
         */
        choice: {
            state: { type: String, enum: ['idle', 'open', 'locked'], default: 'idle' },
            teamId: { type: String, default: null },
            teamName: { type: String, default: null },
            offeredAt: { type: Date, default: null },
            endsAt: { type: Date, default: null },
            durationSeconds: { type: Number, default: null },
            difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'impossible', null], default: null },
            chosenAt: { type: Date, default: null },
            /** The team member's address, or `host` when the host named it for them. */
            chosenBy: { type: String, default: null },
        },

        penalties: {
            enabled: { type: Boolean, default: false },
            easy: { type: Number, default: 0, min: 0 },
            medium: { type: Number, default: 0, min: 0 },
            hard: { type: Number, default: 0, min: 0 },
            impossible: { type: Number, default: 0, min: 0 },
        },
        shuffle: { type: Boolean, default: true },
        autoAdvance: { type: Boolean, default: true },
        maxParticipants: { type: Number, default: 500 },
        currentQuestion: { type: Number, default: 0 },

        /**
         * Who competes as one entrant.
         *
         * In `team` scope a team gets one answer and one score: the first
         * member to answer answers for everyone, enforced by the partial unique
         * index on LiveAnswer rather than by a disabled button. Applies to
         * rapid_fire and custom_live alike — the same questions, a different
         * unit of competition.
         */
        scope: { type: String, enum: ['individual', 'team'], default: 'individual' },

        /**
         * Whether a participant may sit a self-paced quiz more than once.
         * Off by default: a competitive round is one attempt, and the previous
         * behaviour — keep the best of unlimited retries — is a practice mode,
         * not a contest.
         */
        allowRetake: { type: Boolean, default: false },

        // ── Generated papers (Round 2) ───────────────────────────────────
        //
        // With `enabled`, the questions on this activity become a bank and each
        // team sits its own draw from it: `counts` per difficulty, shuffled
        // question and option order, worth `points` by difficulty, inside one
        // `durationMinutes` window. Which questions a team was dealt is stored
        // on a QuizPaper, so the same team always sees the same paper.
        paper: {
            enabled: { type: Boolean, default: false },
            counts: {
                easy: { type: Number, default: 8 },
                medium: { type: Number, default: 10 },
                hard: { type: Number, default: 5 },
            },
            points: {
                easy: { type: Number, default: 5 },
                medium: { type: Number, default: 11 },
                hard: { type: Number, default: 20 },
            },
            durationMinutes: { type: Number, default: 30 },
            shuffleQuestions: { type: Boolean, default: true },
            shuffleOptions: { type: Boolean, default: true },

            /**
             * Power questions: a reward for finishing early. A team that submits
             * its regular paper within `cutoffMinutes` of opening it is dealt
             * `count` questions from the power pool, each worth `points`, to
             * answer inside the time it has left.
             */
            power: {
                enabled: { type: Boolean, default: false },
                count: { type: Number, default: 2 },
                points: { type: Number, default: 25 },
                cutoffMinutes: { type: Number, default: 25 },
            },
        },

        /**
         * How many entrants go through to the next round. The cut is computed
         * from the board; `confirmed` freezes it once an organiser signs it off,
         * so a late re-grade cannot quietly change who advanced.
         */
        advancement: {
            count: { type: Number, default: 0 },
            /** Optional EventRound roster populated when the cut is confirmed. */
            targetRoundId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventRound', default: null },
            confirmed: {
                keys: [{ type: String }],
                names: [{ type: String }],
                at: { type: Date, default: null },
                by: { type: String, default: null },
            },
        },

        /** If set, only teams on this EventRound roster may sit the activity. */
        qualificationRoundId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventRound', default: null },

        // ── Host-paced rounds (custom_live) ──────────────────────────────
        //
        // The deadline is `endsAt`, an absolute instant, and it is the only
        // thing that decides whether an answer is late. `state` is stored for
        // the host's explicit lock and reveal, but readers must put it through
        // `effectiveRoundState()` — a round whose `endsAt` has passed is closed
        // whether or not anybody pressed anything.
        liveRound: {
            /** New on every open, so a re-asked question is a clean round. */
            instanceId: { type: mongoose.Schema.Types.ObjectId, default: null },
            questionIndex: { type: Number, default: 0 },
            state: {
                type: String,
                enum: ['idle', 'open', 'locked', 'revealed'],
                default: 'idle',
            },
            openedAt: { type: Date, default: null },
            endsAt: { type: Date, default: null },
            durationSeconds: { type: Number, default: null },
            revealedAt: { type: Date, default: null },

            /** `all`, or `teams` with the teamIds the host put on the spot. */
            target: {
                kind: { type: String, enum: ['all', 'teams'], default: 'all' },
                teamIds: [{ type: String }],
            },
        },

        /** Absolute deadline for the whole custom_live activity. */
        roundClock: {
            startedAt: { type: Date, default: null },
            endsAt: { type: Date, default: null },
            durationSeconds: { type: Number, default: null },
        },

        // ── KBC ──────────────────────────────────────────────────────────
        //
        // Kept identical to std's copy of this schema. Mongoose drops unknown
        // fields *silently*, so a stale model here does not error — the command
        // route would write a document with no phase and no contestant while
        // every response still returned 200, and the show would never advance.
        phase: {
            type: String,
            enum: [
                'lobby',
                'fastest_finger',
                'fastest_finger_result',
                'contestant_intro',
                'hot_seat',
                'answer_locked',
                'audience_poll',
                'answer_reveal',
                'leaderboard',
                'completed',
            ],
            default: 'lobby',
        },
        round: { type: Number, default: 1 },

        activeContestant: {
            participantId: { type: String },
            name: { type: String },
            teamId: { type: String },
            teamName: { type: String },
            seatedAt: { type: Date },
        },

        fastestFinger: {
            questionIndex: { type: Number },
            openedAt: { type: Date },
            closedAt: { type: Date },
            revealed: { type: Boolean, default: false },
        },

        timer: {
            startedAt: { type: Date },
            endsAt: { type: Date },
            durationSeconds: { type: Number },
        },

        answerState: {
            locked: { type: Boolean, default: false },
            lockedOption: { type: String },
            lockedAt: { type: Date },
        },

        audiencePoll: {
            questionIndex: { type: Number },
            status: { type: String, enum: ['idle', 'open', 'closed'], default: 'idle' },
            openedAt: { type: Date },
            closedAt: { type: Date },
            resultsVisible: { type: Boolean, default: false },
        },

        lifelines: {
            fiftyFifty: { type: Boolean, default: true },
            audiencePoll: { type: Boolean, default: true },
            skip: { type: Boolean, default: true },
            eliminatedOptions: [{ type: String }],
        },

        results: [{
            participantId: String,
            name: String,
            teamName: String,
            questionIndex: Number,
            selectedOption: String,
            correct: Boolean,
            pointsAwarded: Number,
            decidedAt: Date,
        }],
    },
    voting: {
        question: { type: String },
        options: [{ type: String }],
        allowMultiple: { type: Boolean, default: false },
        showLiveResults: { type: Boolean, default: true },
        votingDurationSeconds: { type: Number, default: 60 }
    },
    hunt: {
        checkpoints: [CheckpointSchema],
        ordered: { type: Boolean, default: true }
    },
    external: {
        url: { type: String },
        points: { type: Number, default: 200 },
        durationMinutes: { type: Number, default: 20 },
        secretKey: { type: String },
        // Team id -> score, written only by the signed external-score callback.
        // Declared here as well as in the admin app: without it, strict mode
        // strips the `$set` and a correctly signed score is silently not saved.
        scores: { type: Map, of: Number, default: undefined }
    },
    announcement: {
        message: { type: String },
        displaySeconds: { type: Number, default: 15 }
    },
    activatedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    order: { type: Number, default: 0 }
}, {
    collection: 'event_activities',
    timestamps: true
});

export default mongoose.models.EventActivity || mongoose.model('EventActivity', EventActivitySchema);
