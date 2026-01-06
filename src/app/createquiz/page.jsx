"use client";
import React, { useState } from 'react';
import useQuizData from '../quiztools/QuizData';
import { Box, Typography, Paper, MenuItem, TextField, Stack, Button } from '@mui/material';
import { QUESTION_TYPES } from './QuestionTypes';
import MCQQuestion from './MCQQuestion';
import FillupQuestion from './FillupQuestion';
import TrueFalseQuestion from './TrueFalseQuestion';
import MatchupQuestion from './MatchupQuestion';
import ShortAnswerQuestion from './ShortAnswerQuestion';
import LongAnswerQuestion from './LongAnswerQuestion';
import OrderingQuestion from './OrderingQuestion';
import DiagramQuestion from './DiagramQuestion';
import AssertionReasonQuestion from './AssertionReasonQuestion';
import ComprehensionQuestion from './ComprehensionQuestion';
import SimpleCodeQuestion from './SimpleCodeQuestion';
import BlockCodeQuestion from './BlockCodeQuestion';
import TestCaseCodeQuestion from './TestCaseCodeQuestion';
import FindOutputQuestion from './FindOutputQuestion';

const COMPONENTS = {
  mcq: MCQQuestion,
  fillup: FillupQuestion,
  truefalse: TrueFalseQuestion,
  matchup: MatchupQuestion,
  shortanswer: ShortAnswerQuestion,
  longanswer: LongAnswerQuestion,
  ordering: OrderingQuestion,
  diagram: DiagramQuestion,
  assertionreason: AssertionReasonQuestion,
  comprehension: ComprehensionQuestion,
  simplecode: SimpleCodeQuestion,
  blockcode: BlockCodeQuestion,
  testcasecode: TestCaseCodeQuestion,
  findoutput: FindOutputQuestion,
};

const DEFAULT_QUESTION = {
  mcq: { text: '', options: ['', ''], answer: '' },
  fillup: { text: '', answer: '' },
  truefalse: { text: '', answer: true },
  matchup: { text: '', pairs: [{ left: '', right: '' }] },
  shortanswer: { text: '', answer: '' },
  longanswer: { text: '', answer: '' },
  ordering: { text: '', items: [''] },
  diagram: { text: '', answer: '' },
  assertionreason: { assertion: '', reason: '', answer: '' },
  comprehension: { text: '', subQuestions: [''] },
  simplecode: { text: '', answer: '' },
  blockcode: { blocks: [] },
  testcasecode: { text: '', testCases: [{ input: '', output: '' }] },
  findoutput: { text: '', answer: '' },
};

export default function CreateQuizPage() {
  const [questionType, setQuestionType] = useState('mcq');
  const [question, setQuestion] = useState(DEFAULT_QUESTION['mcq']);
  const [time, setTime] = useState(60); // seconds
  const [level, setLevel] = useState('easy');
  const [score, setScore] = useState(1);

  // Get batch, subject from useQuizData
  const {
    selectedBatch,
    selectedSubject,
    quizStatusMap
  } = useQuizData();

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setQuestionType(type);
    setQuestion(DEFAULT_QUESTION[type]);
  };

  const QuestionComponent = COMPONENTS[questionType];

  return (
    <Box
      minHeight="100vh"
      sx={{
        backgroundImage:
          'url(https://png.pngtree.com/thumb_back/fh260/background/20211023/pngtree-aesthetic-plain-background-with-pastel-colors-image_913186.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, md: 6 },
      }}
    >
      <Paper elevation={6} sx={{ p: 4, borderRadius: 4, minWidth: 350, maxWidth: 600, width: '100%', bgcolor: 'rgba(255,255,255,0.97)' }}>
        <Typography variant="h4" fontWeight={900} color="#6C3483" mb={3} textAlign="center">
          Create a Quiz Question
        </Typography>
        {/* Display batch, subject, quiz info */}
        <Stack spacing={1} mb={2}>
          <Typography variant="subtitle1" color="text.secondary">
            <b>Batch:</b> {selectedBatch ? (selectedBatch.batch || selectedBatch.course || '-') : '-'}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            <b>Subject:</b> {selectedSubject || '-'}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            <b>Quiz Type:</b> {questionType ? questionType.charAt(0).toUpperCase() + questionType.slice(1) : '-'}
          </Typography>
        </Stack>
        <Stack spacing={3}>
          <TextField
            select
            label="Question Type"
            value={questionType}
            onChange={handleTypeChange}
            fullWidth
            sx={{ fontWeight: 700 }}
          >
            {QUESTION_TYPES.map((qt) => (
              <MenuItem key={qt.value} value={qt.value}>{qt.label}</MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Time (sec)"
              type="number"
              value={time}
              onChange={e => setTime(Number(e.target.value))}
              sx={{ width: 120 }}
              inputProps={{ min: 1 }}
            />
            <TextField
              select
              label="Level"
              value={level}
              onChange={e => setLevel(e.target.value)}
              sx={{ width: 120 }}
            >
              <MenuItem value="easy">Easy</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="hard">Hard</MenuItem>
            </TextField>
            <TextField
              label="Score"
              type="number"
              value={score}
              onChange={e => setScore(Number(e.target.value))}
              sx={{ width: 120 }}
              inputProps={{ min: 1 }}
            />
          </Stack>
          <QuestionComponent question={question} setQuestion={setQuestion} />
          <Button variant="contained" color="secondary" size="large" sx={{ fontWeight: 700 }}>
            Save Question
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
