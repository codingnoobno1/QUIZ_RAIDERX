# Quiz Results API Documentation

## Endpoint: GET /api/quiz/results

### Purpose
Fetch all completed quiz submissions for admin review. Shows student names, scores, timing, and performance metrics.

---

## Request

### URL
```
GET /api/quiz/results
GET /api/quiz/results?quizId=66a...
```

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| quizId | String | No | Filter results by specific quiz ID |

### Example Request
```javascript
// Fetch all results
const response = await fetch('/api/quiz/results');

// Fetch results for specific quiz
const response = await fetch('/api/quiz/results?quizId=66a5858c250e86221c28f76');
```

---

## Response

### Success Response (200)
```json
{
  "success": true,
  "count": 15,
  "results": [
    {
      "id": "66b123...",
      "studentName": "John Doe",
      "quizTitle": "JavaScript Fundamentals",
      "quizBatch": "2024-CSE-A",
      "quizSemester": "5",
      "score": "8.50",
      "maxScore": 10,
      "percentage": "85.0%",
      "totalQuestions": 10,
      "correctAnswers": 8,
      "startTime": "2026-01-04T16:30:00Z",
      "endTime": "2026-01-04T16:45:00Z",
      "timeTaken": "15 min"
    },
    // ... more results
  ]
}
```

### Error Response (500)
```json
{
  "error": "Failed to fetch quiz results",
  "details": "Connection timeout"
}
```

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| id | String | Result record ID (MongoDB ObjectId) |
| studentName | String | Student identifier (name from localStorage) |
| quizTitle | String | Title of the quiz taken |
| quizBatch | String | Batch code (e.g., "2024-CSE-A") |
| quizSemester | String | Semester number |
| score | String | Total score achieved (formatted to 2 decimals) |
| maxScore | Number/String | Maximum possible score |
| percentage | String | Score percentage with % symbol |
| totalQuestions | Number | Total questions in quiz |
| correctAnswers | Number | Number of questions answered correctly |
| startTime | ISO Date | When student started the quiz |
| endTime | ISO Date | When student submitted the quiz |
| timeTaken | String | Duration in minutes (formatted) |

---

## Usage Examples

### Admin Dashboard
```jsx
const QuizResults = () => {
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchResults = async () => {
      const res = await fetch('/api/quiz/results');
      const data = await res.json();
      setResults(data.results);
    };
    fetchResults();
  }, []);

  return (
    <Table>
      {results.map(r => (
        <Row key={r.id}>
          <Cell>{r.studentName}</Cell>
          <Cell>{r.score} / {r.maxScore}</Cell>
          <Cell>{r.percentage}</Cell>
        </Row>
      ))}
    </Table>
  );
};
```

### Filter by Quiz
```javascript
const fetchQuizResults = async (quizId) => {
  const response = await fetch(`/api/quiz/results?quizId=${quizId}`);
  const data = await response.json();
  console.log(`Found ${data.count} submissions for this quiz`);
  return data.results;
};
```

---

## Database Queries

The endpoint performs the following operations:

```javascript
// 1. Query completed results
const results = await Result.find({ 
  status: 'completed',
  quizId: quizId // if filter applied
})

// 2. Populate quiz details
.populate({
  path: 'quizId',
  select: 'title description maxMarks batch semester'
})

// 3. Sort by most recent
.sort({ endTime: -1 })
```

---

## Performance Considerations

- **Indexed Fields**: Results are sorted by `endTime` (should be indexed)
- **Population**: Quiz details are populated (1 extra query per unique quiz)
- **Lean**: Uses `.lean()` for faster read-only queries
- **Pagination**: Not implemented yet (add `?limit=50&skip=0` support for large datasets)

---

## Access Control

**Current:** No authentication required (open endpoint)

**Recommended:** Add admin-only middleware:
```javascript
import { getServerSession } from 'next-auth';

export async function GET(request) {
  const session = await getServerSession();
  
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // ... rest of logic
}
```

---

## UI Integration

### QuizResultsPage Component
Located at: `/quiz-results`

**Features:**
- ✅ Real-time results table
- ✅ Filter by quiz dropdown
- ✅ Color-coded scores (green >70%, yellow >50%, red <50%)
- ✅ Responsive table with dark mode styling
- ✅ Shows correct/total questions ratio
- ✅ Displays submission time and duration

**Screenshot Preview:**
```
┌─────────────────────────────────────────────────────────────┐
│ Quiz Results Dashboard                                       │
├─────────────────────────────────────────────────────────────┤
│ Filter: [All Quizzes ▼]    Showing 15 of 15 results        │
├─────────┬──────────┬───────┬───────┬────────┬──────┬───────┤
│ Student │ Quiz     │ Batch │ Score │ Q's    │ Time │ Date  │
├─────────┼──────────┼───────┼───────┼────────┼──────┼───────┤
│ John    │ JS Fund. │ 2024  │ 8.5   │ ✓8/10  │ 15m  │ 1/4   │
│         │          │ CSE-A │ 85%   │        │      │ 16:45 │
└─────────┴──────────┴───────┴───────┴────────┴──────┴───────┘
```
