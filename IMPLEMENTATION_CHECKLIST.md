# Implementation Checklist: 100 Clinic Hardening

**Use this checklist to track progress on mandatory fixes.**

---

## Phase 1: Critical Fixes (P0) - DO TODAY

### ✅ Fix 1: Move Vercel Region (5 minutes)
- [ ] Go to Vercel Dashboard → Settings → Functions
- [ ] Change region from `iad1` to `bom1` or `sin1`
- [ ] Save changes
- [ ] Redeploy project
- [ ] Test analytics page (should be <5s)
- [ ] **Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

**Notes**:
```
Completion date: ___________
Load time before: ___________
Load time after: ___________
Issues encountered: ___________
```

---

### ✅ Fix 2: Fix Connection Pooling (30 minutes)
- [ ] Go to Vercel Dashboard → Settings → Environment Variables
- [ ] Update DATABASE_URL with connection pool parameters
- [ ] Verify DIRECT_URL is correct
- [ ] Save changes
- [ ] Redeploy project
- [ ] Test with multiple concurrent users
- [ ] **Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

**DATABASE_URL to use**:
```
postgresql://postgres.sxrolbjqenouqppjycmo:Puchu889956@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=20
```

**Notes**:
```
Completion date: ___________
Connection errors before: ___________
Connection errors after: ___________
Issues encountered: ___________
```

---

### ✅ Fix 3: Add Database Indexes (2 hours)
- [ ] Create migration file: `prisma/migrations/add_critical_indexes.sql`
- [ ] Copy SQL from SPEC_100_CLINIC_HARDENING.md
- [ ] Connect to production database
- [ ] Run migration: `\i prisma/migrations/add_critical_indexes.sql`
- [ ] Verify indexes: `\di`
- [ ] Test query performance with EXPLAIN ANALYZE
- [ ] Test application (all features work)
- [ ] **Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

**Notes**:
```
Completion date: ___________
Indexes created: ___________
Query performance improvement: ___________
Issues encountered: ___________
```

---

## Phase 2: High Priority Fixes (P1) - DO THIS WEEK

### ✅ Fix 4: Increase Bcrypt Rounds (1 hour)
- [ ] Update `lib/auth.ts` (change 8 to 12 rounds)
- [ ] Add gradual rehashing logic
- [ ] Test locally (new user registration)
- [ ] Test locally (existing user login)
- [ ] Commit and push
- [ ] Monitor Sentry for auth errors
- [ ] **Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

**Notes**:
```
Completion date: ___________
Auth errors after deployment: ___________
Performance impact: ___________
Issues encountered: ___________
```

---

### ✅ Fix 5: Pre-calculate Analytics (8 hours)
- [ ] Add AnalyticsCache model to Prisma schema
- [ ] Run migration: `npx prisma migrate dev --name add_analytics_cache`
- [ ] Create `lib/analytics-calculator.ts`
- [ ] Create `app/api/cron/calculate-analytics/route.ts`
- [ ] Update `app/api/patients/analytics/route.ts` to use cache
- [ ] Create `vercel.json` with cron config
- [ ] Generate CRON_SECRET and add to Vercel env vars
- [ ] Deploy and test
- [ ] Test cron endpoint manually
- [ ] Verify analytics page loads in <1s
- [ ] **Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

**Notes**:
```
Completion date: ___________
Analytics load time before: ___________
Analytics load time after: ___________
Cron job working: ___________
Issues encountered: ___________
```

---

### ✅ Fix 6: Add Redis Rate Limiting (4 hours)
- [ ] Sign up for Upstash Redis (free tier)
- [ ] Create Redis database
- [ ] Copy UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
- [ ] Add to Vercel environment variables
- [ ] Install: `npm install @upstash/redis`
- [ ] Create `lib/redis-rate-limiter.ts`
- [ ] Update `lib/middleware.ts` to use Redis
- [ ] Deploy and test
- [ ] Test rate limiting (make 10+ requests)
- [ ] Verify 429 status after limit exceeded
- [ ] **Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

**Notes**:
```
Completion date: ___________
Rate limiting working: ___________
Upstash dashboard showing requests: ___________
Issues encountered: ___________
```

---

## Phase 3: Medium Priority Fixes (P2) - DO THIS MONTH

### ✅ Fix 7: Implement Query Caching (6 hours)
- [ ] Create `lib/query-cache.ts`
- [ ] Add caching for patient list queries
- [ ] Add caching for visit history queries
- [ ] Add caching for appointment queries
- [ ] Implement cache invalidation
- [ ] Deploy and test
- [ ] Measure performance improvement
- [ ] **Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

**Notes**:
```
Completion date: ___________
Performance improvement: ___________
Issues encountered: ___________
```

---

### ✅ Fix 8: Add Monitoring Alerts (4 hours)
- [ ] Set up Sentry alerts (error rate >1%)
- [ ] Set up UptimeRobot (uptime monitoring)
- [ ] Set up Supabase alerts (database size)
- [ ] Set up Vercel alerts (cost)
- [ ] Test alerts (trigger manually)
- [ ] Document alert response procedures
- [ ] **Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

**Notes**:
```
Completion date: ___________
Alerts configured: ___________
Test alerts working: ___________
Issues encountered: ___________
```

---

