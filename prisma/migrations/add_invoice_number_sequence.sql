-- Migration: Add atomic sequence for invoice number generation
-- Fixes the race condition where two concurrent requests could read the same
-- COUNT(invoices) and generate duplicate INV-YYYY-XXXXX numbers.
--
-- This sequence is intentionally NOT year-scoped — invoice numbers are unique
-- across all years. Year is embedded in the display label only.
--
-- Run this once against the production/staging database:
--   psql $DATABASE_URL -f prisma/migrations/add_invoice_number_sequence.sql

DO $$
DECLARE
  current_max INTEGER;
BEGIN
  -- Find the highest existing numeric suffix from INV-YYYY-NNNNN patterns
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING("invoiceNumber" FROM 'INV-\d{4}-([0-9]+)')
        AS INTEGER
      )
    ),
    0
  )
  INTO current_max
  FROM invoices
  WHERE "invoiceNumber" ~ '^INV-\d{4}-[0-9]+$';

  -- Create the sequence starting one above the current max
  EXECUTE format(
    'CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH %s INCREMENT BY 1 NO CYCLE',
    current_max + 1
  );

  -- If the sequence already exists but its current value is below current_max,
  -- advance it so we never re-issue a number that was already used.
  -- GREATEST(..., 1) ensures we never pass 0, which is below the sequence minimum.
  PERFORM setval(
    'invoice_number_seq',
    GREATEST(current_max, nextval('invoice_number_seq') - 1, 1),
    true
  );
END
$$;
