-- Add role column to user table
ALTER TABLE "user" ADD COLUMN "role" text NOT NULL DEFAULT 'client';