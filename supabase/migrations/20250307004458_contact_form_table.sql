-- Create contact_form table
CREATE TABLE IF NOT EXISTS "public"."contact_form" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "subject" "text" NOT NULL,
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    PRIMARY KEY ("id")
);

-- Enable RLS on the contact_form table
ALTER TABLE "public"."contact_form" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous users to insert into the contact_form table
CREATE POLICY "Allow anonymous users to insert into contact_form" 
ON "public"."contact_form" 
FOR INSERT 
TO "anon" 
WITH CHECK (true);

-- Grant permissions to the contact_form table
GRANT ALL ON TABLE "public"."contact_form" TO "anon";
GRANT ALL ON TABLE "public"."contact_form" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_form" TO "service_role";
