-- Add businessHours column to storefront_details table
-- This moves business hours from business_details to storefront_details for customer-facing display
ALTER TABLE "storefront_details" ADD COLUMN IF NOT EXISTS "businessHours" text;

