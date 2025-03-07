-- Create contact_messages table
CREATE TABLE IF NOT EXISTS "public"."contact_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "subject" "text" NOT NULL,
    "message" "text" NOT NULL,
    "ip_address" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- Set up RLS policies
ALTER TABLE "public"."contact_messages" ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert contact messages
CREATE POLICY "Anyone can submit contact messages" ON "public"."contact_messages" 
FOR INSERT WITH CHECK (true);

-- Only allow admins and moderators to view contact messages
CREATE POLICY "Only admins and moderators can view contact messages" ON "public"."contact_messages" 
FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
   WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['moderator'::"public"."user_role", 'admin'::"public"."user_role"]))))));

-- Grant permissions
GRANT ALL ON TABLE "public"."contact_messages" TO "anon";
GRANT ALL ON TABLE "public"."contact_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_messages" TO "service_role";
