// src/app/api/submit_minor_project/route.js
import { NextResponse } from "next/server";

export async function POST(req) {
  const data = await req.json();
  // Here, save the data to a database or perform validation
  console.log("Minor project data received:", data);

  // Simulate storing the project and returning the status
  return NextResponse.json({
    status: "submitted",
    message: "Minor project submitted successfully.",
  });
}
