/**
 * Turn a pasted or uploaded pack into questions a round can store.
 *
 * Packs arrive in more than one shape: a bare list, `{ questions }`, or a
 * full event file whose questions live under `quiz`. A row may call the
 * prompt `question` and the key `answer`. This accepts those and reports
 * every row it could not use, so one bad object does not throw the rest away.
 */

const TYPES = ['choice', 'text', 'mcq', 'truefalse', 'fillup'];
const SETS = ['easy', 'medium', 'hard', 'impossible'];

const POINTS = { easy: 5, medium: 10, hard: 20, impossible: 50 };

export function parseQuestionPack(raw, { shuffle = false, set = null, random = Math.random } = {}) {
  let data = raw;
  if (typeof raw === 'string') {
    const text = raw.trim();
    if (!text) return fail('Paste a JSON list, or a pack with a questions array.');
    try {
      data = JSON.parse(text);
    } catch {
      return fail('That text is not valid JSON.');
    }
  }

  const list = extractList(data);
  if (!list) return fail('No questions found. Use a list, { "questions": [] }, or a quiz pack.');

  const questions = [];
  const errors = [];
  const warnings = [];

  list.forEach((item, index) => {
    const row = normalise(item, index, set);
    if (row.error) errors.push(row.error);
    else {
      if (row.warning) warnings.push(row.warning);
      questions.push(row.question);
    }
  });

  if (shuffle && questions.length > 1) shuffleInPlace(questions, random);

  return { questions, errors, warnings };
}

/** A choice whose stored answer is not one of its options grades every attempt wrong. */
export function brokenQuestions(questions) {
  return (questions ?? []).filter((q) => {
    if (q?.source === 'spot') return false;
    if (q?.type === 'text' || q?.type === 'fillup') return !String(q.correctAnswer ?? '').trim();
    const options = Array.isArray(q?.options) ? q.options.filter(Boolean) : [];
    if (!options.length) return !String(q?.correctAnswer ?? '').trim();
    return !options.includes(q.correctAnswer);
  });
}

export function groupBySet(questions) {
  const groups = SETS.map((set) => ({
    set,
    questions: (questions ?? []).filter((q) => (q.difficulty || 'medium') === set),
  }));
  const other = (questions ?? []).filter((q) => !SETS.includes(q.difficulty || 'medium'));
  if (other.length) groups.push({ set: 'other', questions: other });
  return groups.filter((g) => g.questions.length > 0);
}

function fail(error) {
  return { questions: [], errors: [error], warnings: [] };
}

function extractList(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return null;
  if (Array.isArray(data.questions)) return data.questions;
  if (Array.isArray(data.quiz?.questions)) return data.quiz.questions;
  if (Array.isArray(data.data?.questions)) return data.data.questions;
  if (data.text || data.question || data.prompt) return [data];
  return null;
}

function normalise(item, index, setOverride) {
  const n = index + 1;
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return { error: `Question ${n} is not an object.` };
  }

  const text = str(item.text ?? item.question ?? item.prompt ?? item.q);
  if (!text) return { error: `Question ${n} has no text.` };

  let options = asOptions(item.options ?? item.choices);
  let correct = str(item.correctAnswer ?? item.answer ?? item.correct);
  const declared = str(item.type).toLowerCase();
  let type = TYPES.includes(declared) ? declared : (options.length ? 'choice' : 'text');
  if (type === 'truefalse' && options.length === 0) options = ['True', 'False'];

  if (options.length && correct) {
    const mapped = mapChoice(correct, options);
    if (mapped) correct = mapped;
  }
  if (type === 'truefalse') correct = canonicalTrueFalse(correct) || correct;

  const difficulty = SETS.includes(setOverride) ? setOverride : normalSet(item.difficulty ?? item.set ?? item.tier);
  const warning = answerWarning(n, type, options, correct, item.source);

  return {
    warning,
    question: {
      ...(item._id ? { _id: String(item._id) } : {}),
      text,
      type,
      options,
      correctAnswer: correct,
      acceptedAnswers: asStrings(item.acceptedAnswers),
      source: item.source === 'spot' ? 'spot' : 'pack',
      difficulty,
      points: num(item.points, POINTS[difficulty] ?? 10),
      ...(item.pool ? { pool: String(item.pool) } : {}),
      ...(item.imageUrl ? { imageUrl: String(item.imageUrl) } : {}),
    },
  };
}

function answerWarning(n, type, options, correct, source) {
  if (source === 'spot') return null;
  if ((type === 'text' || type === 'fillup') && !correct) return `Question ${n} has no correct answer.`;
  if ((type === 'choice' || type === 'mcq' || type === 'truefalse') && options.length && correct && !options.includes(correct)) {
    return `Question ${n}: "${correct}" is not one of the options.`;
  }
  if ((type === 'choice' || type === 'mcq' || type === 'truefalse') && !correct) {
    return `Question ${n} has no correct answer.`;
  }
  return null;
}

function mapChoice(correct, options) {
  const letter = correct.trim().toUpperCase();
  if (/^[A-F]$/.test(letter)) {
    const hit = options[letter.charCodeAt(0) - 65];
    if (hit) return hit;
  }
  if (/^[1-6]$/.test(letter)) {
    const hit = options[Number(letter) - 1];
    if (hit) return hit;
  }
  const folded = options.find((o) => o.toLowerCase() === correct.toLowerCase());
  return folded || null;
}

function canonicalTrueFalse(value) {
  const v = String(value ?? '').trim().toLowerCase();
  if (['true', 't', 'yes', 'y'].includes(v)) return 'True';
  if (['false', 'f', 'no', 'n'].includes(v)) return 'False';
  return '';
}

function normalSet(value) {
  const v = str(value).toLowerCase();
  return SETS.includes(v) ? v : 'medium';
}

function asOptions(value) {
  if (Array.isArray(value)) return value.map((o) => (typeof o === 'string' ? o : o?.text ?? o?.label ?? '')).map((s) => String(s).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(/\r?\n|\|/).map((s) => s.trim()).filter(Boolean);
  return [];
}

function asStrings(value) {
  if (!Array.isArray(value)) return [];
  return value.map((s) => String(s).trim()).filter(Boolean);
}

function str(value) {
  return String(value ?? '').trim();
}

function num(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function shuffleInPlace(list, random) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
}
