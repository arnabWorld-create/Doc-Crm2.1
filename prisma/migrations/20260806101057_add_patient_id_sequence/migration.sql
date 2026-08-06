-- Create sequence for atomic patient ID generation
-- Replaces O(n) fetch-all approach with O(1) nextval()

CREATE SEQUENCE IF NOT EXISTS patient_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- Set sequence current value to the max existing patient ID number
-- This ensures no duplicate IDs after migration
SELECT setval(
  'patient_id_seq',
  GREATEST(1, COALESCE(
    (SELECT MAX(CAST(SUBSTRING(p."patientId" FROM '^FC-(\d+)$') AS INTEGER))
     FROM patients p
     WHERE p."patientId" ~ '^FC-\d+$'),
    0
  ))
);

-- Add a comment for documentation
COMMENT ON SEQUENCE patient_id_seq IS 'Atomic counter for generating FC-XXX patient IDs';

