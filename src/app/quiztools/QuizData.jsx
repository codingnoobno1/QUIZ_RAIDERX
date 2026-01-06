'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';

// Temporary/mock fetchAssignments function
async function fetchAssignmentsFromApi(session) {
  // Return mock data
  return [
    {
      batchLabel: 'BTECH-CS-1',
      semesterNumber: 1,
      subjects: [
        { id: 1, name: 'Mathematics' },
        { id: 2, name: 'Physics' },
      ],
    },
    {
      batchLabel: 'BCA-A-2',
      semesterNumber: 2,
      subjects: [
        { id: 3, name: 'Digital Logic' },
        { id: 4, name: 'Signals & Systems' },
      ],
    },
  ];
}

export default function useQuizData() {
  const { data: session, status } = useSession();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedBatchIdx, setSelectedBatchIdx] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [quizStatusMap, setQuizStatusMap] = useState({}); // Map of quiz types to status info

  // Fetch assignments once session is available
  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchAssignmentsFromApi(session)
        .then(setAssignments)
        .catch(() => setAssignments([]))
        .finally(() => setLoading(false));
    }
  }, [status, session]);

  // Reset subject when batch changes
  useEffect(() => {
    setSelectedSubject('');
  }, [selectedBatchIdx]);

  // Selected batch based on index
  const selectedBatch = useMemo(() => {
    return selectedBatchIdx !== '' && assignments[selectedBatchIdx]
      ? assignments[selectedBatchIdx]
      : null;
  }, [selectedBatchIdx, assignments]);

  // Subjects from selected batch
  const subjects = useMemo(() => selectedBatch?.subjects || [], [selectedBatch]);

  return {
    session,
    loading,
    assignments,
    selectedBatchIdx,
    setSelectedBatchIdx,
    selectedSubject,
    setSelectedSubject,
    selectedBatch,
    subjects,
    quizStatusMap,
    setQuizStatusMap,
  };
}
