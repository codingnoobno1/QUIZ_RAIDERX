// @components/ui/profilecard.jsx
import { Card, CardContent, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const FacultyCard = ({ faculty, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card sx={{ maxWidth: 345, cursor: 'pointer' }} onClick={onClick}>
        <CardContent>
          <Typography variant="h6" component="div">{faculty.name}</Typography>
          <Typography variant="body2" color="text.secondary">Role: {faculty.role}</Typography>
          <Typography variant="body2" color="text.secondary">Department: {faculty.department}</Typography>
          <Typography variant="body2" color="text.secondary">Subjects: {faculty.subjects.join(', ')}</Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FacultyCard;
