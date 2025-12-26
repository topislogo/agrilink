import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userSocial } from "@/lib/db/schema";
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
  const { id: identifier } = await params;
  console.log("Fetching social profile for user:", identifier);

  try {
    // Get main profile
    const [profile] = await db.select().from(userSocial).where(eq(userSocial.userId, identifier));

    // Get social info from separate table
    const [social] = await db.select().from(userSocial).where(eq(userSocial.userId, identifier));

    return NextResponse.json({
      social: social || {}
    });

  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }:  { params: Promise<{ id: string }> }) {
  try {
    const { id: identifier } = await params;
    const tokenData = verifyToken(req);
    if (!tokenData || tokenData.userId !== identifier) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const [existing] = await db.select().from(userSocial).where(eq(userSocial.userId, identifier));
    console.log("Existing social data:", existing);
    if (existing) {
      // Update only the fields provided
      await db.update(userSocial).set({ ...body }).where(eq(userSocial.userId, identifier));
    } else {
      await db.insert(userSocial).values({ userId: identifier, ...body });
    }
    const [updated] = await db.select().from(userSocial).where(eq(userSocial.userId, identifier));
    return NextResponse.json({ social: updated });
  } catch (error: any) {
    console.error("Error updating user socials:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}