-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS "public"."contact_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "subject" "text" NOT NULL,
    "message" "text" NOT NULL,
    "ip_address" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    PRIMARY KEY ("id")
);

-- Set up Row Level Security (RLS)
ALTER TABLE "public"."contact_submissions" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow only moderators and admins to view submissions
CREATE POLICY "Allow moderators and admins to view contact submissions" 
ON "public"."contact_submissions" FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM "public"."profiles"
        WHERE "profiles"."id" = "auth"."uid"()
        AND "profiles"."role" IN ('moderator', 'admin')
    )
);

-- Create policy to allow anyone to insert submissions
CREATE POLICY "Allow anyone to insert contact submissions" 
ON "public"."contact_submissions" FOR INSERT 
WITH CHECK (true);
