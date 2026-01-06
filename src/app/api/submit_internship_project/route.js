import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import Project from "@/models/project";

export async function POST(req) {
  try {
    await connectDB();

    const formData = await req.json();
    const {
      title,
      abstract,
      type,
      name,
      enrollment,
      major,
      member1,
      member1Enrollment,
      member2,
      member2Enrollment,
      member3,
      member3Enrollment,
    } = formData;

    // Basic required fields only
    if (!title || !abstract || !type || !name || !enrollment || !major) {
      return NextResponse.json(
        { status: "error", message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Build members array only for valid entries
    const members = [];
    if (member1 && member1Enrollment)
      members.push({ name: member1, enrollment: member1Enrollment });
    if (member2 && member2Enrollment)
      members.push({ name: member2, enrollment: member2Enrollment });
    if (member3 && member3Enrollment)
      members.push({ name: member3, enrollment: member3Enrollment });

    // Check for existing project
    const existing = await Project.findOne({
      "submittedBy.enrollment": enrollment,
      type,
    });

    if (existing) {
      if (!existing.allowResubmit) {
        return NextResponse.json(
          {
            status: "duplicate",
            message: "Project already submitted and resubmission not allowed",
          },
          { status: 409 }
        );
      }

      // Update existing project
      existing.title = title;
      existing.abstract = abstract;
      existing.members = members;
      existing.submittedBy = { name, enrollment, major };
      existing.updatedAt = new Date();

      await existing.save();

      return NextResponse.json(
        { status: "resubmitted", message: "Project resubmitted successfully" },
        { status: 200 }
      );
    }

    // Create new project
    await Project.create({
      title,
      abstract,
      type,
      submittedBy: { name, enrollment, major },
      members,
      status: "pending",
      allowResubmit: false,
      createdAt: new Date(),
    });

    return NextResponse.json(
      { status: "submitted", message: "Project submitted successfully" },
      { status: 201 }
    );
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { status: "error", message: "Server error. Please try again later." },
      { status: 500 }
    );
  }
}
