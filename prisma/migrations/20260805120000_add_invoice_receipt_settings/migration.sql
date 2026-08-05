ALTER TABLE "clinic_profile"
  ADD COLUMN IF NOT EXISTS "invoiceHeader" TEXT,
  ADD COLUMN IF NOT EXISTS "invoiceFooter" TEXT,
  ADD COLUMN IF NOT EXISTS "receiptHeader" TEXT,
  ADD COLUMN IF NOT EXISTS "receiptFooter" TEXT;
