-- Update or create RLS policies to allow access to moderators
DROP POLICY IF EXISTS "Moderators can update events" ON public.events;
CREATE POLICY "Moderators can update events"
ON public.events
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id OR auth.uid() = ANY(moderators));

DROP POLICY IF EXISTS "Moderators can update rentals" ON public.rentals;
CREATE POLICY "Moderators can update rentals"
ON public.rentals
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id OR auth.uid() = ANY(moderators));
