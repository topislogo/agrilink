import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userReports } from "@/lib/db/schema";
import jwt from "jsonwebtoken";

// Helper to verify JWT token
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.substring(7);
    return jwt.verify(token, process.env.JWT_SECRET!) as any;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokenData = verifyToken(request);
    if (!tokenData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reportedId, reportIssue } = await request.json();

    if (!reportedId || !reportIssue) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const newReport = {
      reportedId,
      reportedBy: tokenData.userId,
      reportIssue,
      createdAt: new Date(),
      status: "pending",
    };

    await db.insert(userReports).values(newReport);

    return NextResponse.json({ report: newReport }, { status: 201 });
  } catch (err) {
    console.error("Error creating report:", err);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
