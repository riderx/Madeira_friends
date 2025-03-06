

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."booking_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'expired'
);


ALTER TYPE "public"."booking_status" OWNER TO "postgres";


CREATE TYPE "public"."booking_type" AS ENUM (
    'event',
    'rental'
);


ALTER TYPE "public"."booking_type" OWNER TO "postgres";


CREATE TYPE "public"."listing_status" AS ENUM (
    'draft',
    'pending',
    'published',
    'rejected'
);


ALTER TYPE "public"."listing_status" OWNER TO "postgres";


CREATE TYPE "public"."rental_type" AS ENUM (
    'flat',
    'house',
    'scooter',
    'motorbike',
    'car'
);


ALTER TYPE "public"."rental_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'user',
    'moderator',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_booking_conflicts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check for event booking conflicts
  IF NEW.booking_type = 'event' THEN
    IF EXISTS (
      SELECT 1 FROM bookings
      WHERE event_id = NEW.event_id
      AND user_id = NEW.user_id
      AND status NOT IN ('rejected', 'expired')
    ) THEN
      RAISE EXCEPTION 'User already has a booking for this event';
    END IF;
  END IF;

  -- Check for rental booking conflicts
  IF NEW.booking_type = 'rental' THEN
    IF EXISTS (
      SELECT 1 FROM bookings
      WHERE rental_id = NEW.rental_id
      AND status = 'approved'
      AND (
        (NEW.start_date, NEW.end_date) OVERLAPS (start_date, end_date)
      )
    ) THEN
      RAISE EXCEPTION 'Rental is not available for these dates';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_booking_conflicts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_bookings"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update expired event bookings
  UPDATE bookings
  SET status = 'expired'
  WHERE status = 'pending'
  AND booking_type = 'event'
  AND event_id IN (
    SELECT id FROM events WHERE date < now()
  );

  -- Update expired rental bookings
  UPDATE bookings
  SET status = 'expired'
  WHERE status = 'pending'
  AND booking_type = 'rental'
  AND start_date < now();

  -- Expire pending bookings older than 72 hours
  UPDATE bookings
  SET status = 'expired'
  WHERE status = 'pending'
  AND created_at < now() - interval '72 hours';
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_bookings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_pending_bookings"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE bookings
  SET status = 'expired'
  WHERE status = 'pending'
  AND created_at < now() - interval '72 hours';
END;
$$;


ALTER FUNCTION "public"."expire_pending_bookings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_avatar_upload"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Ensure avatar files are stored with user_id/visibility/filename structure
  -- Example: 123e4567-e89b-12d3-a456-426614174000/public/profile.jpg
  IF NEW.bucket_id = 'avatars' THEN
    -- Check if the path follows the expected structure: user_id/visibility/filename
    IF array_length(storage.foldername(NEW.name), 1) < 2 THEN
      RAISE EXCEPTION 'Avatar path must follow pattern: user_id/visibility/filename';
    END IF;
    
    -- Ensure the user_id matches the authenticated user
    IF auth.uid()::text != (storage.foldername(NEW.name))[1] THEN
      RAISE EXCEPTION 'You can only upload to your own user directory';
    END IF;
    
    -- Ensure visibility is either 'public' or 'private'
    IF (storage.foldername(NEW.name))[2] != 'public' AND (storage.foldername(NEW.name))[2] != 'private' THEN
      RAISE EXCEPTION 'Avatar visibility must be either public or private';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_avatar_upload"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_booking_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  event_title text;
  rental_title text;
  notification_title text;
  notification_message text;
BEGIN
  -- Skip if status hasn't changed
  IF (TG_OP = 'UPDATE' AND OLD.status = NEW.status) THEN
    RETURN NEW;
  END IF;

  -- Get relevant title based on booking type
  IF NEW.booking_type = 'event' THEN
    SELECT title INTO event_title FROM events WHERE id = NEW.event_id;
    notification_title := event_title;
  ELSE
    SELECT title INTO rental_title FROM rentals WHERE id = NEW.rental_id;
    notification_title := rental_title;
  END IF;

  -- Create notification message based on status
  CASE NEW.status
    WHEN 'approved' THEN
      notification_message := 'Your booking for "' || notification_title || '" has been approved!';
    WHEN 'rejected' THEN
      notification_message := 'Your booking for "' || notification_title || '" has been rejected.';
    WHEN 'expired' THEN
      notification_message := 'Your booking request for "' || notification_title || '" has expired.';
    ELSE
      notification_message := 'Your booking for "' || notification_title || '" status has been updated to ' || NEW.status;
  END CASE;

  -- Insert notification
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.user_id,
    'booking_' || NEW.status,
    notification_title,
    notification_message,
    jsonb_build_object(
      'booking_id', NEW.id,
      'booking_type', NEW.booking_type,
      'event_id', NEW.event_id,
      'rental_id', NEW.rental_id,
      'status', NEW.status,
      'moderation_note', NEW.moderation_note
    )
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_booking_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_listing_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  notification_title text;
  notification_message text;
  listing_type text;
