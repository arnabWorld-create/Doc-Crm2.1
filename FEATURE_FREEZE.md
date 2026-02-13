# Feature Freeze: What Can and Cannot Be Changed

**Status**: ACTIVE (until seed funding secured)  
**Purpose**: Prevent scope creep and maintain stability during beta  
**Authority**: All changes must follow these rules  
**Last Updated**: February 13, 2026

---

## Core Principle

> **Stability and investor trust > new features**

During beta phase (0-100 clinics), we prioritize:
1. **Stability**: Don't break what works
2. **Security**: Fix vulnerabilities immediately
3. **Performance**: Prevent degradation
4. **Documentation**: Build investor confidence
5. **Bug fixes**: Improve user experience

We explicitly deprioritize:
1. ❌ New features that increase complexity
2. ❌ Architectural experiments
3. ❌ Premature optimizations
4. ❌ Nice-to-have improvements
5. ❌ Scope expansion

---

## Change Categories

### 🟢 APPROVED: Always Allowed

These changes can be made without approval:

1. **Critical bug fixes**
   - Data corruption prevention
   - Security vulnerabilities
   - System crashes or errors
   - Data loss prevention

2. **Performance fixes**
   - Query optimization
   - Index additions
   - Caching implementation
   - Connection pool fixes

3. **Security improvements**
   - Authentication hardening
   - Input validation
   - Rate limiting
   - Audit logging

4. **Documentation**
   - Code comments
   - API documentation
   - User guides
   - Runbooks

5. **Monitoring**
   - Error tracking
   - Performance metrics
   - Uptime monitoring
   - Cost tracking

---

### 🟡 CONDITIONAL: Requires Justification

These changes require clear justification in PR:

1. **Minor features**
   - Must solve real user pain point
   - Must not increase complexity
   - Must not require schema changes
   - Must be reversible

2. **UI improvements**
   - Must improve usability
   - Must not break existing workflows
   - Must be tested with users
   - Must maintain consistency

3. **Refactoring**
   - Must reduce technical debt
   - Must not change behavior
   - Must have test coverage
   - Must be incremental

4. **Dependency updates**
   - Security patches: Always approved
   - Minor versions: Requires testing
   - Major versions: Requires justification
   - New dependencies: Requires strong justification

---

### 🔴 FORBIDDEN: Not Allowed

These changes are explicitly forbidden during beta:

1. **New major features**
   - ❌ Telemedicine
   - ❌ Lab integrations
   - ❌ Pharmacy inventory
   - ❌ SMS/email notifications
   - ❌ Mobile apps
   - ❌ API for third parties
   - ❌ Advanced reporting
   - ❌ Multi-clinic chains

2. **Architectural changes**
   - ❌ Database rewrites
   - ❌ Framework migrations
   - ❌ Multi-tenancy refactoring
   - ❌ Microservices split
   - ❌ GraphQL migration

3. **Breaking changes**
   - ❌ Schema migrations that break existing data
   - ❌ API changes that break frontend
   - ❌ Removing existing features
   - ❌ Changing core workflows

4. **Experimental features**
   - ❌ AI/ML features
   - ❌ Real-time collaboration
   - ❌ Blockchain/crypto
   - ❌ Unproven technologies

---

## DO NOT TOUCH Areas

These parts of the codebase are **frozen** until post-funding:

### 1. Authentication System
**Files**:
- `lib/auth.ts`
- `lib/api-auth.ts`
- `middleware.ts`
- `app/api/auth/*`

**Why**: Core security, high risk of breaking

**Allowed**:
- ✅ Increase bcrypt rounds
- ✅ Add rate limiting
- ✅ Fix security vulnerabilities

**Forbidden**:
- ❌ Change JWT implementation
- ❌ Add OAuth providers
- ❌ Change session management

---

### 2. Database Schema
**Files**:
- `prisma/schema.prisma`
- `prisma/migrations/*`

**Why**: Data integrity, migration complexity

**Allowed**:
- ✅ Add indexes
- ✅ Add nullable fields with defaults
- ✅ Add new tables (if absolutely necessary)

**Forbidden**:
- ❌ Rename fields
- ❌ Change field types
- ❌ Remove fields
- ❌ Add required fields without defaults
- ❌ Change relations

---

### 3. Payment System
**Files**:
- `lib/payment-service.ts`
- `lib/payment-config.ts`
- `app/api/payments/*`
- `app/api/invoices/*`

**Why**: Incomplete implementation, placeholder code

**Allowed**:
- ✅ Bug fixes in existing code
- ✅ Documentation improvements

**Forbidden**:
- ❌ Implement actual payment providers
- ❌ Add new payment methods
- ❌ Change invoice logic

**Note**: Payment system is placeholder only. Real implementation post-funding.

---

### 4. File Upload System
**Files**:
- `lib/supabase.ts`
- `lib/file-upload-validator.ts`
- `app/api/upload-logo/*`
- `components/ReportsUploader.tsx`

**Why**: Works but fragile, Supabase-specific

**Allowed**:
- ✅ Add file size limits
- ✅ Add file type validation
- ✅ Improve error handling

**Forbidden**:
- ❌ Change storage provider
- ❌ Add image processing
- ❌ Add CDN

---

### 5. Analytics System
**Files**:
- `app/analytics/page.tsx`
- `app/api/patients/analytics/route.ts`
- `components/PatientVisitAnalytics.tsx`
- `components/PaymentAnalytics.tsx`

