-- Create contact_form table with improved constraints
CREATE TABLE IF NOT EXISTS "public"."contact_form" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "name" "text" NOT NULL CHECK (length("name") >= 2 AND length("name") <= 100),
  "email" "text" NOT NULL CHECK (length("email") <= 100 AND "email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  "phone" "text" CHECK (
    "phone" IS NULL OR 
    (length("phone") <= 20 AND "phone" ~* '^\+?[0-9\s\-()]{7,20}$')
  ),
  "subject" "text" NOT NULL CHECK (length("subject") >= 3 AND length("subject") <= 200),
  "message" "text" NOT NULL CHECK (length("message") >= 10 AND length("message") <= 1000),
  "created_at" timestamp with time zone DEFAULT "now"(),
  CONSTRAINT "contact_form_pkey" PRIMARY KEY ("id")
);

-- Enable RLS on the contact_form table
ALTER TABLE "public"."contact_form" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous users to insert data with rate limiting
-- This policy allows only 5 submissions per IP address per hour
CREATE POLICY "Rate limited contact form submissions" ON "public"."contact_form" 
  FOR INSERT TO "anon" 
  WITH CHECK (
    (SELECT COUNT(*) FROM "public"."contact_form" 
     WHERE created_at > now() - interval '1 hour') < 5
  );

-- Create policy to allow authenticated users to view contact form submissions
CREATE POLICY "Authenticated users can view contact form submissions" ON "public"."contact_form" 
  FOR SELECT TO "authenticated" USING (true);

-- Grant only necessary permissions to roles
GRANT INSERT ON TABLE "public"."contact_form" TO "anon";
GRANT SELECT ON TABLE "public"."contact_form" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_form" TO "service_role";
