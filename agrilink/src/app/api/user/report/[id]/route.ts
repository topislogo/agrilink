import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userReports, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tokenData = verifyToken(request);
    if (!tokenData || tokenData.userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: identifier } = await params;

    const reports = await db
      .select({
        id: userReports.id,
        reportIssue: userReports.reportIssue,
        status: userReports.status,
        createdAt: userReports.createdAt,
        reportedId: userReports.reportedId,
        reportedBy: userReports.reportedBy,
        reportedByName: users.name,
        reportedByEmail: users.email,
      })
      .from(userReports)
      .leftJoin(users, eq(userReports.reportedBy, users.id))
      .where(eq(userReports.reportedId, identifier));
      return NextResponse.json({ reports });
  } catch (err) {
    console.error("Error fetching reports:", err);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tokenData = verifyToken(request);

    // Only allow admins
    if (!tokenData || tokenData.userType !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: identifier } = await params;

    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: "Missing status" },
        { status: 400 }
      );
    }

    await db
      .update(userReports)
      .set({ status })
      .where(eq(userReports.id, identifier));

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err) {
    console.error("❌ Error updating report status:", err);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
