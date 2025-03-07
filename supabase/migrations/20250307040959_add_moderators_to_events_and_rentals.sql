-- Add moderators column (as array of user IDs) to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS moderators UUID[] DEFAULT '{}';

-- Add moderators column (as array of user IDs) to rentals table
ALTER TABLE public.rentals 
ADD COLUMN IF NOT EXISTS moderators UUID[] DEFAULT '{}';

-- Add comment explaining the purpose of these columns
COMMENT ON COLUMN public.events.moderators IS 'Array of user IDs who can moderate this event';
COMMENT ON COLUMN public.rentals.moderators IS 'Array of user IDs who can moderate this rental';
