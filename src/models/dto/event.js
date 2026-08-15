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
    /** An organiser has a mode running right now. */
    get isLive() {
      return Boolean(this.activeMode?.type) || this.onDuty;
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
  }));

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
    status: str(json.status, 'pending'),
    entryTime: date(json.entryTime),
    exitTime: date(json.exitTime),
    entryCount: num(json.entryCount),
    exitCount: num(json.exitCount),

    // ── derived ──
    get isTeam() {
      return this.registrationType === 'team';
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

  if (type === 'quiz') {
    const q = json.quiz ?? {};
    base.quiz = {
      quizType: str(q.quizType, 'rapid_fire'),
      timePerQuestion: num(q.timePerQuestion, 10),
      totalQuestions: num(q.totalQuestions),
      currentQuestion: num(q.currentQuestion),
      autoAdvance: bool(q.autoAdvance, true),
      shuffle: bool(q.shuffle),
      /** custom_live: the host controls which question is showing. */
      activeQuestion: q.activeQuestion
        ? {
            /** What the grader matches on. Answers submitted without it score zero. */
            id: id(q.activeQuestion._id ?? q.activeQuestion.id),
            index: num(q.activeQuestion.index),
            text: str(q.activeQuestion.text, 'Question unavailable'),
            options: list(q.activeQuestion.options).map((o) => str(o)),
            points: num(q.activeQuestion.points, 10),
          }
        : null,
      /** rapid_fire / preloaded: full pack, graded locally then confirmed server-side. */
      questions: list(q.questions).map((qu) => ({
        id: id(qu?._id ?? qu?.id),
        text: str(qu?.text, 'Question unavailable'),
        options: list(qu?.options).map((o) => str(o)),
        correctAnswer: str(qu?.correctAnswer),
        points: num(qu?.points, 10),
        imageUrl: str(qu?.imageUrl) || null,
      })),
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

/** The whole status envelope: { success, data: { activeActivity, onDuty, serverTime } } */
export function toEventStatus(json) {
  const data = json?.data ?? json ?? {};
  return {
    eventId: str(data.eventId),
    onDuty: bool(data.onDuty),
    activeActivity: data.activeActivity ? toLiveActivity(data.activeActivity) : null,
    serverTime: date(data.serverTime),
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
