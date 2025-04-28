'use client';
import { useRouter } from 'next/router';
import { Typography, Avatar, Paper } from '@mui/material';

// Dummy data for example (replace with actual facultyData)
const facultyData = [
  {
    name: 'John Doe',
    imageUrl: '/john-doe.jpg',
    subject: 'Mathematics',
    numberOfQuizzes: 5,
    questionLevel: 'Intermediate',
  },
  // Add more faculty data as needed
];

const FacultyPage = () => {
  const router = useRouter();
  const { facultyName } = router.query; // Destructure facultyName from the router query

  // Wait for facultyName to be defined before attempting to find the faculty
  if (!facultyName) {
    return <Typography variant="h6">Loading...</Typography>;
  }

  const faculty = facultyData.find((faculty) => faculty.name === facultyName);

  return (
    <div className="container">
      {faculty ? (
        <Paper sx={{ padding: 4 }}>
          <Avatar alt={faculty.name} src={faculty.imageUrl} sx={{ width: 100, height: 100 }} />
          <Typography variant="h4" gutterBottom>{faculty.name}</Typography>
          <Typography variant="h6">Subject: {faculty.subject}</Typography>
          <Typography variant="body1">Number of Quizzes: {faculty.numberOfQuizzes}</Typography>
          <Typography variant="body1">Level: {faculty.questionLevel}</Typography>
        </Paper>
      ) : (
        <Typography variant="h6">Faculty not found!</Typography>
      )}
    </div>
  );
};

export default FacultyPage;
