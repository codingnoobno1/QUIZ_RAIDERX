import { connectDb, sql } from '@/lib/db';

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return new Response(JSON.stringify({ errors: [{ message: 'Unauthorized: No token provided' }] }), { status: 401 });
    }

    // TEMP: Mock decode logic – replace with JWT verify if needed
    let userPayload;
    try {
      userPayload = JSON.parse(token);
    } catch {
      return new Response(JSON.stringify({ errors: [{ message: 'Invalid token format' }] }), { status: 400 });
    }

    const { name, enrollmentNumber } = userPayload;
    if (!name || !enrollmentNumber) {
      return new Response(JSON.stringify({ errors: [{ message: 'Token missing required fields' }] }), { status: 400 });
    }

    const { query } = await req.json();

    if (!query.includes('userInfo')) {
      return new Response(JSON.stringify({ errors: [{ message: 'Unsupported query' }] }), { status: 400 });
    }

    // DB call
    const pool = await connectDb();
    const result = await pool
      .request()
      .input('name', sql.NVarChar, name)
      .input('enrollmentNumber', sql.NVarChar, enrollmentNumber)
      .query(`
        SELECT Name, EnrollmentNumber, Course, Semester 
        FROM Users 
        WHERE Name = @name AND EnrollmentNumber = @enrollmentNumber
      `);

    if (result.recordset.length === 0) {
      return new Response(JSON.stringify({ errors: [{ message: 'User not found' }] }), { status: 404 });
    }

    const user = result.recordset[0];

    return new Response(JSON.stringify({
      data: {
        userInfo: {
          name: user.Name,
          enrollmentNumber: user.EnrollmentNumber,
          course: user.Course,
          semester: user.Semester,
        },
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('welcomedashboard error:', err);
    return new Response(JSON.stringify({ errors: [{ message: 'Internal server error' }] }), { status: 500 });
  }
}
