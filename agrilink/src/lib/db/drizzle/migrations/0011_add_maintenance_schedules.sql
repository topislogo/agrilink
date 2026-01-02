-- Create maintenance_schedules table
CREATE TABLE IF NOT EXISTS "maintenance_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"startTime" timestamp with time zone NOT NULL,
	"endTime" timestamp with time zone NOT NULL,
	"duration" integer NOT NULL,
	"message" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS maintenance_schedules_isActive_startTime_idx ON "maintenance_schedules"("isActive", "startTime");
CREATE INDEX IF NOT EXISTS maintenance_schedules_startTime_idx ON "maintenance_schedules"("startTime");

