import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import FacultyCard from '@/models/facultycard';

export async function GET(request) {
  await connectDB();

  try {
    const facultyCards = await FacultyCard.find({ isActive: true }).lean();
    return NextResponse.json(facultyCards, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch faculty cards', error: error.message },
      { status: 500 }
    );
  }
}