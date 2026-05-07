-- Run this in your Supabase SQL Editor to allow file uploads to the 'uploads' bucket

-- 1. Create a policy to allow anyone to upload files to the 'uploads' bucket
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'uploads');

-- 2. Create a policy to allow anyone to read files from the 'uploads' bucket
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');
