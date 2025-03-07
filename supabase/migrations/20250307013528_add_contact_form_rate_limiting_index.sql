-- Add index to support rate limiting on contact_form table
CREATE INDEX IF NOT EXISTS "idx_contact_form_created_at" ON "public"."contact_form" ("created_at");

-- Add client IP tracking for better rate limiting
ALTER TABLE "public"."contact_form" ADD COLUMN IF NOT EXISTS "client_ip" TEXT;

-- Update the rate limiting policy to use client IP
DROP POLICY IF EXISTS "Rate limited contact form submissions" ON "public"."contact_form";

CREATE POLICY "Rate limited contact form submissions by IP" ON "public"."contact_form" 
  FOR INSERT TO "anon" 
  WITH CHECK (
    (SELECT COUNT(*) FROM "public"."contact_form" 
     WHERE "client_ip" = current_setting('request.headers')::json->>'x-forwarded-for'
     AND created_at > now() - interval '1 hour') < 5
  );
