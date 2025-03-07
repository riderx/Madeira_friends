-- Revoke the overly permissive permissions
REVOKE ALL ON TABLE "public"."contact_form" FROM "anon";
REVOKE ALL ON TABLE "public"."contact_form" FROM "authenticated";
REVOKE ALL ON TABLE "public"."contact_form" FROM "service_role";

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can submit contact form" ON "public"."contact_form";
DROP POLICY IF EXISTS "Authenticated users can view contact form submissions" ON "public"."contact_form";

-- Grant only necessary permissions
-- Anonymous users can only insert
GRANT INSERT ON TABLE "public"."contact_form" TO "anon";
   
-- Authenticated users can only select
GRANT SELECT ON TABLE "public"."contact_form" TO "authenticated";
   
-- Service role needs all permissions for administrative purposes
GRANT ALL ON TABLE "public"."contact_form" TO "service_role";

-- Create more restrictive policies
-- Policy for anonymous users to insert data
CREATE POLICY "Anonymous users can submit contact form" ON "public"."contact_form" 
  FOR INSERT TO "anon" WITH CHECK (true);

-- Policy for authenticated users to view contact form submissions
CREATE POLICY "Authenticated users can view contact form submissions" ON "public"."contact_form" 
  FOR SELECT TO "authenticated" USING (true);
