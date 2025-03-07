-- Create contact_form table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."contact_form" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "name" "text" NOT NULL,
  "email" "text" NOT NULL,
  "phone" "text",
  "subject" "text" NOT NULL,
  "message" "text" NOT NULL,
  "created_at" timestamp with time zone DEFAULT "now"(),
  CONSTRAINT "contact_form_pkey" PRIMARY KEY ("id")
);

-- Enable RLS on the contact_form table
ALTER TABLE "public"."contact_form" ENABLE ROW LEVEL SECURITY;

-- Revoke ALL permissions and grant only what's needed
REVOKE ALL ON TABLE "public"."contact_form" FROM "anon";
REVOKE ALL ON TABLE "public"."contact_form" FROM "authenticated";

-- Grant only INSERT to anon users
GRANT INSERT ON TABLE "public"."contact_form" TO "anon";

-- Grant SELECT, UPDATE, DELETE to authenticated users
GRANT SELECT ON TABLE "public"."contact_form" TO "authenticated";
GRANT UPDATE ON TABLE "public"."contact_form" TO "authenticated";
GRANT DELETE ON TABLE "public"."contact_form" TO "authenticated";

-- Create policy to allow anonymous users to insert data
CREATE POLICY IF NOT EXISTS "Anyone can submit contact form" ON "public"."contact_form" 
  FOR INSERT TO "anon" WITH CHECK (true);

-- Create policy to allow authenticated users to view contact form submissions
CREATE POLICY IF NOT EXISTS "Authenticated users can view contact form submissions" ON "public"."contact_form" 
  FOR SELECT TO "authenticated" USING (true);

-- Create policy to allow authenticated users to update contact form submissions
CREATE POLICY IF NOT EXISTS "Authenticated users can update contact form submissions" ON "public"."contact_form" 
  FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);

-- Create policy to allow authenticated users to delete contact form submissions
CREATE POLICY IF NOT EXISTS "Authenticated users can delete contact form submissions" ON "public"."contact_form" 
  FOR DELETE TO "authenticated" USING (true);