BEGIN
  -- Skip if status hasn't changed
  IF (TG_OP = 'UPDATE' AND OLD.status = NEW.status) THEN
    RETURN NEW;
  END IF;

  -- Set listing type and title based on table
  IF TG_TABLE_NAME = 'events' THEN
    listing_type := 'event';
  ELSE
    listing_type := 'rental';
  END IF;
  notification_title := NEW.title;

  -- Create notification message based on status
  CASE NEW.status
    WHEN 'published' THEN
      notification_message := 'Your ' || listing_type || ' "' || notification_title || '" has been approved and published!';
    WHEN 'rejected' THEN
      notification_message := 'Your ' || listing_type || ' "' || notification_title || '" has been rejected.';
    ELSE
      notification_message := 'Your ' || listing_type || ' "' || notification_title || '" status has been updated to ' || NEW.status;
  END CASE;

  -- Insert notification
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.creator_id,
    listing_type || '_' || NEW.status,
    notification_title,
    notification_message,
    jsonb_build_object(
      'listing_type', listing_type,
      'listing_id', NEW.id,
      'status', NEW.status,
      'moderation_note', NEW.moderation_note
    )
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_listing_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "booking_type" "public"."booking_type" NOT NULL,
    "event_id" "uuid",
    "rental_id" "uuid",
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone,
    "num_attendees" integer,
    "message" "text",
    "status" "public"."booking_status" DEFAULT 'pending'::"public"."booking_status",
    "moderator_id" "uuid",
    "moderation_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "booking_reference" CHECK (((("booking_type" = 'event'::"public"."booking_type") AND ("event_id" IS NOT NULL) AND ("rental_id" IS NULL)) OR (("booking_type" = 'rental'::"public"."booking_type") AND ("rental_id" IS NOT NULL) AND ("event_id" IS NULL))))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "date" timestamp with time zone NOT NULL,
    "location" "text" NOT NULL,
    "max_attendees" integer,
    "rsvp_deadline" timestamp with time zone,
    "is_paid" boolean DEFAULT false,
    "payment_link" "text",
    "cancellation_policy" "text",
    "telegram_contact" "text" NOT NULL,
    "images" "text"[],
    "status" "public"."listing_status" DEFAULT 'draft'::"public"."listing_status",
    "moderator_id" "uuid",
    "moderation_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "telegram_username" "text",
    "phone" "text",
    "bio" "text",
    "avatar_url" "text",
    "location_from" "text",
    "location_madeira" "text",
    "role" "public"."user_role" DEFAULT 'user'::"public"."user_role",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rentals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "type" "public"."rental_type" NOT NULL,
    "location" "text" NOT NULL,
    "price_per_day" numeric NOT NULL,
    "min_duration" integer NOT NULL,
    "max_duration" integer,
    "security_deposit" numeric,
    "cancellation_policy" "text",
    "telegram_contact" "text" NOT NULL,
    "images" "text"[],
    "status" "public"."listing_status" DEFAULT 'draft'::"public"."listing_status",
    "moderator_id" "uuid",
    "moderation_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."rentals" OWNER TO "postgres";


ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_telegram_username_key" UNIQUE ("telegram_username");



ALTER TABLE ONLY "public"."rentals"
    ADD CONSTRAINT "rentals_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "check_booking_conflicts_trigger" BEFORE INSERT OR UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."check_booking_conflicts"();



CREATE OR REPLACE TRIGGER "notify_booking_status_change_trigger" AFTER INSERT OR UPDATE OF "status" ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."notify_booking_status_change"();



CREATE OR REPLACE TRIGGER "notify_event_status_change_trigger" AFTER INSERT OR UPDATE OF "status" ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."notify_listing_status_change"();



CREATE OR REPLACE TRIGGER "notify_rental_status_change_trigger" AFTER INSERT OR UPDATE OF "status" ON "public"."rentals" FOR EACH ROW EXECUTE FUNCTION "public"."notify_listing_status_change"();



