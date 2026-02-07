# Fix: Database Connection Pool Timeout on Vercel

## Problem
Analytics page shows error: "Timed out fetching a new connection from the connection pool"
- Connection limit: 1 (too low!)
- Timeout: 10 seconds

## Root Cause
The DATABASE_URL in Vercel doesn't have connection pooling parameters configured.

## Solution

### Step 1: Update Vercel Environment Variables

Go to your Vercel project settings and update the DATABASE_URL:

**Current (Wrong):**
```
DATABASE_URL=postgresql://postgres.sxrolbjqenouqppjycmo:Puchu889956@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
```

**New (Correct):**
```
DATABASE_URL=postgresql://postgres.sxrolbjqenouqppjycmo:Puchu889956@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=20
```

### Step 2: How to Update in Vercel

1. Go to https://vercel.com/dashboard
2. Click on your project "doccrm21"
3. Go to **Settings** → **Environment Variables**
4. Find `DATABASE_URL`
5. Click **Edit**
6. Replace with the new value above (with connection pool parameters)
7. Click **Save**
8. **Redeploy** your project

### Step 3: Verify DIRECT_URL

Make sure you also have DIRECT_URL set:
```
DIRECT_URL=postgresql://postgres:Puchu889956@db.sxrolbjqenouqppjycmo.supabase.co:5432/postgres
```

## What These Parameters Do

- `pgbouncer=true` - Enables PgBouncer compatibility mode
- `connection_limit=10` - Allows up to 10 concurrent connections (was 1!)
- `pool_timeout=20` - Waits 20 seconds for a connection (was 10)

## After Applying

1. Redeploy your Vercel project
2. Wait 2-3 minutes for deployment
3. Visit https://doccrm21.vercel.app/analytics
4. Should load in under 2 seconds with no errors!

## Local Testing

Your local .env.local has been updated with these parameters.
Test locally first:
```bash
npm run dev
# Visit http://localhost:3001/analytics
```

## Important Notes

- These changes are ONLY for the DATABASE_URL (pooled connection)
- DIRECT_URL stays the same (direct connection for migrations)
- Connection pooling is essential for serverless environments like Vercel
- Without it, you'll hit connection limits quickly

## Troubleshooting

If still getting errors after updating:
1. Make sure you clicked "Save" in Vercel
2. Make sure you redeployed after saving
3. Check Vercel logs for any other errors
4. Verify the DATABASE_URL was copied correctly (no extra spaces)

## Status Checklist

- [x] Updated lib/prisma.ts for serverless
- [x] Updated .env.local with connection pool params
- [ ] Update DATABASE_URL in Vercel (YOU NEED TO DO THIS)
- [ ] Redeploy Vercel project
- [ ] Test analytics page
