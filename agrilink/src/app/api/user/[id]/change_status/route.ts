import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
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

export async function PUT(req: NextRequest, { params }:  { params: Promise<{ id: string }> }) {
  try {
    const { id: identifier } = await params;
    const tokenData = verifyToken(req);
    if (!tokenData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [existing] = await db.select().from(users).where(eq(users.id, identifier));
    console.log("Existing user:", existing);

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newStatus = !existing.isRestricted;
    await db.update(users).set({ isRestricted: newStatus }).where(eq(users.id, identifier));
    
    const [updated] = await db.select().from(users).where(eq(users.id, identifier));
    return NextResponse.json({ user: updated });
  } catch (error: any) {
    console.error("Error updating user socials:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}