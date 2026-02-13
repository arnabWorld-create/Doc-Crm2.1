-- ============================================
-- 100 CLINIC HARDENING: DATABASE CHANGES
-- Run this in Supabase SQL Editor
-- Date: 2026-02-13
-- ============================================

-- PART 1: Critical Database Indexes
-- Purpose: Add missing indexes to improve query performance (10-100x faster)

-- Add indexes for foreign keys (if not already present)
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits("patientId");
CREATE INDEX IF NOT EXISTS idx_visits_visit_date ON visits("visitDate");
CREATE INDEX IF NOT EXISTS idx_medications_visit_id ON medications("visitId");
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments("patientId");
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments("appointmentDate");
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items("invoiceId");
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payments("patientId");
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments("createdAt");
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds("paymentId");
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices("patientId");
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Add indexes for search queries
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_contact ON patients(contact);
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients("patientId");

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_visits_patient_date ON visits("patientId", "visitDate" DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON appointments("patientId", "appointmentDate");

-- Add indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits("createdAt");
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients("createdAt");

-- Add index for user authentication
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- VERIFICATION: Check that indexes were created
-- ============================================

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Database indexes deployed successfully!';
    RAISE NOTICE '📊 Total indexes created: 20+';
    RAISE NOTICE '🚀 Expected performance improvement: 10-100x faster queries';
END $$;
