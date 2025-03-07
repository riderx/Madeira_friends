-- Add INSERT policy for notifications table to allow system triggers to create notifications
CREATE POLICY "Allow system to create notifications" 
ON "public"."notifications" 
FOR INSERT 
WITH CHECK (true);

-- Note: This policy allows any authenticated user to create notifications
-- If more restrictive control is needed, modify the policy's WITH CHECK clause accordingly
-- For example, to restrict to only system/admin operations, you could implement a function
-- that checks if the operation is coming from a trusted context 
