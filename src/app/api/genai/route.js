// src/app/api/genai/route.js
import { NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Utility: safely extract JSON array from GenAI content
function extractJSON(content) {
  try {
    const firstBracket = content.indexOf('[');
    const lastBracket = content.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
      const jsonString = content.slice(firstBracket, lastBracket + 1);
      return JSON.parse(jsonString);
    }
  } catch (err) {
    console.error('JSON extraction failed:', err, content);
  }
  return [];
}

export async function POST(request) {
  try {
    const { topic, prompt, requestType } = await request.json();

    // Validate input
    if (requestType === 'quiz' && (!topic || !topic.trim())) {
      return NextResponse.json(
        { error: 'Topic is required for quiz generation' },
        { status: 400 }
      );
    }
    if (requestType === 'response' && (!prompt || !prompt.trim())) {
      return NextResponse.json(
        { error: 'Prompt is required for AI response' },
        { status: 400 }
      );
    }

    // Prepare API prompt
    let apiPrompt = '';
    let maxTokens = 700;

    if (requestType === 'quiz') {
      apiPrompt = `
        Generate 5-10 extremely hard and tricky quiz questions on the topic: "${topic.trim()}".
        Include a mix of:
          - MCQ (3-5 options)
          - Fill-in-the-blank
          - True/False
        Return ONLY a JSON array of questions EXACTLY in this format:
        [
          { "type": "mcq", "text": "Question text", "options": ["opt1","opt2"], "answer": "correct option" },
          { "type": "fillup", "text": "Question text", "answer": "correct answer" },
          { "type": "truefalse", "text": "Question text", "answer": true/false }
        ]
        Do NOT include extra text, numbering, explanations, or quotes around the array.
      `;
    } else if (requestType === 'response') {
      apiPrompt = prompt.trim();
      maxTokens = 500;
    }

    if (!apiPrompt || !apiPrompt.trim()) {
      return NextResponse.json({ error: 'Prompt is empty' }, { status: 400 });
    }

    // Call Google GenAI API
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: { text: apiPrompt },
          temperature: 0.85,
          maxOutputTokens: maxTokens
        })
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('GenAI API error:', text);
      return NextResponse.json({ error: 'GenAI API request failed' }, { status: 500 });
    }

    const data = await res.json();
    const content = data?.candidates?.[0]?.content || '';
    console.log('Raw GenAI content:', content);

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'GenAI returned empty content' }, { status: 500 });
    }

    // Quiz generation
    if (requestType === 'quiz') {
      const questions = extractJSON(content);
      if (!questions.length) {
        return NextResponse.json({ error: 'Failed to parse quiz questions from GenAI' }, { status: 500 });
      }
      return NextResponse.json({ questions });
    }

    // AI text response
    if (requestType === 'response') {
      return NextResponse.json({ result: content.trim() });
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });

  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
