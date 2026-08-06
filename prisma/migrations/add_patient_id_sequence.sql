-- Migration: Add atomic sequence for patient ID generation
-- Fixes the race condition where two concurrent requests could read the same
-- MAX(patientId) and generate duplicate FC-XXX IDs.
--
-- This sequence starts from the current max so existing IDs are not re-used.
-- Run this once against the production database:
--   psql $DATABASE_URL -f prisma/migrations/add_patient_id_sequence.sql

DO $$
DECLARE
  current_max INTEGER;
BEGIN
  -- Find the highest existing numeric suffix (e.g. FC-042 → 42)
  SELECT COALESCE(
    MAX(CAST(SUBSTRING("patientId" FROM 'FC-([0-9]+)') AS INTEGER)),
    0
  )
  INTO current_max
  FROM patients
  WHERE "patientId" ~ 'FC-[0-9]+';

  -- Create the sequence starting one above the current max
  EXECUTE format(
    'CREATE SEQUENCE IF NOT EXISTS patient_id_seq START WITH %s INCREMENT BY 1 NO CYCLE',
    current_max + 1
  );

  -- If the sequence already exists but its current value is lower than current_max,
  -- advance it so we never re-issue a used ID.
  PERFORM setval('patient_id_seq', GREATEST(current_max, nextval('patient_id_seq') - 1), true);
END
$$;
