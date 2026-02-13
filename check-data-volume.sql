-- Check data volume in your database
-- Run this in Supabase SQL Editor to see how much data you have

SELECT 
  'patients' as table_name,
  COUNT(*) as total_records
FROM patients
UNION ALL
SELECT 
  'visits' as table_name,
  COUNT(*) as total_records
FROM visits
UNION ALL
SELECT 
  'appointments' as table_name,
  COUNT(*) as total_records
FROM appointments
UNION ALL
SELECT 
  'invoices' as table_name,
  COUNT(*) as total_records
FROM invoices
UNION ALL
SELECT 
  'payments' as table_name,
  COUNT(*) as total_records
FROM payments
ORDER BY table_name;
