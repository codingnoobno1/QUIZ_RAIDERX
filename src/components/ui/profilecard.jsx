import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';

const FacultyCard = ({ faculty, onClick }) => {
  const allSubjects = useMemo(() => {
    return faculty.classAssignments?.flatMap((a) => a.subjects) || [];
  }, [faculty.classAssignments]);

  const primarySubject =
    allSubjects.length > 0
      ? typeof allSubjects[0] === 'object'
        ? allSubjects[0].name
        : allSubjects[0]
      : 'General';

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2)
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        width: 300,
        height: 420,
        borderRadius: '20px',
        overflow: 'hidden',
        border: '1px solid #1f2937',
        background:
          'linear-gradient(180deg, #0b1220 0%, #090909 100%)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all .25s cubic-bezier(0.4,0,0.2,1)',
        cursor: 'pointer',
        margin: '0 auto',

        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
          borderColor: '#3b82f6',
        },
      }}
    >
      {/* ================= HEADER ================= */}
      <Box
        sx={{
          flexShrink: 0,
          bgcolor: '#0f172a',
          borderBottom: '1px solid #1f2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 1.8,
          px: 2,
        }}
      >
        <Box
          component="img"
          src="https://www.amity.edu/volunteer/image/logo.jpg"
          sx={{
            width: '85%',
            maxHeight: 52,
            objectFit: 'contain',
            bgcolor: '#fff',
            p: 0.5,
            borderRadius: '4px',
          }}
        />
      </Box>

      {/* ================= CENTER ================= */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          textAlign: 'center',
        }}
      >
        {/* Avatar */}
        <Box
          sx={{
            width: 92,
            height: 92,
            borderRadius: '50%',
            border: '3px solid #1f2937',
            bgcolor: '#111827',
            mb: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            fontWeight: 800,
            color: '#fff',
            overflow: 'hidden',
          }}
        >
          {faculty.imageUrl ? (
            <Box
              component="img"
              src={faculty.imageUrl}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            getInitials(faculty.name)
          )}
        </Box>

        <Typography
          fontWeight={800}
          color="#fff"
          fontSize={18}
          sx={{ mb: 0.5 }}
        >
          {faculty.name}
        </Typography>

        <Typography
          fontSize={12}
          sx={{
            color: '#9ca3af',
            mb: 1.5,
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontWeight: 600,
          }}
        >
          {faculty.position || faculty.Position || 'Mentor'}
        </Typography>

        <Chip
          label={primarySubject}
          size="small"
          sx={{
            bgcolor: '#1f2937',
            color: '#d1d5db',
            fontSize: 11,
            height: 24,
            px: 1,
            fontWeight: 600,
          }}
        />
      </Box>

      {/* ================= PIXEL LOGO ================= */}
      <Box
        sx={{
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'center',
          pb: 1,
        }}
      >
        <Box
          component="img"
          src="/pixel.jpg"
          sx={{
            height: 38,
            width: 'auto',
            bgcolor: '#fff',
            borderRadius: '6px',
            p: 0.4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        />
      </Box>

      {/* ================= BUTTON ================= */}
      <Box
        sx={{
          flexShrink: 0,
          p: 2,
          pt: 1,
        }}
      >
        <Button
          fullWidth
          variant="contained"
          sx={{
            py: 1.2,
            bgcolor: '#1f2937',
            color: '#fff',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: 14,
            '&:hover': {
              bgcolor: '#2563eb',
            },
          }}
        >
          View Quizzes
        </Button>
      </Box>
    </Box>
  );
};

export default FacultyCard;
