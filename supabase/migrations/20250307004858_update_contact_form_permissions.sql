-- Revoke ALL permissions and grant only what's needed
REVOKE ALL ON TABLE "public"."contact_form" FROM "anon";
REVOKE ALL ON TABLE "public"."contact_form" FROM "authenticated";

-- Grant only INSERT to anon users
GRANT INSERT ON TABLE "public"."contact_form" TO "anon";

-- Grant SELECT, UPDATE, DELETE to authenticated users
GRANT SELECT ON TABLE "public"."contact_form" TO "authenticated";
GRANT UPDATE ON TABLE "public"."contact_form" TO "authenticated";
GRANT DELETE ON TABLE "public"."contact_form" TO "authenticated";
