# Quiz Duplicate Submission Prevention - Feature Documentation

## Overview
Implemented a system to prevent students from taking the same quiz multiple times by tracking submissions at both the Quiz and Result levels.

## Implementation Details

### 1. Database Schema Changes

#### Quiz Model (`Quiz.js`)
Added `submittedBy` array to track all students who have completed the quiz:
```javascript
submittedBy: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}]
```

#### Result Model (No changes needed)
Already tracking `studentId` and `status` which we use for validation.

---

### 2. API Route Changes

#### A. `/api/quiz/attempt/start` (POST)
**Purpose:** Initialize quiz attempt with duplicate check

**New Request Body:**
```json
{
  "quizId": "66a...",
  "studentName": "John Doe"
}
```

**Validation Logic:**
```javascript
// 1. Get student identifier
const studentIdentifier = studentName || cookieStore.get('studentName')?.value;

// 2. Check Result collection for completed attempts
const existingSubmission = await Result.findOne({
  quizId,
  studentId: studentIdentifier,
  status: 'completed'
});

// 3. Check Quiz.submittedBy array
const quiz = await Quiz.findById(quizId);
if (quiz.submittedBy.includes(studentIdentifier)) {
  // Quiz already taken
}
```

**Response on Duplicate:**
```json
{
  "error": "Quiz already submitted",
  "message": "You have already completed this quiz on 1/4/2026",
  "alreadySubmitted": true,
  "score": 8.5
}
```

**HTTP Status:** 403 Forbidden

---

#### B. `/api/quiz/attempt/submit` (POST)
**New Logic:** After successful grading, add student to Quiz.submittedBy

```javascript
// After saving result
if (resultRecord.studentId) {
  await Quiz.findByIdAndUpdate(
    resultRecord.quizId,
    { $addToSet: { submittedBy: resultRecord.studentId } }
  );
}
```

**Note:** Using `$addToSet` prevents duplicate entries if called multiple times.

---

### 3. Frontend Changes

#### `/quizmode/[id]/page.jsx`
**Student Name Collection:**
```javascript
// Get name from localStorage or prompt user
const studentName = localStorage.getItem('studentName') || prompt('Enter your name:');
if (studentName) {
  localStorage.setItem('studentName', studentName);
}
```

**Start Request:**
```javascript
const startRes = await fetch('/api/quiz/attempt/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ quizId, studentName })
});
```

**Handle Already Submitted:**
```javascript
if (!startRes.ok) {
  if (startData.alreadySubmitted) {
    alert(`${startData.message}\nYour previous score: ${startData.score || 'N/A'}`);
    window.location.href = '/coding-club/quiz';
    return;
  }
}
```

---

## User Flow

### First Time Taking Quiz
```
1. Student navigates to /quizmode/[id]
2. System prompts for name (if not in localStorage)
3. API checks: No previous submission found ✓
4. Quiz starts normally
5. Student completes and submits
6. Backend:
   - Grades answers
   - Saves Result with status='completed'
   - Adds student to Quiz.submittedBy array
```

### Second Attempt (Duplicate)
```
1. Student navigates to /quizmode/[id]
2. System retrieves name from localStorage
3. API checks:
   - Result.findOne({ quizId, studentId, status: 'completed' }) → Found ❌
   OR
   - Quiz.submittedBy.includes(studentId) → True ❌
4. API returns 403 with alreadySubmitted=true
5. Frontend shows:
   "You have already completed this quiz on 1/4/2026
   Your previous score: 8.5"
6. Redirects to quiz list page
```

---

## Security Considerations

### Student Identification
Currently using `studentName` stored in:
1. **localStorage** (client-side)
2. **Result.studentId** (database)
3. **Quiz.submittedBy** (database)

**Limitation:** Students can clear localStorage and use a different name to bypass restriction.

**Future Enhancement:** Integrate with proper authentication system (NextAuth):
```javascript
const session = await getServerSession(authOptions);
const studentId = session?.user?.id; // MongoDB ObjectId
```

---

## Testing Checklist

- [x] Model updated with submittedBy array
- [x] Start API validates duplicate submissions
- [x] Submit API adds student to submittedBy
- [x] Frontend prompts for student name
- [x] Frontend handles alreadySubmitted response
- [ ] Test: Take quiz first time → Should work
- [ ] Test: Try same quiz again → Should block with message
- [ ] Test: Clear localStorage and retry → Should still block (via Result check)
- [ ] Test: Different student name → Should work (new submission)

---

## Database Queries

### Check if student has submitted a quiz
```javascript
const hasSubmitted = await Result.findOne({
  quizId: '66a...',
  studentId: 'John Doe',
  status: 'completed'
});
```

### Get all students who submitted a quiz
```javascript
const quiz = await Quiz.findById('66a...').populate('submittedBy');
console.log(quiz.submittedBy); // Array of students
```

### Count total submissions for a quiz
```javascript
const submissionCount = await Result.countDocuments({
  quizId: '66a...',
  status: 'completed'
});
```
