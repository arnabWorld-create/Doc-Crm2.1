# DoXcia - Doctor CRM & Landing Page

A comprehensive clinic management system with an integrated landing page for medical practices.

## 🚀 Features

### Landing Page
- Professional landing page at root URL (/)
- Fully responsive design
- WhatsApp booking integration
- Google Maps integration
- SEO optimized
- Fast loading with Next.js optimization

### CRM System
- Patient management
- Appointment scheduling
- Visit history tracking
- Prescription generation & printing
- Medical reports upload (Supabase storage)
- Analytics dashboard
- Calendar view
- Patient search
- Export functionality

## 📋 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Storage:** Supabase Storage
- **Authentication:** JWT
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI + Custom components

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy `.env.example` to `.env.local` and fill in your values:

```env
DATABASE_URL="your-database-url"
DIRECT_URL="your-direct-database-url"
JWT_SECRET="your-jwt-secret"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
NEXT_PUBLIC_SUPABASE_BUCKET="patient-reports"
```

### 3. Run Database Migrations
```bash
npx prisma migrate dev
```

### 4. Seed Database
```bash
npx prisma db seed
```

This creates a default user:
- Email: `demo@doxcia.com`
- Password: `compass1234`

### 5. Start Development Server
```bash
npm run dev
```

Visit:
- Landing Page: http://localhost:3000
- CRM Login: http://localhost:3000/auth/login

## 📦 Production Deployment

### Deploy to Vercel

1. **Push to GitHub**
```bash
git add .
git commit -m "Ready for production"
git push origin main
```

2. **Import to Vercel**
- Go to [vercel.com](https://vercel.com)
- Click "New Project"
- Import your repository
- Framework: Next.js (auto-detected)

3. **Set Environment Variables**

In Vercel Dashboard → Settings → Environment Variables:

```env
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
JWT_SECRET=[generate-random-32-char-string]
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_BUCKET=patient-reports
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. **Deploy**
Click "Deploy" and wait for build to complete.

5. **Run Migrations**
```bash
DATABASE_URL="your-production-url" npx prisma migrate deploy
DATABASE_URL="your-production-url" npx prisma db seed
```

## 📚 Documentation

- `DEPLOYMENT.md` - Detailed deployment guide
- `VERCEL_DEPLOYMENT_QUICK_GUIDE.md` - Quick Vercel setup
- `VERCEL_FIX_PGBOUNCER.md` - Fix PgBouncer connection issues
- `VERCEL_ENV_SETUP.md` - Environment variables reference
- `SUPABASE_POOLER_SETUP.md` - Supabase connection pooling
- `LANDING_PRODUCTION_PUSH.md` - Landing page deployment
- `QUICK_START.md` - Quick start guide

## 🏗️ Project Structure

```
├── app/                    # Next.js app directory
│   ├── page.tsx           # Landing page (root)
│   ├── auth/              # Authentication pages
│   ├── patients/          # Patient management
│   ├── appointments/      # Appointment scheduling
│   ├── calendar/          # Calendar view
│   ├── analytics/         # Analytics dashboard
│   ├── settings/          # Settings pages
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utilities & helpers
├── prisma/               # Database schema & migrations
├── public/               # Static assets
│   └── landing-assets/   # Landing page images
└── utils/                # Utility functions
```

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Environment variables for sensitive data
- Supabase Row Level Security (RLS)
- HTTPS enforced in production

## 📱 Landing Page Sections

1. **Header** - Navigation with mobile menu
2. **Hero** - Introduction with CTAs
3. **About** - Doctor profile & credentials
4. **Services** - Medical services offered
5. **Gallery** - Clinic photos
6. **Testimonials** - Patient reviews
7. **Contact** - Address, hours, map
8. **Footer** - Links & social media

## 🎨 Customization

### Update Clinic Information
Edit `app/page.tsx` to update:
- Clinic name & doctor name
- Contact numbers
- Address
- Services
- Testimonials
- Social media links

### Update Colors
Edit `tailwind.config.js` for brand colors.

### Update Logo
Replace `public/landing-assets/clinic-logo.png`

## 🧪 Testing

```bash
# Run build test
npm run build

# Start production server locally
npm start
```

## 📞 Support

For issues or questions:
- Check documentation files
- Review Vercel deployment logs
- Check browser console for errors

## 📄 License

Private project for medical practice management.

---

**Built with ❤️ for healthcare professionals**
