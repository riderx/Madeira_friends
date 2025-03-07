-- Create a storage bucket for images with public access
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('images', 'images', true, false);

-- Set storage policy to allow public read access to all files in the images bucket
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'images');
  
-- Set storage policy to allow authenticated users to upload files to their own folder
CREATE POLICY "User Upload Access" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
  
-- Set storage policy to allow users to update and delete their own files
CREATE POLICY "User Update and Delete Access" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
  
CREATE POLICY "User Delete Access" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
