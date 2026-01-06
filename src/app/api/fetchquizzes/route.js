import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import Quiz from '@/models/Quiz';
import Subject from '@/models/Subject';
import Faculty from '@/models/faculty';

export async function GET(request) {
  await connectDB();

  try {
    const { searchParams } = new URL(request.url);
    const batch = searchParams.get('batch');
    const subjectName = searchParams.get('subject');
    const semester = searchParams.get('semester');
    const status = searchParams.get('status') || 'published'; // Default to published for students

    if (!batch || !subjectName || !semester) {
      return NextResponse.json(
        { message: 'Missing batch, subject, or semester query parameters' },
        { status: 400 }
      );
    }

    // Find the Subject ID
    const subject = await Subject.findOne({ name: subjectName });
    if (!subject) {
      return NextResponse.json({ message: 'Subject not found' }, { status: 404 });
    }

    const query = {
      subjectId: subject._id,
      batch: batch,
      semester: semester,
      status: 'published' // Only published quizzes
    };

    // Fetch all matching quizzes
    const allQuizzes = await Quiz.find(query)
      .populate({
        path: 'subjectId',
        select: 'name description',
      })
      .populate({
        path: 'createdBy',
        select: 'name',
      })
      .select('-questions') // Don't send questions in list view
      .sort({ createdAt: -1 })
      .lean();

    // Filter by availability status
    const now = new Date();
    const activeQuizzes = allQuizzes.filter(quiz => {
      if (quiz.availabilityStatus === 'on') return true;
      if (quiz.availabilityStatus === 'off') return false;
      if (quiz.availabilityStatus === 'scheduled') {
        const started = !quiz.scheduledStartTime || now >= new Date(quiz.scheduledStartTime);
        const notEnded = !quiz.scheduledEndTime || now <= new Date(quiz.scheduledEndTime);
        return started && notEnded;
      }
      return false;
    });

    return NextResponse.json({
      success: true,
      count: activeQuizzes.length,
      quizzes: activeQuizzes
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json(
      { message: 'Failed to fetch quizzes', error: error.message },
      { status: 500 }
    );
  }
}