**Why**: Performance issues, needs rewrite post-funding

**Allowed**:
- ✅ Add caching
- ✅ Add pagination
- ✅ Optimize queries
- ✅ Pre-calculate metrics

**Forbidden**:
- ❌ Add new analytics features
- ❌ Add custom report builder
- ❌ Add data export (beyond CSV)

---

## SAFE FOR BUG FIXES ONLY

These areas can be modified for bug fixes but not features:

### 1. Patient Management
**Files**:
- `app/patients/*`
- `app/api/patients/*`
- `components/PatientForm.tsx`
- `components/PatientTable.tsx`

**Allowed**:
- ✅ Fix validation errors
- ✅ Fix data display issues
- ✅ Improve error messages
- ✅ Fix search bugs

**Forbidden**:
- ❌ Add new patient fields (unless critical)
- ❌ Change patient workflow
- ❌ Add bulk operations

---

### 2. Visit Management
**Files**:
- `app/patients/[id]/visit/*`
- `app/api/patients/[id]/visits/*`
- `components/VisitForm.tsx`
- `components/MedicineInput.tsx`

**Allowed**:
- ✅ Fix medication input bugs
- ✅ Fix vitals validation
- ✅ Improve prescription printing
- ✅ Fix fee calculation

**Forbidden**:
- ❌ Add new visit types
- ❌ Change visit workflow
- ❌ Add templates or shortcuts

---

### 3. Appointment System
**Files**:
- `app/appointments/*`
- `app/api/appointments/*`
- `components/CalendarView.tsx`

**Allowed**:
- ✅ Fix calendar display bugs
- ✅ Fix appointment creation errors
- ✅ Improve time slot validation

**Forbidden**:
- ❌ Add recurring appointments
- ❌ Add appointment reminders
- ❌ Add online booking

---

## Change Request Process

### For Bug Fixes (🟢 Approved)
1. Create issue describing bug
2. Create PR with fix
3. Add tests if possible
4. Deploy after review

### For Minor Features (🟡 Conditional)
1. Create issue with justification:
   - What user pain point does this solve?
   - Why can't this wait until post-funding?
   - What's the complexity/risk?
   - What's the rollback plan?
2. Get approval from founder
3. Create PR with implementation
4. Add tests (mandatory)
5. Deploy after review

### For Major Features (🔴 Forbidden)
1. Add to post-funding roadmap
2. Document in INVESTOR_MVP.md
3. Do NOT implement during beta

---

## Exception Process

If you believe a forbidden change is absolutely necessary:

1. **Document the case**:
   - Why is this critical for beta success?
   - What happens if we don't do this?
   - What's the risk of doing this?
   - What's the rollback plan?

2. **Propose alternatives**:
   - Can this be solved with a workaround?
   - Can this wait until post-funding?
   - Can this be done manually?

3. **Get approval**:
   - Discuss with founder
   - Document decision in code comments
   - Add to technical debt log

4. **Implement carefully**:
   - Add comprehensive tests
   - Create rollback script
   - Monitor closely after deployment
   - Document in INVESTOR_MVP.md

---

## Code Comment Requirements

All changes must include appropriate comments:

### For Bug Fixes
```typescript
// BUG FIX: [Date] - [Description]
// Issue: [What was broken]
// Fix: [What was changed]
// Risk: [Low/Medium/High]
```

### For Performance Fixes
```typescript
// PERFORMANCE FIX: [Date] - [Description]
// Before: [Metric before fix]
// After: [Expected metric after fix]
// Approach: [What optimization was applied]
```

### For Security Fixes
```typescript
// SECURITY FIX: [Date] - [Description]
// Vulnerability: [What was vulnerable]
// Fix: [How it was fixed]
// Impact: [Who was affected]
```

### For Technical Debt
```typescript
// BETA SECURITY DECISION: [Date] - [Description]
// Reason: [Why this tradeoff was made]
// Risk: [What could go wrong]
// Migration Path: [How to fix post-funding]
// Estimated Effort: [Time to fix properly]
```

---

## Monitoring Changes

After any change is deployed:

1. **Monitor for 24 hours**:
   - Check error rates in Sentry
   - Check performance metrics in Vercel
   - Check user reports
   - Check database health

2. **Rollback if**:
   - Error rate increases >10%
   - Performance degrades >20%
   - Users report critical issues
   - Data corruption detected

3. **Document outcome**:
   - What worked well
   - What didn't work
   - What to do differently next time

---

## Quarterly Review

Every 3 months, review this document:

- [ ] Are the rules still appropriate?
- [ ] Are there new areas that should be frozen?
- [ ] Are there areas that can be unfrozen?
- [ ] Are the change categories still correct?
- [ ] Update based on lessons learned

---

## Conclusion

**Feature freeze is not about saying no. It's about saying "not yet."**

Every feature request is valid. But timing matters. During beta, stability and investor trust are more valuable than new features.

Post-funding, with a proper team and architecture, we can build everything on the wishlist.

But first, we need to prove the core product works and secure the resources to scale it properly.

**Stay disciplined. Stay focused. Build trust.**

---

**Questions?** Discuss with founder before proceeding.  
**Exceptions?** Document thoroughly and get approval.  
**Violations?** Will be reverted immediately.
