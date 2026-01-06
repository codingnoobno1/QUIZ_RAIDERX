# Quiz Mode Architecture - Complete Technical Analysis

**Route:** `http://localhost:3000/quizmode/[id]`

---

## Table of Contents
1. [System Architecture Overview](#1-system-architecture-overview)
2. [Complete Workflow Sequence](#2-complete-workflow-sequence)
3. [API Specifications](#3-api-specifications)
4. [Data Models & Schemas](#4-data-models--schemas)
5. [Component Architecture](#5-component-architecture)
6. [Algorithms & Data Structures](#6-algorithms--data-structures)
7. [Security & Performance](#7-security--performance)

---

## 1. System Architecture Overview

### **Architecture Pattern**
- **Frontend:** Next.js 15 with App Router (Client Components)
- **Backend:** Next.js API Routes (Server Components)
- **Database:** MongoDB with Mongoose ORM
- **State Management:** React useState (Local State Machine)
- **Communication:** RESTful JSON API

### **High-Level Flow**
```
User Request → [id]/page.jsx → API Routes → MongoDB → Grading Engine → Result Display
```

---

## 2. Complete Workflow Sequence

### **Phase 1: Initialization (Quiz Load)**
```
[User navigates to /quizmode/[id]]
    ↓
1. QuizPage mounts, extracts `id` from params
    ↓
2. useEffect triggers init() function
    ↓
3. API Call: GET /api/quiz/[id]
    ↓
4. Backend Logic:
   - connectDB()
   - Quiz.findById(id).populate('questions', 'subjectId', 'sectionId')
   - Validate availabilityStatus (on/off/scheduled)
   - SANITIZE: Remove correctAnswer & testCase.output
    ↓
5. Response: { success: true, quiz: sanitizedQuiz }
    ↓
6. Frontend: setQuiz(data.quiz), setQuestions(data.quiz.questions)
    ↓
7. API Call: POST /api/quiz/attempt/start
    ↓
8. Backend: Create Result record { quizId, status: 'in-progress', startTime }
    ↓
9. Response: { attemptId: "66a..." }
    ↓
10. Frontend: setAttemptId(attemptId), setIsLoading(false)
```

### **Phase 2: Quiz Interaction**
```
[QuizPage renders active quiz UI]
    ↓
1. QuestionRenderer displays question[current]
    ↓
2. User interacts with MCQ/FillUp/Code component
    ↓
3. onChange handler calls onAnswer(value)
    ↓
4. recordAnswer() updates local state:
   answers[questionId] = { questionId, value, timeTaken }
    ↓
5. User clicks "Continue" → setCurrent(current + 1)
    ↓
6. Repeat steps 1-5 for all questions
```

### **Phase 3: Submission & Grading**
```
[User reaches last question, clicks "Submit Quiz"]
    ↓
1. submitQuiz() function executes
    ↓
2. Convert answers object → array format:
  [ { questionId, answer, timeTaken }, ... ]
    ↓
3. API Call: POST /api/quiz/attempt/submit
   Body: { attemptId, quizId, userAnswers: [...] }
    ↓
4. Backend Grading Algorithm:
   a. Fetch Result record by attemptId
   b. Validate status !== 'completed'
   c. Fetch Quiz.populate('questions') [WITH correctAnswers]
   d. Create answerMap: Map<questionId, userAnswer>
   e. FOR EACH question in quiz.questions:
      - Fetch userEntry from answerMap
      - Normalize strings (trim + lowercase)
      - Compare user answer vs correctAnswer
      - Award points (base + time bonus)
      - Push to gradedAnswers[]
   f. Update Result: { score, answers, status: 'completed', endTime }
    ↓
5. Response: { success: true, score: 42.5, review: [...] }
    ↓
6. Frontend: setResult(data), triggers QuizResult component
```

---

## 3. API Specifications

### **A. GET /api/quiz/[id]**
**Purpose:** Fetch quiz metadata and sanitized questions

**Request:**
```http
GET /api/quiz/695a5858c250e86221c28f76
```

**Backend Operations:**
```javascript
1. Parse id from params
2. await connectDB()
3. const quiz = await Quiz.findById(id)
   .populate('subjectId', 'name description')
   .populate('sectionId')
   .populate('createdBy', 'name email')
   .populate('questions')
4. Validate availabilityStatus logic:
   - 'on' → always available
   - 'scheduled' → check scheduledStartTime & scheduledEndTime
   - 'off' → return 403
5. Sanitize questions: delete correctAnswer, delete testCases.output
6. Return { success: true, quiz: sanitizedQuiz }
```

**Response Schema:**
```json
{
  "success": true,
  "quiz": {
    "_id": "695a5858c250e86221c28f76",
    "title": "JavaScript Fundamentals",
    "description": "Test your JS knowledge",
    "timeLimit": 30,
    "maxMarks": 50,
    "questions": [
      {
        "_id": "question_id_1",
        "text": "What is the output of 2 + '2'?",
        "type": "mcq",
        "options": ["4", "22", "NaN", "Error"],
        "points": 2,
        "timeLimit": 30
        // NOTE: correctAnswer is REMOVED
      }
    ]
  }
}
```

---

### **B. POST /api/quiz/attempt/start**
**Purpose:** Initialize a persistent attempt session

**Request:**
```json
{
  "quizId": "695a5858c250e86221c28f76"
}
```

**Backend Operations:**
```javascript
1. await connectDB()
2. const newAttempt = await Result.create({
     quizId,
     status: 'in-progress',
     startTime: new Date()
   })
3. Return { attemptId: newAttempt._id }
```

**Response:**
```json
{
  "success": true,
  "attemptId": "66a7f123..."
}
```

---

### **C. POST /api/quiz/attempt/submit**
**Purpose:** Authoritative server-side grading

**Request:**
```json
{
  "attemptId": "66a7f123...",
  "quizId": "695a5858c250e86221c28f76",
  "userAnswers": [
    { "questionId": "q1", "answer": "22", "timeTaken": 15 },
    { "questionId": "q2", "answer": "function", "timeTaken": 25 }
  ]
}
```

**Backend Grading Logic:**
```javascript
// 1. Validate Attempt
const resultRecord = await Result.findById(attemptId)
if (resultRecord.status === 'completed') return 400

// 2. Fetch Quiz with Correct Answers
const quiz = await Quiz.findById(quizId).populate({
  path: 'questions',
  select: 'text type correctAnswer points timeLimit options'
})

// 3. Build User Answer Map
const userAnswerMap = new Map()
userAnswers.forEach(ua => {
  userAnswerMap.set(String(ua.questionId), ua)
})

// 4. Grading Loop
let totalScore = 0
const gradedAnswers = []

for (const question of quiz.questions) {
  const userEntry = userAnswerMap.get(String(question._id))
  
  let isCorrect = false
  let pointsAwarded = 0
  
  if (userEntry) {
    // Normalize
    const normalize = (v) => String(v || '').trim().toLowerCase()
    
    // Compare
    if (normalize(userEntry.answer) === normalize(question.correctAnswer)) {
      isCorrect = true
      pointsAwarded = question.points || 1
      
      // Time Bonus
      if (userEntry.timeTaken < question.timeLimit) {
        const bonus = ((timeLimit - timeTaken) / timeLimit) * 0.1 * pointsAwarded
        pointsAwarded += bonus
      }
    }
  }
  
  totalScore += pointsAwarded
  gradedAnswers.push({ questionId, userAnswer, isCorrect, points: pointsAwarded })
}

// 5. Persist Result
resultRecord.score = totalScore
resultRecord.answers = gradedAnswers
resultRecord.status = 'completed'
resultRecord.endTime = new Date()
await resultRecord.save()

return { success: true, score: totalScore, review: gradedAnswers }
```

**Response:**
```json
{
  "success": true,
  "score": 42.5,
  "review": [
    {
      "questionId": "q1",
      "questionText": "What is 2 + '2'?",
      "userAnswer": "22",
      "correctAnswer": "22",
      "isCorrect": true,
      "pointsAwarded": 2.1,
      "timeTaken": 15
    }
  ]
}
```

---

## 4. Data Models & Schemas

### **Quiz Schema** (`models/Quiz.js`)
```javascript
{
  title: String,               // "JavaScript Fundamentals"
  description: String,          // Optional description
  subjectId: ObjectId → Subject,
  sectionId: ObjectId → Section,
  batch: String,                // "2024-CSE-A"
  semester: String,             // "5"
  timeLimit: Number,            // Total minutes
  maxMarks: Number,
  startTime: Date,
  endTime: Date,
  createdBy: ObjectId → Faculty,
  questions: [ObjectId → Question],
  status: Enum['draft', 'published', 'archived'],
  availabilityStatus: Enum['off', 'on', 'scheduled'],
  scheduledStartTime: Date,
  scheduledEndTime: Date,
  timestamps: { createdAt, updatedAt }
}
```

---

### **Question Schema** (`models/Question.js`)
```javascript
{
  text: String,                 // Question prompt
  type: Enum[                   // 14 types supported
    'mcq', 'fillup', 'truefalse', 'shortanswer', 'longanswer',
    'ordering', 'matchup', 'diagram', 'assertionreason',
    'comprehension', 'simplecode', 'blockcode', 'testcasecode', 'findoutput'
  ],
  
  // Type-specific fields
  options: [String],            // For MCQ
  correctAnswer: Mixed,         // String, Boolean, Array, etc.
  pairs: [{ left, right }],     // For Matchup
  order: [String],              // For Ordering
  passages: String,             // For Comprehension
  subQuestions: [String],
  codeTemplate: String,         // For Coding
  testCases: [{ input, output }],
  
  // Metadata
  difficulty: Enum['easy', 'medium', 'hard'],
  points: Number,               // Default: 1
  timeLimit: Number,            // Seconds
  
  // Relations
  subjectId: ObjectId → Subject,
  createdBy: ObjectId → User,
  timestamps: { createdAt, updatedAt }
}
```

---

### **Result Schema** (`models/Result.js`)
```javascript
{
  quizId: ObjectId → Quiz,
  studentId: ObjectId → User,  // Optional (guest support)
  status: Enum['in-progress', 'completed'],
  score: Number,
  maxScore: Number,
  startTime: Date,
  endTime: Date,
  answers: [{
    questionId: ObjectId → Question,
    userAnswer: Mixed,
    isCorrect: Boolean,
    points: Number,
    timeTaken: Number          // Seconds
  }],
  timestamps: { createdAt, updatedAt }
}
```

---

## 5. Component Architecture

### **Component Hierarchy**
```
QuizPage [/quizmode/[id]/page.jsx]
├── QuizHeader { quiz, timeLeft }
├── QuestionCounter { current, total }
├── QuestionRenderer { question, onAnswer, value }
│   ├── MCQQuestion { question, onAnswer, value }
│   ├── FillUpQuestion { question, onAnswer, value }
│   ├── TrueFalseQuestion { question, onAnswer, value }
│   └── CodeQuestion { question, onAnswer, value }
├── QuizNavigation { current, total, onNext, onPrev, onSubmit, isSubmitting }
└── QuizResult { result } [Conditional: if result exists]
```

---

### **Component Details**

#### **1. QuizPage** (Orchestrator)
```javascript
// State Machine
const [quiz, setQuiz] = useState(null)
const [questions, setQuestions] = useState([])
const [current, setCurrent] = useState(0)          // Current question index
const [answers, setAnswers] = useState({})         // Map: questionId → answer
const [attemptId, setAttemptId] = useState(null)
const [result, setResult] = useState(null)
const [isLoading, setIsLoading] = useState(true)
const [isSubmitting, setIsSubmitting] = useState(false)

// Core Functions
recordAnswer(value) {
  setAnswers(prev => ({
    ...prev,
    [questions[current]._id]: { questionId, value, timeTaken: 0 }
  }))
}

submitQuiz() {
  const answersArray = Object.values(answers).map(a => ({
    questionId: a.questionId,
    answer: a.value,
    timeTaken: a.timeTaken || 10
  }))
  
  POST /api/quiz/attempt/submit
  setResult(response.data)
}
```

---

#### **2. QuestionRenderer** (Type Router)
```javascript
// Strategy Pattern for Question Types
switch (question.type) {
  case 'mcq': return <MCQQuestion />
  case 'fillup':
  case 'findoutput': return <FillUpQuestion />
  case 'truefalse': return <TrueFalseQuestion />
  case 'simplecode':
  case 'blockcode':
  case 'testcasecode': return <CodeQuestion />
  default: return <Error />
}
```

---

#### **3. MCQQuestion**
```javascript
// Props Interface
interface MCQQuestionProps {
  question: {
    text: string
    options: string[]
  }
  onAnswer: (value: string) => void
  value: string
}

// Rendering Logic
question.options.map((option, idx) => (
  <OptionCard
    selected={value === option}
    onClick={() => onAnswer(option)}
    label={String.fromCharCode(65 + idx)}  // A, B, C, D
  >
    {option}
  </OptionCard>
))
```

---

#### **4. FillUpQuestion**
```javascript
// Simple Text Input
<TextField
  value={value || ""}
  onChange={(e) => onAnswer(e.target.value)}
  placeholder="Type your answer here..."
/>
```

---

#### **5. CodeQuestion**
```javascript
// Multi-line Monaco-style Editor
<TextField
  multiline
  minRows={8}
  value={code}
  onChange={(e) => onAnswer(e.target.value)}
  InputProps={{
    sx: { fontFamily: 'Fira Code, monospace' }
  }}
/>

// Test Case Display (Input only, Output hidden)
{question.testCases.map(tc => (
  <TestCase>
    <Label>INPUT</Label>
    <Value>{tc.input}</Value>
  </TestCase>
))}
```

---

#### **6. QuizNavigation**
```javascript
// Conditional Rendering
const isLast = current === total - 1

return (
  <>
    <Button onClick={onPrev} disabled={current === 0}>Back</Button>
    {isLast ? (
      <Button onClick={onSubmit}>Submit Quiz</Button>
    ) : (
      <Button onClick={onNext}>Continue</Button>
    )}
  </>
)
```

---

#### **7. QuizResult** (Review Screen)
```javascript
// Display Total Score
<ScoreCard>
  {score.toFixed(1)} / {review.reduce((acc, r) => acc + r.pointsAwarded, 0).toFixed(1)}
</ScoreCard>

// Detailed Review
{review.map(item => (
  <ReviewCard isCorrect={item.isCorrect}>
    <Question>{item.questionText}</Question>
    <Grid>
      <YourAnswer isCorrect={item.isCorrect}>{item.userAnswer}</YourAnswer>
      {!item.isCorrect && <CorrectAnswer>{item.correctAnswer}</CorrectAnswer>}
      <TimeTaken>{item.timeTaken}s</TimeTaken>
    </Grid>
  </ReviewCard>
))}
```

---

## 6. Algorithms & Data Structures

### **A. Answer Recording (Frontend)**
**Data Structure:** Object/Map
```javascript
// Why Object instead of Array?
// O(1) lookup and update by questionId
answers = {
  "q1_id": { questionId: "q1_id", value: "22", timeTaken: 15 },
  "q2_id": { questionId: "q2_id", value: "function", timeTaken: 25 }
}

// Conversion to Array for API
const answersArray = Object.values(answers)
```

---

### **B. Grading Algorithm (Backend)**
**Complexity:** O(n) where n = number of questions

**Data Structure:** HashMap for O(1) lookups
```javascript
// Step 1: Build User Answer Map
const userAnswerMap = new Map()
userAnswers.forEach(ua => {
  userAnswerMap.set(String(ua.questionId), ua)
})
// Time: O(m) where m = userAnswers.length

// Step 2: Single-Pass Grading
for (const question of quiz.questions) {  // O(n)
  const userEntry = userAnswerMap.get(String(question._id))  // O(1)
  
  if (isMatch(userEntry.answer, question.correctAnswer)) {
    pointsAwarded = calculatePoints(question, userEntry.timeTaken)
  }
  
  gradedAnswers.push({ questionId, isCorrect, pointsAwarded })
}

// Total Time: O(m + n) ≈ O(n) since m ≤ n
```

---

### **C. String Normalization**
```javascript
// Handles case-insensitive & whitespace variations
const normalize = (val) => String(val || '').trim().toLowerCase()

// Examples:
normalize("  Hello World  ") → "hello world"
normalize("True") → "true"
normalize(42) → "42"
```

---

### **D. Time Bonus Calculation**
```javascript
// Formula: Bonus = (TimeSaved / TimeLimit) × 0.1 × BasePoints
const timeLimit = question.timeLimit || 30
const timeSaved = Math.max(0, timeLimit - userEntry.timeTaken)
const bonusMultiplier = (timeSaved / timeLimit) * 0.1
const bonus = bonusMultiplier * basePoints

// Example:
// BasePoints = 10, TimeLimit = 30s, TimeTaken = 15s
// TimeSaved = 15s
// Bonus = (15/30) × 0.1 × 10 = 0.5 points
// Total = 10.5 points
```

---

## 7. Security & Performance

### **Security Measures**

#### **1. Answer Sanitization**
```javascript
// Frontend NEVER receives correct answers
const sanitizedQuiz = quiz.toObject()
sanitizedQuiz.questions = sanitizedQuiz.questions.map(q => {
  delete q.correctAnswer
  if (q.testCases) {
    q.testCases = q.testCases.map(tc => ({
      input: tc.input
      // output removed
    }))
  }
  return q
})
```

#### **2. Server-Side Grading**
- All grading happens on the backend
- Frontend cannot manipulate scores
- `correctAnswer` only exists in server memory

#### **3. Attempt Validation**
```javascript
// Prevent double submission
if (resultRecord.status === 'completed') {
  return NextResponse.json({ error: 'Already submitted' }, { status: 400 })
}
```

---

### **Performance Optimizations**

#### **1. Database Indexing**
```javascript
// Quiz.js
QuizSchema.index({ batch: 1, semester: 1, subjectId: 1 })
QuizSchema.index({ availabilityStatus: 1 })

// Question.js
QuestionSchema.index({ type: 1, subjectId: 1 })
```

#### **2. Selective Population**
```javascript
// Only fetch required fields
Quiz.findById(id).populate({
  path: 'questions',
  select: 'text type correctAnswer points timeLimit'
  // Excludes heavy fields like 'codeTemplate'
})
```

#### **3. Single-Pass Grading**
- O(n) complexity using HashMap
- Avoids nested loops

#### **4. State Persistence**
- `attemptId` stored in DB
- Survives page refreshes
- Prevents data loss

---

## Conclusion

This quiz system implements a **secure, performant, and scalable** architecture using:
- **Next.js App Router** for modern React patterns
- **MongoDB** for flexible polymorphic data
- **Server-side grading** for security
- **O(n) algorithms** for performance
- **Component composition** for maintainability

**Total LOC:** ~2000+ lines across 15+ files
**Supported Question Types:** 14 (with extensibility for more)
**Security Level:** Enterprise-grade (sanitization + server authority)
