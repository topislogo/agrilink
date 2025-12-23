import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { businessDetails } from "@/lib/db/schema";
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
    if (!tokenData || tokenData.userId !== identifier) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const [existing] = await db.select().from(businessDetails).where(eq(businessDetails.userId, identifier));
    console.log("Existing business details:", existing);
    if (existing) {
      // Update only the fields provided
      let updatedData = { ...body };
      if (body.policies && existing.policies) {
        updatedData.policies = {
          ...existing.policies,
          ...body.policies,
        };
      }
      await db.update(businessDetails).set({ ...updatedData }).where(eq(businessDetails.userId, identifier));
    } else {
      await db.insert(businessDetails).values({ userId: identifier, ...body });
    }
    const [updated] = await db.select().from(businessDetails).where(eq(businessDetails.userId, identifier));
    return NextResponse.json({ social: updated });
  } catch (error: any) {
    console.error("Error updating business details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}