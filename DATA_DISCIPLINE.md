# Data Discipline: Rules for Healthcare Data Integrity

**Purpose**: Prevent silent data corruption and maintain migration paths  
**Scope**: All database operations during beta phase (0-100 clinics)  
**Authority**: These rules are MANDATORY, not suggestions  
**Last Updated**: February 13, 2026

---

## Core Principle

> **Healthcare data is sacred. Corruption is unacceptable. Every decision must preserve future migration paths.**

---

## Current State (Honest Assessment)

### What We Did Wrong (Vibe Coding Debt)
1. **JSON in text fields**: Fees, reports, metadata stored as JSON strings
2. **String markers in notes**: `__FEES_JSON__` delimiters in free-text fields
3. **Nullable everything**: `z.union([z.string(), z.number(), z.null()]).optional().nullable()`
4. **Legacy fields**: `medicines: String?` kept for "backward compatibility" in a new app
5. **No validation**: `.passthrough()` allows arbitrary fields through

### Why This Happened
- Speed over structure during MVP development
- Avoiding schema migrations during rapid iteration
- Uncertainty about final data model
- Solo founder without code review

### Why This Matters
- **Can't query**: Can't filter patients by fee amount or report type
- **Can't validate**: JSON corruption won't be caught until read
- **Can't migrate**: No clear path from JSON strings to proper tables
- **Can't scale**: Performance degrades with large JSON blobs
- **Can't trust**: Silent failures possible during parsing

---

## Allowed Patterns (Beta Phase)

### ✅ ALLOWED: Existing JSON-in-Text Usage

These patterns are **frozen** but **allowed** during beta:

#### 1. Visit Reports (File Metadata)
```typescript
// Field: Visit.reports (String?)
// Format: JSON array of file objects
// Example: '[{"name":"xray.pdf","url":"https://...","size":1024}]'

// ALLOWED: Continue using this pattern
// REASON: File metadata is inherently unstructured
// MIGRATION PATH: Move to separate VisitReport table post-funding
```

#### 2. Visit Fees (Embedded in Notes)
```typescript
// Field: Visit.notes (String?)
// Format: __FEES_JSON__{"fees":[...],"total":500}__FEES_JSON__
// Example: "Patient complained of headache\n__FEES_JSON__..."

// ALLOWED: Continue using this pattern (reluctantly)
// REASON: Avoids schema migration during beta
// MIGRATION PATH: Extract to VisitFee table post-funding
// WARNING: This is ugly but documented
```

#### 3. Invoice/Payment Metadata
```typescript
// Field: Invoice.metadata, Payment.metadata (String?)
// Format: JSON object with provider-specific data
// Example: '{"stripe_payment_id":"pi_123","customer_id":"cus_456"}'

// ALLOWED: Continue using this pattern
// REASON: Provider-specific data is inherently unstructured
// MIGRATION PATH: Keep as JSON but add validation schema
```

---

### ❌ FORBIDDEN: New JSON-in-Text Fields

**DO NOT add new JSON-in-text fields without explicit approval.**

If you need to store structured data:
1. Create a proper table with foreign key
2. Use Prisma relations
3. Add indexes for query performance
4. Document the schema in Prisma

**Example of WRONG approach**:
```typescript
// ❌ FORBIDDEN
model Patient {
  preferences String? // JSON: {"theme":"dark","notifications":true}
}
```

**Example of RIGHT approach**:
```typescript
// ✅ CORRECT
model Patient {
  preferences PatientPreferences?
}

model PatientPreferences {
  id        String  @id @default(cuid())
  patientId String  @unique
  patient   Patient @relation(fields: [patientId], references: [id])
  theme     String  @default("light")
  notifications Boolean @default(true)
}
```

---

### ⚠️ CONDITIONAL: Nullable Fields

**Rule**: Only make fields nullable if they are truly optional.

**WRONG** (everything nullable):
```typescript
age: z.union([z.number(), z.string(), z.null()]).optional().nullable()
```

**RIGHT** (explicit optionality):
```typescript
age: z.number().int().min(0).max(150).optional() // Optional but typed
```

**EXCEPTION**: During beta, existing nullable unions are allowed but frozen. Do not add new ones.

---

## Validation Rules

### ✅ REQUIRED: Input Validation

All API routes MUST validate input with Zod schemas:

```typescript
// ✅ CORRECT
const createPatientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().int().min(0).max(150).optional(),
  contact: z.string().regex(/^\+?[0-9]{10,15}$/).optional(),
});

export const POST = withMiddleware(
  async (request: NextRequest, data) => {
    // data is already validated
  },
  {
    validateSchema: createPatientSchema,
    validateSource: 'body',
  }
);
```

