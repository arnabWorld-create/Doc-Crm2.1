-- Create AnalyticsCache table
CREATE TABLE IF NOT EXISTS analytics_cache (
  id TEXT PRIMARY KEY,
  "cacheKey" TEXT UNIQUE NOT NULL,
  data TEXT NOT NULL,
  "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL
);

-- Create indexes for AnalyticsCache
CREATE INDEX IF NOT EXISTS "analytics_cache_cacheKey_idx" ON analytics_cache("cacheKey");
CREATE INDEX IF NOT EXISTS "analytics_cache_expiresAt_idx" ON analytics_cache("expiresAt");

-- Verify table was created
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'analytics_cache';
