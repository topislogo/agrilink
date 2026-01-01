-- Migration to add analytics_events table for tracking profile views, product views, etc.

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "eventType" text NOT NULL,
  "targetId" uuid NOT NULL,
  "viewerId" uuid REFERENCES users(id) ON DELETE SET NULL,
  metadata jsonb,
  "createdAt" timestamp with time zone DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS analytics_events_eventType_targetId_idx ON analytics_events("eventType", "targetId");
CREATE INDEX IF NOT EXISTS analytics_events_targetId_createdAt_idx ON analytics_events("targetId", "createdAt");
CREATE INDEX IF NOT EXISTS analytics_events_createdAt_idx ON analytics_events("createdAt");

