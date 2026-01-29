-- Enable Storage for patient-reports bucket
-- Run this in Supabase SQL Editor

-- Allow public read access to patient-reports bucket
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'patient-reports');

-- Allow authenticated users to upload to patient-reports bucket
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'patient-reports' AND
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Users can delete their own uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'patient-reports' AND
    auth.role() = 'authenticated'
  );
