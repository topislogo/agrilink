ALTER TABLE "verification_requests" ALTER COLUMN "userEmail" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "verification_requests" ALTER COLUMN "userName" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "verification_requests" ALTER COLUMN "userType" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "verification_requests" ALTER COLUMN "accountType" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "lastEmailSent";--> statement-breakpoint
ALTER TABLE "verification_requests" DROP COLUMN "businessName";--> statement-breakpoint
ALTER TABLE "verification_requests" DROP COLUMN "businessDescription";--> statement-breakpoint
ALTER TABLE "verification_requests" DROP COLUMN "businessLicenseNumber";