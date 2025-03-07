-- Add read column to notifications table with default value of false (unread)
ALTER TABLE public.notifications 
ADD COLUMN read BOOLEAN NOT NULL DEFAULT false;

-- Add index on read and user_id columns for faster filtering of unread notifications
CREATE INDEX idx_notifications_user_id_read ON public.notifications (user_id, read);

-- Update existing RLS policies to allow updating the read status
CREATE POLICY "Users can update read status of their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMENT ON COLUMN public.notifications.read IS 'Whether the notification has been read by the user';
