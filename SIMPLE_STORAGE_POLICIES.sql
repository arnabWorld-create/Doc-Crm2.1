-- Simple Storage RLS Policies for patient-reports bucket
-- This allows public read and write access (suitable for internal clinic use)
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read patient-reports" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload patient-reports" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update patient-reports" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete patient-reports" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read patient-reports"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'patient-reports');

-- Allow public upload (for clinic internal use)
CREATE POLICY "Public upload patient-reports"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'patient-reports');

-- Allow public update
CREATE POLICY "Public update patient-reports"
  ON storage.objects FOR UPDATE
  WITH CHECK (bucket_id = 'patient-reports');

-- Allow public delete
CREATE POLICY "Public delete patient-reports"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'patient-reports');
