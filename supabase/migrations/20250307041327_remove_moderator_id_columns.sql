-- Remove moderator_id from events table
-- First drop foreign key constraint
ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS events_moderator_id_fkey;

-- Then drop the column
ALTER TABLE public.events
DROP COLUMN IF EXISTS moderator_id;

-- Remove moderator_id from bookings table
-- First drop foreign key constraint
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_moderator_id_fkey;

-- Then drop the column
ALTER TABLE public.bookings
DROP COLUMN IF EXISTS moderator_id;

-- Update existing policies that might reference moderator_id
DROP POLICY IF EXISTS "Moderators can update events" ON public.events;
CREATE POLICY "Moderators can update events"
ON public.events
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id OR auth.uid() = ANY(moderators));

-- Update RLS for deletions as well
DROP POLICY IF EXISTS "Moderators can delete events" ON public.events;
CREATE POLICY "Moderators can delete events"
ON public.events
FOR DELETE
TO authenticated
USING (auth.uid() = creator_id OR auth.uid() = ANY(moderators));

-- Same for rentals
DROP POLICY IF EXISTS "Moderators can update rentals" ON public.rentals;
CREATE POLICY "Moderators can update rentals"
ON public.rentals
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id OR auth.uid() = ANY(moderators));

DROP POLICY IF EXISTS "Moderators can delete rentals" ON public.rentals;
CREATE POLICY "Moderators can delete rentals"
ON public.rentals
FOR DELETE
TO authenticated
USING (auth.uid() = creator_id OR auth.uid() = ANY(moderators));
