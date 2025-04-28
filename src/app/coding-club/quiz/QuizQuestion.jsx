import { useState } from 'react';
import { Button, Typography, Grid, Paper, Box } from '@mui/material';
import { motion } from 'framer-motion';

export default function QuizQuestion({ question, options, selected, onSelect }) {
  const [selectedOption, setSelectedOption] = useState(selected);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleOptionClick = (option) => {
    if (!isAnswered) {
      setSelectedOption(option);
      onSelect(option);  // Update the parent component with the selected answer
      setIsAnswered(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="quiz-question"
    >
      <Paper elevation={3} sx={{ padding: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          {question}
        </Typography>

        <Grid container spacing={2}>
          {options.map((option, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Button
                variant="outlined"
                fullWidth
                sx={{
                  padding: '16px',
                  backgroundColor: selectedOption === option ? '#3f51b5' : 'transparent',
                  color: selectedOption === option ? '#fff' : '#000',
                  borderColor: selectedOption === option ? '#3f51b5' : '#ddd',
                  '&:hover': {
                    backgroundColor: selectedOption === option ? '#303f9f' : '#f5f5f5',
                  },
                }}
                onClick={() => handleOptionClick(option)}
              >
                {option}
              </Button>
            </Grid>
          ))}
        </Grid>

        {/* Display Answer after selection */}
        {isAnswered && (
          <Box sx={{ marginTop: 2 }}>
            <Typography variant="body1" color="text.secondary">
              {selectedOption === options[0] ? "Correct!" : "Incorrect!"}
            </Typography>
          </Box>
        )}
      </Paper>
    </motion.div>
  );
}