### ✅ Fix 9: Strict Input Validation (6 hours)
- [ ] Audit all Zod schemas
- [ ] Remove all `.passthrough()`
- [ ] Add strict validation for all API routes
- [ ] Add input sanitization for text fields
- [ ] Test all API routes
- [ ] Deploy and monitor
- [ ] **Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

**Notes**:
```
Completion date: ___________
Schemas updated: ___________
Validation errors caught: ___________
Issues encountered: ___________
```

---

### ✅ Fix 10: Add Full-Text Search (8 hours)
- [ ] Create GIN indexes for full-text search
- [ ] Update patient search query to use FTS
- [ ] Add search ranking
- [ ] Add pagination (limit 50 results)
- [ ] Test search performance
- [ ] Deploy and monitor
- [ ] **Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

**Notes**:
```
Completion date: ___________
Search performance improvement: ___________
Issues encountered: ___________
```

---

## Testing Checklist

### Before Each Deployment
- [ ] Changes tested locally
- [ ] No breaking changes to existing features
- [ ] Rollback plan documented
- [ ] Backup created (if schema changes)

### After Each Deployment
- [ ] Analytics page loads correctly
- [ ] Patient search works
- [ ] Visit creation works
- [ ] Authentication works
- [ ] No errors in Sentry
- [ ] Performance metrics acceptable

---

## Success Metrics Tracking

### Performance Metrics

| Metric | Before | Target | After | Status |
|--------|--------|--------|-------|--------|
| Analytics load time | 10s | <5s | ___ | ⬜ |
| Patient search time | 1s | <2s | ___ | ⬜ |
| Visit creation time | 2s | <3s | ___ | ⬜ |
| Error rate | ~1% | <0.5% | ___ | ⬜ |

### Security Metrics

| Metric | Before | Target | After | Status |
|--------|--------|--------|-------|--------|
| Bcrypt rounds | 8 | 12 | ___ | ⬜ |
| Rate limiting | In-memory | Redis | ___ | ⬜ |
| Input validation | Loose | Strict | ___ | ⬜ |

### Capacity Metrics

| Metric | Before | Target | After | Status |
|--------|--------|--------|-------|--------|
| Max clinics | ~25 | 100 | ___ | ⬜ |
| Max patients | ~1,000 | 4,000 | ___ | ⬜ |
| Max concurrent users | ~5 | 50 | ___ | ⬜ |

---

## Timeline Tracking

### Week 1: Critical Fixes (P0)
- Start date: ___________
- End date: ___________
- Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete
- Blockers: ___________

### Week 2: High Priority Fixes (P1)
- Start date: ___________
- End date: ___________
- Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete
- Blockers: ___________

### Week 3: Medium Priority Fixes (P2)
- Start date: ___________
- End date: ___________
- Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete
- Blockers: ___________

### Week 4: Testing & Documentation
- Start date: ___________
- End date: ___________
- Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete
- Blockers: ___________

---

## Issues & Blockers Log

### Issue 1
- Date: ___________
- Description: ___________
- Impact: ___________
- Resolution: ___________
- Status: ⬜ Open | 🟡 In Progress | ✅ Resolved

### Issue 2
- Date: ___________
- Description: ___________
- Impact: ___________
- Resolution: ___________
- Status: ⬜ Open | 🟡 In Progress | ✅ Resolved

### Issue 3
- Date: ___________
- Description: ___________
- Impact: ___________
- Resolution: ___________
- Status: ⬜ Open | 🟡 In Progress | ✅ Resolved

---

## Completion Sign-off

### Phase 1 (P0) - Critical Fixes
- Completed by: ___________
- Date: ___________
- All tests passed: ⬜ Yes | ⬜ No
- Production verified: ⬜ Yes | ⬜ No
- Signature: ___________

### Phase 2 (P1) - High Priority Fixes
- Completed by: ___________
- Date: ___________
- All tests passed: ⬜ Yes | ⬜ No
- Production verified: ⬜ Yes | ⬜ No
- Signature: ___________

### Phase 3 (P2) - Medium Priority Fixes
- Completed by: ___________
- Date: ___________
- All tests passed: ⬜ Yes | ⬜ No
- Production verified: ⬜ Yes | ⬜ No
- Signature: ___________

---

## Final Verification

### Load Testing Results
- 10 concurrent users: ⬜ Pass | ⬜ Fail
- 100 patients per clinic: ⬜ Pass | ⬜ Fail
- 1000 visits total: ⬜ Pass | ⬜ Fail
- No errors: ⬜ Pass | ⬜ Fail

### Documentation Updated
- [ ] INVESTOR_MVP.md updated
- [ ] 100_CLINIC_OPERATIONS.md updated
- [ ] README.md updated
- [ ] Runbooks created

### Communication Completed
- [ ] Users notified of improvements
- [ ] Investor deck updated
- [ ] Team trained (if applicable)
- [ ] Feedback gathered

---

## Ready for 100 Clinics? ✅

- [ ] All P0 fixes complete
- [ ] All P1 fixes complete
- [ ] All P2 fixes complete (or deferred with justification)
- [ ] All tests passed
- [ ] Documentation updated
- [ ] Monitoring in place
- [ ] Team trained

**If all checked, you're ready to scale to 100 clinics!** 🚀

---

**Last Updated**: ___________  
**Completed By**: ___________  
**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete
