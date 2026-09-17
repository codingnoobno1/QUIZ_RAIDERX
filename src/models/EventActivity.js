import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true },
    /**
     * What a generated paper draws on, and what decides the question's value
     * when the paper defines a points table. Questions written before this
     * existed count as medium.
     */
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium', index: true },
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
        scoring: { type: String, enum: ['correct_only', 'speed_bonus', 'partial'], default: 'correct_only' },
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
        },

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
