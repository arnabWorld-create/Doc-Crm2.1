-- Fix Storage RLS Policies for patient-reports bucket
-- Run this in Supabase SQL Editor

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anyone to read files from patient-reports bucket
CREATE POLICY "Allow public read patient-reports"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'patient-reports');

-- Policy 2: Allow authenticated users to upload to patient-reports
CREATE POLICY "Allow authenticated upload patient-reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'patient-reports' AND
    auth.role() = 'authenticated'
  );

-- Policy 3: Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated update patient-reports"
  ON storage.objects FOR UPDATE
  WITH CHECK (
    bucket_id = 'patient-reports' AND
    auth.role() = 'authenticated'
  );

-- Policy 4: Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated delete patient-reports"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'patient-reports' AND
    auth.role() = 'authenticated'
  );
