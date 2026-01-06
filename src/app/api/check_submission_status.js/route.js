import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import Project from "@/models/project";

export async function GET(req) {
  await connectDB(); // ensures mongoose is connected

  const { searchParams } = new URL(req.url);
  const enrollment = searchParams.get("enrollment");
  const type = searchParams.get("type");

  if (!enrollment || !type) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const project = await Project.findOne({
    "submittedBy.enrollment": enrollment,
    type,
  });

  if (!project) {
    return NextResponse.json({ exists: false });
  }

  return NextResponse.json({
    exists: true,
    allowResubmit: false, // You can later add this to schema if needed
    status: project.status,
  });
}
