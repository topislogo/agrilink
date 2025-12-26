-- Remove businessHours, specialties, and policies columns from business_details table
-- These have been moved to storefront_details or are no longer needed

ALTER TABLE "business_details" 
  DROP COLUMN IF EXISTS "businessHours",
  DROP COLUMN IF EXISTS "specialties",
  DROP COLUMN IF EXISTS "policies";