### ❌ FORBIDDEN: .passthrough()

**DO NOT use `.passthrough()` in production schemas.**

```typescript
// ❌ FORBIDDEN
const schema = z.object({
  name: z.string(),
}).passthrough(); // Allows ANY extra fields

// ✅ CORRECT
const schema = z.object({
  name: z.string(),
}).strict(); // Rejects extra fields
```

**EXCEPTION**: Existing `.passthrough()` usage is allowed during beta but must be removed post-funding.

---

## Data Migration Rules

### ✅ REQUIRED: Migration Path Documentation

Every JSON-in-text field MUST have a documented migration path:

```typescript
// BETA SECURITY DECISION: Storing fees as JSON in notes field
// REASON: Avoids schema migration during rapid iteration
// MIGRATION PATH: 
//   1. Create VisitFee table with foreign key to Visit
//   2. Parse all existing Visit.notes for __FEES_JSON__ markers
//   3. Extract fee data and insert into VisitFee table
//   4. Remove __FEES_JSON__ markers from notes
//   5. Update all fee-related queries to use VisitFee table
// ESTIMATED EFFORT: 2-3 weeks post-funding
// RISK: Medium (data parsing complexity, potential corruption)
```

### ✅ REQUIRED: Backward Compatibility

When adding new fields, maintain backward compatibility:

```typescript
// ✅ CORRECT: New field with default value
model Visit {
  // ... existing fields
  bpSystolic  Int? // New field, nullable for existing records
  bpDiastolic Int? // New field, nullable for existing records
}
```

### ❌ FORBIDDEN: Breaking Changes

**DO NOT make breaking schema changes during beta:**
- ❌ Renaming fields
- ❌ Changing field types
- ❌ Removing fields
- ❌ Adding required fields without defaults

**EXCEPTION**: If absolutely necessary, create migration script and test on staging data first.

---

## Query Safety Rules

### ✅ REQUIRED: Parameterized Queries

Always use Prisma's query builder (parameterized by default):

```typescript
// ✅ CORRECT
const patient = await prisma.patient.findUnique({
  where: { id: patientId },
});
```

### ❌ FORBIDDEN: Raw SQL Without Parameters

**DO NOT use raw SQL with string interpolation:**

```typescript
// ❌ FORBIDDEN (SQL injection risk)
const result = await prisma.$queryRaw`
  SELECT * FROM patients WHERE name = '${name}'
`;

// ✅ CORRECT (parameterized)
const result = await prisma.$queryRaw`
  SELECT * FROM patients WHERE name = ${name}
`;
```

### ✅ REQUIRED: JSON Parsing Safety

When parsing JSON from text fields, handle errors:

```typescript
// ✅ CORRECT
function extractFeesFromNotes(notes: string | null): FeeData | null {
  if (!notes) return null;
  
  try {
    const match = notes.match(/__FEES_JSON__(.+?)__FEES_JSON__/);
    if (!match) return null;
    
    const feeData = JSON.parse(match[1]);
    
    // Validate structure
    if (!feeData.fees || !Array.isArray(feeData.fees)) {
      logger.warn('Invalid fee data structure', { notes });
      return null;
    }
    
    return feeData;
  } catch (error) {
    logger.error('Failed to parse fee data', error, { notes });
    return null; // Fail gracefully
  }
}
```

---

## Data Integrity Rules

### ✅ REQUIRED: Referential Integrity

Use Prisma relations with cascade deletes:

```typescript
// ✅ CORRECT
model Visit {
  id        String  @id @default(cuid())
  patientId String
  patient   Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)
}
```

### ✅ REQUIRED: Indexes on Foreign Keys

All foreign keys MUST have indexes:

```typescript
// ✅ CORRECT
model Visit {
  patientId String
  
  @@index([patientId])
}
```

### ⚠️ CONDITIONAL: Soft Deletes

**Rule**: Use hard deletes during beta (simpler). Consider soft deletes post-funding.

```typescript
// BETA DECISION: Hard deletes (onDelete: Cascade)
// REASON: Simpler logic, smaller database
// POST-FUNDING: Consider soft deletes for audit trail
// MIGRATION PATH: Add deletedAt field, update all queries
```

---

## Backup and Recovery Rules

### ✅ REQUIRED: Daily Backups

Supabase provides automatic backups. Verify they're enabled:
- Daily backups retained for 7 days
- Weekly backups retained for 4 weeks
- Manual backup before any schema migration

