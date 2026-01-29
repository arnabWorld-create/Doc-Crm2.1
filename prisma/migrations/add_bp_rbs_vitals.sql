-- Add BP and RBS fields to Visit table
-- This migration safely adds new columns without deleting any data

-- Add bpSystolic column
ALTER TABLE "visits" ADD COLUMN "bpSystolic" INTEGER;

-- Add bpDiastolic column
ALTER TABLE "visits" ADD COLUMN "bpDiastolic" INTEGER;

-- Add rbs column (Random Blood Sugar)
ALTER TABLE "visits" ADD COLUMN "rbs" INTEGER;

-- Add comments for clarity
COMMENT ON COLUMN "visits"."bpSystolic" IS 'Systolic Blood Pressure in mmHg';
COMMENT ON COLUMN "visits"."bpDiastolic" IS 'Diastolic Blood Pressure in mmHg';
COMMENT ON COLUMN "visits"."rbs" IS 'Random Blood Sugar in mg/dl';
