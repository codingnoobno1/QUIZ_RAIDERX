'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Grid, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import FacultyCard from '@components/ui/profilecard'; // import FacultyCard

const facultyData = [
  { name: 'Faculty 1', subject: 'DSA', numberOfQuizzes: 4, questionLevel: 'Gate/Interview Style', imageUrl: 'https://media.geeksforgeeks.org/wp-content/cdn-uploads/20200922124319/Singly-Linked-List1.png' },
  { name: 'Faculty 2', subject: 'Algorithms', numberOfQuizzes: 3, questionLevel: 'Competitive Programming', imageUrl: 'https://media.geeksforgeeks.org/wp-content/uploads/20200630123458/tree_vs_graph.jpg' },
  { name: 'Faculty 3', subject: 'Data Structures', numberOfQuizzes: 5, questionLevel: 'Interview Style', imageUrl: 'https://media.geeksforgeeks.org/wp-content/cdn-uploads/20200922124319/Singly-Linked-List1.png' },
  { name: 'Faculty 4', subject: 'Mathematics', numberOfQuizzes: 3, questionLevel: 'Gate', imageUrl: 'https://media.geeksforgeeks.org/wp-content/uploads/20200630123458/tree_vs_graph.jpg' },
  { name: 'Faculty 5', subject: 'Physics', numberOfQuizzes: 4, questionLevel: 'Competitive Programming', imageUrl: 'https://media.geeksforgeeks.org/wp-content/cdn-uploads/20200922124319/Singly-Linked-List1.png' },
  { name: 'Faculty 6', subject: 'Chemistry', numberOfQuizzes: 5, questionLevel: 'Interview Style', imageUrl: 'https://media.geeksforgeeks.org/wp-content/uploads/20200630123458/tree_vs_graph.jpg' },
  { name: 'Faculty 7', subject: 'Networking', numberOfQuizzes: 6, questionLevel: 'Gate', imageUrl: 'https://media.geeksforgeeks.org/wp-content/cdn-uploads/20200922124319/Singly-Linked-List1.png' },
  { name: 'Faculty 8', subject: 'Databases', numberOfQuizzes: 3, questionLevel: 'Interview Style', imageUrl: 'https://media.geeksforgeeks.org/wp-content/uploads/20200630123458/tree_vs_graph.jpg' },
  { name: 'Faculty 9', subject: 'Operating Systems', numberOfQuizzes: 4, questionLevel: 'Competitive Programming', imageUrl: 'https://media.geeksforgeeks.org/wp-content/cdn-uploads/20200922124319/Singly-Linked-List1.png' },
  { name: 'Faculty 10', subject: 'Software Engineering', numberOfQuizzes: 2, questionLevel: 'Gate/Interview Style', imageUrl: 'https://media.geeksforgeeks.org/wp-content/uploads/20200630123458/tree_vs_graph.jpg' },
];

export default function QuizSection() {
  const router = useRouter();

  const handleFacultyClick = (facultyName) => {
    // Routing to the faculty page
    router.push(`/coding-club/faculty/${facultyName}`);
  };

  return (
    <motion.div
      className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Typography variant="h5" gutterBottom>
        Choose a Faculty
      </Typography>

      {/* Display Faculty Cards in a Grid */}
      <Grid container spacing={3}>
        {facultyData.map((faculty) => (
          <Grid item xs={12} sm={6} md={4} key={faculty.name}>
            <FacultyCard faculty={faculty} onClick={() => handleFacultyClick(faculty.name)} />
          </Grid>
        ))}
      </Grid>
    </motion.div>
  );
}