### ✅ REQUIRED: Backup Testing

Test backup restoration quarterly:
1. Download backup from Supabase
2. Restore to local Postgres instance
3. Verify data integrity
4. Document any issues

### ✅ REQUIRED: Pre-Migration Backup

Before any schema migration:
1. Create manual backup in Supabase
2. Export critical tables to CSV
3. Test migration on staging database
4. Document rollback procedure

---

## Monitoring Rules

### ✅ REQUIRED: Data Quality Checks

Run weekly data quality checks:

```sql
-- Check for orphaned records
SELECT COUNT(*) FROM visits WHERE patientId NOT IN (SELECT id FROM patients);

-- Check for invalid JSON in reports
SELECT id, reports FROM visits 
WHERE reports IS NOT NULL 
  AND reports != '' 
  AND reports NOT LIKE '[%]';

-- Check for corrupted fee data
SELECT id, notes FROM visits 
WHERE notes LIKE '%__FEES_JSON__%' 
  AND notes NOT LIKE '%"fees":%';

-- Check for duplicate patient IDs
SELECT patientId, COUNT(*) FROM patients 
GROUP BY patientId HAVING COUNT(*) > 1;
```

### ✅ REQUIRED: Error Logging

Log all data parsing errors:

```typescript
// ✅ CORRECT
try {
  const feeData = JSON.parse(feeJson);
} catch (error) {
  logger.error('Fee data parsing failed', error, {
    visitId: visit.id,
    patientId: visit.patientId,
    rawData: feeJson,
  });
  // Continue with null/default value
}
```

---

## Migration Checklist (Post-Funding)

When ready to normalize the database:

### Phase 1: Preparation (Week 1)
- [ ] Audit all JSON-in-text usage
- [ ] Design normalized schema
- [ ] Write migration scripts
- [ ] Create rollback scripts
- [ ] Set up staging environment

### Phase 2: Testing (Week 2)
- [ ] Restore production backup to staging
- [ ] Run migration scripts on staging
- [ ] Verify data integrity
- [ ] Test all queries against new schema
- [ ] Measure performance impact

### Phase 3: Execution (Week 3)
- [ ] Schedule maintenance window
- [ ] Create production backup
- [ ] Run migration scripts
- [ ] Verify data integrity
- [ ] Deploy updated application code
- [ ] Monitor for errors

### Phase 4: Cleanup (Week 4)
- [ ] Remove old JSON-in-text fields
- [ ] Update all documentation
- [ ] Archive migration scripts
- [ ] Celebrate 🎉

---

## Code Review Checklist

Before merging any PR that touches data:

- [ ] Does it add new JSON-in-text fields? (FORBIDDEN)
- [ ] Does it use `.passthrough()`? (FORBIDDEN)
- [ ] Does it make breaking schema changes? (FORBIDDEN)
- [ ] Does it use raw SQL without parameters? (FORBIDDEN)
- [ ] Does it handle JSON parsing errors? (REQUIRED)
- [ ] Does it maintain referential integrity? (REQUIRED)
- [ ] Does it add indexes for new foreign keys? (REQUIRED)
- [ ] Does it document migration path? (REQUIRED)
- [ ] Does it log data errors? (REQUIRED)

---

## Emergency Procedures

### Data Corruption Detected

1. **Immediate**: Stop all writes to affected table
2. **Assess**: Determine scope of corruption
3. **Restore**: Restore from most recent clean backup
4. **Fix**: Identify and fix root cause
5. **Verify**: Run data quality checks
6. **Resume**: Re-enable writes
7. **Document**: Write incident report

### Schema Migration Failed

1. **Immediate**: Stop migration process
2. **Rollback**: Execute rollback script
3. **Verify**: Confirm system is functional
4. **Investigate**: Determine failure cause
5. **Fix**: Update migration script
6. **Retry**: Test on staging before production retry

### Backup Restoration Needed

1. **Immediate**: Notify all users of downtime
2. **Restore**: Follow Supabase restoration procedure
3. **Verify**: Run data integrity checks
4. **Reconcile**: Identify data loss window
5. **Communicate**: Inform users of data loss
6. **Document**: Write incident report

---

## Conclusion

These rules exist to prevent the most common data disasters:
- Silent corruption
- Irreversible data loss
- Unmigrateable schemas
- Query performance collapse

Follow them religiously. Healthcare data deserves nothing less.

---

**Questions?** Review with senior engineer before proceeding.  
**Violations?** Document in code comments with BETA SECURITY DECISION marker.  
**Improvements?** Propose in PR with clear justification.
