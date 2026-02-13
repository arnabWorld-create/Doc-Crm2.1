-- ============================================
-- 100 Clinic Hardening: Database Deployment
-- Date: 2026-02-13
-- ============================================

-- Part 1: Create AnalyticsCache Table
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_cache (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "cacheKey" TEXT UNIQUE NOT NULL,
  data TEXT NOT NULL,
  "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "analytics_cache_cacheKey_idx" ON analytics_cache("cacheKey");
CREATE INDEX IF NOT EXISTS "analytics_cache_expiresAt_idx" ON analytics_cache("expiresAt");

-- Part 2: Add Critical Database Indexes
-- ============================================

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
-- Verification
-- ============================================

-- Verify AnalyticsCache table was created
SELECT 'AnalyticsCache table created' AS status 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'analytics_cache';

-- Count indexes created
SELECT 
    schemaname,
    tablename,
    COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Show all indexes
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
