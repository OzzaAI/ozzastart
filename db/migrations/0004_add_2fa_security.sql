-- Add 2FA and security fields to user_settings table
ALTER TABLE "user_settings" ADD COLUMN "twoFactorEnabled" boolean NOT NULL DEFAULT false;
ALTER TABLE "user_settings" ADD COLUMN "otpSecret" text;
ALTER TABLE "user_settings" ADD COLUMN "backupCodes" jsonb DEFAULT '[]';
ALTER TABLE "user_settings" ADD COLUMN "lastSecurityAudit" timestamp;
ALTER TABLE "user_settings" ADD COLUMN "securityLevel" text NOT NULL DEFAULT 'basic';

-- Add security events table for audit logging
CREATE TABLE IF NOT EXISTS "security_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"eventType" text NOT NULL,
	"eventDetails" jsonb DEFAULT '{}' NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"severity" text NOT NULL DEFAULT 'info',
	"createdAt" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint and indexes for security_events
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade;
CREATE INDEX IF NOT EXISTS "security_events_user_idx" ON "security_events" ("userId");
CREATE INDEX IF NOT EXISTS "security_events_type_idx" ON "security_events" ("eventType");
CREATE INDEX IF NOT EXISTS "security_events_severity_idx" ON "security_events" ("severity");
CREATE INDEX IF NOT EXISTS "security_events_created_at_idx" ON "security_events" ("createdAt");

-- Add api_keys table for proper API key management
CREATE TABLE IF NOT EXISTS "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"keyName" text NOT NULL,
	"keyHash" text NOT NULL,
	"keyPrefix" text NOT NULL,
	"permissions" jsonb DEFAULT '[]' NOT NULL,
	"isActive" boolean NOT NULL DEFAULT true,
	"lastUsed" timestamp,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint and indexes for api_keys
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade;
CREATE INDEX IF NOT EXISTS "api_keys_user_idx" ON "api_keys" ("userId");
CREATE INDEX IF NOT EXISTS "api_keys_hash_idx" ON "api_keys" ("keyHash");
CREATE INDEX IF NOT EXISTS "api_keys_prefix_idx" ON "api_keys" ("keyPrefix");
CREATE INDEX IF NOT EXISTS "api_keys_active_idx" ON "api_keys" ("isActive");

-- Add login_attempts table for brute force protection
CREATE TABLE IF NOT EXISTS "login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"ipAddress" text NOT NULL,
	"success" boolean NOT NULL DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

-- Add indexes for login_attempts
CREATE INDEX IF NOT EXISTS "login_attempts_identifier_idx" ON "login_attempts" ("identifier");
CREATE INDEX IF NOT EXISTS "login_attempts_ip_idx" ON "login_attempts" ("ipAddress");
CREATE INDEX IF NOT EXISTS "login_attempts_created_at_idx" ON "login_attempts" ("createdAt");
CREATE INDEX IF NOT EXISTS "login_attempts_success_idx" ON "login_attempts" ("success");