CREATE OR REPLACE TRIGGER "update_bookings_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_events_updated_at" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_rentals_updated_at" BEFORE UPDATE ON "public"."rentals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rentals"
    ADD CONSTRAINT "rentals_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rentals"
    ADD CONSTRAINT "rentals_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "public"."profiles"("id");



CREATE POLICY "Event creators can view their event bookings" ON "public"."bookings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "bookings"."event_id") AND ("events"."creator_id" = "auth"."uid"())))));



CREATE POLICY "Moderators can update bookings" ON "public"."bookings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['moderator'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "Moderators can update events" ON "public"."events" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['moderator'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "Moderators can update rentals" ON "public"."rentals" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['moderator'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "Moderators can view all bookings" ON "public"."bookings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['moderator'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "Moderators can view all events" ON "public"."events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['moderator'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "Moderators can view all rentals" ON "public"."rentals" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['moderator'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Published events are viewable by everyone" ON "public"."events" FOR SELECT USING ((("status" = 'published'::"public"."listing_status") AND ("deleted_at" IS NULL)));



CREATE POLICY "Published rentals are viewable by everyone" ON "public"."rentals" FOR SELECT USING ((("status" = 'published'::"public"."listing_status") AND ("deleted_at" IS NULL)));



CREATE POLICY "Rental owners can view their rental bookings" ON "public"."bookings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."rentals"
  WHERE (("rentals"."id" = "bookings"."rental_id") AND ("rentals"."creator_id" = "auth"."uid"())))));



CREATE POLICY "Users can create bookings" ON "public"."bookings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create events" ON "public"."events" FOR INSERT WITH CHECK (("auth"."uid"() = "creator_id"));



CREATE POLICY "Users can create rentals" ON "public"."rentals" FOR INSERT WITH CHECK (("auth"."uid"() = "creator_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own events" ON "public"."events" FOR UPDATE USING (("auth"."uid"() = "creator_id")) WITH CHECK (("auth"."uid"() = "creator_id"));



CREATE POLICY "Users can update own rentals" ON "public"."rentals" FOR UPDATE USING (("auth"."uid"() = "creator_id")) WITH CHECK (("auth"."uid"() = "creator_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own bookings" ON "public"."bookings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own events" ON "public"."events" FOR SELECT USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "Users can view their own rentals" ON "public"."rentals" FOR SELECT USING (("auth"."uid"() = "creator_id"));



ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rentals" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


























































































































































































GRANT ALL ON FUNCTION "public"."check_booking_conflicts"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_booking_conflicts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_booking_conflicts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_bookings"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_bookings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_bookings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_pending_bookings"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_pending_bookings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_pending_bookings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_avatar_upload"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_avatar_upload"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_avatar_upload"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_booking_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_booking_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_booking_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_listing_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_listing_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_listing_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."rentals" TO "anon";
GRANT ALL ON TABLE "public"."rentals" TO "authenticated";
GRANT ALL ON TABLE "public"."rentals" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;

--
-- Dumped schema changes for auth and storage
--

CREATE OR REPLACE TRIGGER "avatar_upload_trigger" BEFORE INSERT OR UPDATE ON "storage"."objects" FOR EACH ROW WHEN (("new"."bucket_id" = 'avatars'::"text")) EXECUTE FUNCTION "public"."handle_avatar_upload"();



CREATE POLICY "Anyone can view public avatars" ON "storage"."objects" FOR SELECT USING ((("bucket_id" = 'avatars'::"text") AND (("storage"."foldername"("name"))[2] = 'public'::"text")));



CREATE POLICY "Users can delete their own avatar" ON "storage"."objects" FOR DELETE USING ((("bucket_id" = 'avatars'::"text") AND (("auth"."uid"())::"text" = ("storage"."foldername"("name"))[1])));



CREATE POLICY "Users can update their own avatar" ON "storage"."objects" FOR UPDATE USING ((("bucket_id" = 'avatars'::"text") AND (("auth"."uid"())::"text" = ("storage"."foldername"("name"))[1])));



CREATE POLICY "Users can upload their own avatar" ON "storage"."objects" FOR INSERT WITH CHECK ((("bucket_id" = 'avatars'::"text") AND (("auth"."uid"())::"text" = ("storage"."foldername"("name"))[1])));



CREATE POLICY "Users can view their own avatar" ON "storage"."objects" FOR SELECT USING ((("bucket_id" = 'avatars'::"text") AND (("auth"."uid"())::"text" = ("storage"."foldername"("name"))[1])));



