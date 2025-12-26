-- Add offer_complaints table for storing complaints (Post-MVP: full resolution system)
CREATE TABLE IF NOT EXISTS "offer_complaints" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "offerId" uuid NOT NULL REFERENCES "offers"("id") ON DELETE CASCADE,
  "raisedBy" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "reportedUserId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "complaintType" text NOT NULL DEFAULT 'unfair_cancellation',
  "reason" text NOT NULL,
  "status" text DEFAULT 'submitted',
  "createdAt" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "offer_complaints_offerId_idx" ON "offer_complaints"("offerId");
CREATE INDEX IF NOT EXISTS "offer_complaints_raisedBy_idx" ON "offer_complaints"("raisedBy");
CREATE INDEX IF NOT EXISTS "offer_complaints_reportedUserId_idx" ON "offer_complaints"("reportedUserId");

