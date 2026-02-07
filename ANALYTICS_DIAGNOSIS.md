# Analytics Page Performance Diagnosis

## Current Status
- Load time: **10 seconds** (still too slow)
- Data volume: 41 patients, 72 visits (very small)
- Database queries: ~13 queries (optimized from 20+)
- Indexes: ✅ All applied

## Possible Causes

### 1. Supabase Connection Latency
**Most Likely Issue**: Your Supabase database is in `ap-south-1` (Mumbai), but Vercel is deploying to `iad1` (Washington DC, USA).

**Network latency**: ~200-300ms per query
**Total for 13 queries**: 2.6-3.9 seconds just for network!

### 2. Cold Start
First request after deployment or inactivity takes longer because:
- Serverless function needs to boot up
- Database connection pool needs to initialize
- Prisma client needs to load

### 3. Sequential Query Batches
Even though we batched queries, they still run sequentially:
- Batch 1: 5 queries (~1-1.5 seconds)
- Batch 2: 3 queries (~0.6-0.9 seconds)
- Batch 3: 4 queries (~0.8-1.2 seconds)
- Batch 4: 3 queries (~0.6-0.9 seconds)
- Medical analysis: cached (fast)
- Age groups: 1 query (~0.2-0.3 seconds)
- Weekly data: 1 query (~0.2-0.3 seconds)

**Total**: 4-5 seconds minimum

## Solutions to Try

### Option 1: Move Vercel Region Closer to Supabase ⚡ RECOMMENDED
Change Vercel deployment region from USA to Asia (closer to Mumbai).

**Steps**:
1. Go to Vercel Dashboard → Project Settings
2. Click "Functions"
3. Change region from `iad1` to `bom1` (Mumbai) or `sin1` (Singapore)
4. Redeploy

**Expected improvement**: 50-70% faster (3-5 seconds)

### Option 2: Reduce Queries Further
Combine more queries into single aggregations.

**Expected improvement**: 20-30% faster (7-8 seconds)

### Option 3: Use Supabase Edge Functions
Move analytics processing to Supabase Edge Functions (runs in same region as database).

**Expected improvement**: 60-80% faster (2-4 seconds)

### Option 4: Pre-calculate Analytics
Run analytics calculation in background job, store results in database.

**Expected improvement**: 90% faster (1 second) but data is stale

## Quick Test: Check Network Latency

Run this in Supabase SQL Editor to test connection:
```sql
SELECT NOW();
```

If it takes > 200ms, network latency is the issue.

## Recommended Action

**Try Option 1 first** - it's the easiest and will have the biggest impact.

If you can't change Vercel region, we'll need to implement Option 4 (pre-calculated analytics).
