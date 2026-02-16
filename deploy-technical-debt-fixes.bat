@echo off
echo ==========================================
echo Technical Debt Fixes Deployment
echo ==========================================
echo.

REM Step 1: Install dependencies
echo Step 1: Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [SUCCESS] Dependencies installed
echo.

REM Step 2: Generate Prisma client
echo Step 2: Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] Failed to generate Prisma client
    exit /b 1
)
echo [SUCCESS] Prisma client generated
echo.

REM Step 3: Create database migration
echo Step 3: Creating database migration for VisitFee table...
echo This will create a new migration file.
set /p CONTINUE="Continue? (y/n): "
if /i "%CONTINUE%"=="y" (
    call npx prisma migrate dev --name add_visit_fees_table
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create migration
        exit /b 1
    )
    echo [SUCCESS] Migration created
) else (
    echo [WARNING] Skipped migration creation
)
echo.

REM Step 4: Run data migration
echo Step 4: Migrating fee data from notes to VisitFee table...
echo This will extract fees from Visit.notes and create VisitFee records.
echo [WARNING] This modifies your database!
set /p CONTINUE="Continue? (y/n): "
if /i "%CONTINUE%"=="y" (
    call npx tsx prisma/migrate-fees-from-notes.ts
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to migrate fee data
        exit /b 1
    )
    echo [SUCCESS] Fee data migrated
) else (
    echo [WARNING] Skipped data migration
)
echo.

REM Step 5: Redis setup reminder
echo Step 5: Redis Rate Limiting Setup
echo To enable Redis rate limiting:
echo 1. Sign up at https://upstash.com (free tier available)
echo 2. Create a Redis database
echo 3. Add these to your .env.local and Vercel:
echo    UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
echo    UPSTASH_REDIS_REST_TOKEN=your-token-here
echo.
echo Without Redis, the app will use in-memory rate limiting (works but resets on deploy)
echo.

REM Step 6: Final checklist
echo ==========================================
echo Deployment Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. [DONE] VisitFee table created
echo 2. [DONE] Fee data migrated (if you ran it)
echo 3. [DONE] API routes updated to use VisitFee table
echo 4. [DONE] Redis rate limiter implemented (with fallback)
echo 5. [TODO] Set up Upstash Redis for production
echo 6. [TODO] Deploy to Vercel
echo 7. [TODO] Test thoroughly
echo.
echo To deploy to production:
echo   git add .
echo   git commit -m "Fix: Normalize fee data and implement Redis rate limiting"
echo   git push origin main
echo.
echo Don't forget to add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to Vercel!
echo.
pause
