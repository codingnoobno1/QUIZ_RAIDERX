import test from 'node:test';
import assert from 'node:assert/strict';
import { brokenQuestions, parseQuestionPack } from '../src/lib/questionPack.mjs';

test('reads a quiz pack and a bare list', () => {
  const pack = parseQuestionPack({
    quiz: { questions: [{ text: 'Bits in a byte?', options: ['4', '8'], answer: 'B', difficulty: 'easy', points: 5 }] },
  });
  assert.equal(pack.errors.length, 0);
  assert.equal(pack.questions[0].correctAnswer, '8');
  assert.equal(pack.questions[0].difficulty, 'easy');
  assert.equal(pack.questions[0].points, 5);

  const list = parseQuestionPack('[{"question":"Hi","choices":["Yes","No"],"correct":"1"}]');
  assert.equal(list.questions[0].text, 'Hi');
  assert.equal(list.questions[0].correctAnswer, 'Yes');
});

test('keeps valid rows when one row is broken', () => {
  const parsed = parseQuestionPack([
    { text: 'Ok', options: ['A', 'B'], correctAnswer: 'A' },
    { options: ['A'] },
    'nope',
  ]);
  assert.equal(parsed.questions.length, 1);
  assert.equal(parsed.errors.length, 2);
});

test('a set override stamps every imported question', () => {
  const parsed = parseQuestionPack(
    [{ text: 'One', correctAnswer: 'x' }, { text: 'Two', difficulty: 'easy', correctAnswer: 'y' }],
    { set: 'hard' },
  );
  assert.deepEqual(parsed.questions.map((q) => q.difficulty), ['hard', 'hard']);
});

test('shuffle uses the supplied random source', () => {
  const parsed = parseQuestionPack(
    [{ text: 'A', correctAnswer: 'a' }, { text: 'B', correctAnswer: 'b' }, { text: 'C', correctAnswer: 'c' }],
    { shuffle: true, random: () => 0 },
  );
  assert.deepEqual(parsed.questions.map((q) => q.text), ['B', 'C', 'A']);
});

test('flags a correct answer that is not an option', () => {
  const parsed = parseQuestionPack([{ text: 'Q', options: ['A', 'B'], correctAnswer: 'C' }]);
  assert.equal(brokenQuestions(parsed.questions).length, 1);
  assert.equal(parsed.warnings.length, 1);
});
