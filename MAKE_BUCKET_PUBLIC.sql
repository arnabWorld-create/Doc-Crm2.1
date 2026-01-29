-- Make patient-reports bucket public
-- Run this in Supabase SQL Editor

UPDATE storage.buckets 
SET public = true 
WHERE name = 'patient-reports';
