// src/app/api/session/route.js

let sessionMemory = {}; // TEMP: in-memory for now (will shift to DB or JWT later)

export async function POST(req) {
  try {
    const { loginTime, username } = await req.json();

    // Store in memory (or DB later)
    sessionMemory[username] = loginTime;

    return new Response(JSON.stringify({ message: 'Session saved' }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to save session' }), { status: 500 });
  }
}

export async function GET(req) {
  // Get session for a single user (in real app, you'd auth this)
  const username = req.nextUrl.searchParams.get('username');
  const time = sessionMemory[username];

  if (!time) {
    return new Response(JSON.stringify({ error: 'No session found' }), { status: 404 });
  }

  return new Response(JSON.stringify({ loginTime: time }), { status: 200 });
}
