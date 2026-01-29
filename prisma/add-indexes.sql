-- Performance Optimization: Add Database Indexes
-- These indexes significantly speed up common queries

-- Patient table indexes
CREATE INDEX IF NOT EXISTS idx_patient_name ON "patients"(name);
CREATE INDEX IF NOT EXISTS idx_patient_contact ON "patients"(contact);
CREATE INDEX IF NOT EXISTS idx_patient_created_at ON "patients"("createdAt");
CREATE INDEX IF NOT EXISTS idx_patient_gender ON "patients"(gender);

-- Visit table indexes
CREATE INDEX IF NOT EXISTS idx_visit_patient_id ON "visits"("patientId");
CREATE INDEX IF NOT EXISTS idx_visit_date ON "visits"("visitDate");
CREATE INDEX IF NOT EXISTS idx_visit_follow_up_date ON "visits"("followUpDate");

-- Appointment table indexes
CREATE INDEX IF NOT EXISTS idx_appointment_patient_id ON "appointments"("patientId");
CREATE INDEX IF NOT EXISTS idx_appointment_date ON "appointments"("appointmentDate");
CREATE INDEX IF NOT EXISTS idx_appointment_status ON "appointments"(status);

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON "users"(email);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_visit_patient_date ON "visits"("patientId", "visitDate" DESC);
CREATE INDEX IF NOT EXISTS idx_appointment_date_status ON "appointments"("appointmentDate", status);
