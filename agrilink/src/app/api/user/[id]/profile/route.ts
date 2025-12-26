// app/api/user/[id]/aboutme/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

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

export async function PUT( request: NextRequest, { params }:  { params: Promise<{ id: string }> }) {
  try {
    const { id: identifier } = await params;
    console.log("Updating user:", identifier);
    const tokenData = verifyToken(request);
    if (!tokenData || tokenData.userId !== identifier) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Parse request body
    const body = await request.json();
    const fieldToUpdate = Object.keys(body)[0];
    const updatedValue = body.aboutme ?? body.website;
    console.log("Received:", updatedValue);

    // Check if user_profiles row exists
    const existing = await db.select({ userId: userProfiles.userId }).from(userProfiles)
      .where(eq(userProfiles.userId, identifier))
      .limit(1);
    console.log("existing:", existing);

    if (existing.length > 0) {
      // Update existing record
      await db.update(userProfiles).set({ [fieldToUpdate]: updatedValue }).where(eq(userProfiles.userId, identifier));
      console.log("updating one:")
    } else {
      // Insert new record if not exists
      await db.insert(userProfiles).values({userId: identifier, [fieldToUpdate]: updatedValue,});
      console.log("adding one:");
    }

    // Fetch the updated row
    const [updatedProfile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, identifier));
    console.log("Updated profile:", updatedProfile);
    return NextResponse.json({ userProfile: updatedProfile });
  } catch (error) {
    console.error("Error updating About Me:", error);
    return NextResponse.json(
      { error: "Failed to update About Me" },
      { status: 500 }
    );
  }
}
