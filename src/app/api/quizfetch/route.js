import clientPromise from '@/lib/mongodb';

export async function POST(req) {
  const { batch, semester, subject, facultyId } = await req.json();

  try {
    const client = await clientPromise;
    const db = client.db('quizraiderx');
    const collection = db.collection('quizzes');

    const quizzes = await collection
      .find({ batch, semester, subject, facultyId })
      .project({ _id: 1, title: 1, date: 1 })
      .toArray();

    const formatted = quizzes.map((q) => ({
      id: q._id,
      title: q.title,
      date: q.date,
    }));

    return new Response(JSON.stringify({ quizzes: formatted }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('❌ quizfetch error:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch quizzes' }), {
      status: 500,
    });
  }
}
