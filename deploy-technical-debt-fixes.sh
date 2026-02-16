#!/bin/bash

echo "=========================================="
echo "Technical Debt Fixes Deployment"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Install dependencies
echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 2: Generate Prisma client
echo -e "${YELLOW}Step 2: Generating Prisma client...${NC}"
npx prisma generate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to generate Prisma client${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Prisma client generated${NC}"
echo ""

# Step 3: Create database migration
echo -e "${YELLOW}Step 3: Creating database migration for VisitFee table...${NC}"
echo "This will create a new migration file."
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma migrate dev --name add_visit_fees_table
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to create migration${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Migration created${NC}"
else
    echo -e "${YELLOW}⚠️  Skipped migration creation${NC}"
fi
echo ""

# Step 4: Run data migration
echo -e "${YELLOW}Step 4: Migrating fee data from notes to VisitFee table...${NC}"
echo "This will extract fees from Visit.notes and create VisitFee records."
echo -e "${RED}⚠️  WARNING: This modifies your database!${NC}"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx tsx prisma/migrate-fees-from-notes.ts
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to migrate fee data${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Fee data migrated${NC}"
else
    echo -e "${YELLOW}⚠️  Skipped data migration${NC}"
fi
echo ""

# Step 5: Verify changes
echo -e "${YELLOW}Step 5: Verifying changes...${NC}"
echo "Checking for remaining fees in notes..."
REMAINING=$(npx prisma db execute --stdin <<EOF
SELECT COUNT(*) FROM visits WHERE notes LIKE '%__FEES_JSON__%';
EOF
)
echo "Visits with fees still in notes: $REMAINING"
echo ""

# Step 6: Redis setup reminder
echo -e "${YELLOW}Step 6: Redis Rate Limiting Setup${NC}"
echo "To enable Redis rate limiting:"
echo "1. Sign up at https://upstash.com (free tier available)"
echo "2. Create a Redis database"
echo "3. Add these to your .env.local and Vercel:"
echo "   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io"
echo "   UPSTASH_REDIS_REST_TOKEN=your-token-here"
echo ""
echo "Without Redis, the app will use in-memory rate limiting (works but resets on deploy)"
echo ""

# Step 7: Final checklist
echo "=========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. ✅ VisitFee table created"
echo "2. ✅ Fee data migrated (if you ran it)"
echo "3. ✅ API routes updated to use VisitFee table"
echo "4. ✅ Redis rate limiter implemented (with fallback)"
echo "5. ⚠️  Set up Upstash Redis for production"
echo "6. ⚠️  Deploy to Vercel"
echo "7. ⚠️  Test thoroughly"
echo ""
echo "To deploy to production:"
echo "  git add ."
echo "  git commit -m 'Fix: Normalize fee data and implement Redis rate limiting'"
echo "  git push origin main"
echo ""
echo "Don't forget to add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to Vercel!"
