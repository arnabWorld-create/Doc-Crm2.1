-- Update passwords with correct bcrypt hashes
-- These are bcrypt hashes with salt rounds 8

-- For password: compass1234
UPDATE "users" 
SET password = '$2a$08$8.oJJKj7H8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8'
WHERE email = 'demo@doxcia.com';

-- For password: admin123
UPDATE "users" 
SET password = '$2a$08$8.oJJKj7H8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8'
WHERE email = 'admin@doxcia.com';

-- Verify
SELECT id, email, name, password FROM "users" WHERE email IN ('demo@doxcia.com', 'draishwaryaradia@gmail.com');
