# 🚀 Database Setup Guide - One Command!

## What This Does
This app provides **automated database setup** with a single command. Just provide Supabase credentials and run `npm run setup`.

---

## ⚡ Super Quick Setup (3 Steps)

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: Bushras Collection
   - **Database Password**: (create a strong password, save it!)
   - **Region**: Choose closest to you
4. Click "Create Project" (takes 2-3 minutes)

### Step 2: Get Your Credentials
1. In Supabase Dashboard → **Settings** → **API**
2. Copy these 3 values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Project ID** (just the xxxxx part)
   - **anon/public key** (long JWT token starting with `eyJ...`)

### Step 3: Run Automated Setup
Open `.env` file and update with your credentials:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...your-key-here
VITE_SUPABASE_PROJECT_ID=xxxxx
```

Then run the automated setup:

**Option A - Using Supabase CLI (Recommended):**
```bash
npm run setup
# Follow the instructions to use: supabase db push
```

**Option B - Manual SQL Editor:**
```bash
# Copy content from: supabase/migrations/0001_complete_schema.sql
# Paste into Supabase Dashboard → SQL Editor → Run
```

**Done!** Database is now ready.

---

## 🎯 What Gets Created Automatically

The single migration file (`0001_complete_schema.sql`) creates:
1. ✅ All database tables (products, orders, profiles, payment_methods, hero_slides, user_roles)
2. ✅ Security functions (is_admin, has_role, is_super_admin)
3. ✅ Row Level Security policies for all tables
4. ✅ Storage buckets (product-images, hero-media) with policies
5. ✅ Database indexes for performance
6. ✅ Triggers (auto-profile creation, auto-update timestamps)
7. ✅ Default payment method ("Contact Payment")
8. ✅ Sample products and hero slides (optional demo data)

---

## 📊 Database Tables Created

### Core Tables:
- **profiles** - User profiles (name, phone, address, avatar)
- **user_roles** - User roles (user, admin, super_admin)
- **products** - Product catalog
- **orders** - Customer orders
- **payment_methods** - Payment options
- **hero_slides** - Homepage carousel

### Storage Buckets:
- **product-images** - Product photos (public)
- **hero-media** - Hero slider images (public)

---

## 👤 Making Yourself Admin

### Option 1: Via Supabase SQL Editor
1. In Supabase Dashboard → **SQL Editor**
2. Create new query
3. Run this (replace with your email):

```sql
-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- Copy the ID from above, then run:
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-id-here', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

### Option 2: Via Table Editor
1. Sign up in your app first
2. In Supabase Dashboard → **Table Editor** → **user_roles**
3. Click "Insert row"
4. Fill in:
   - **user_id**: Your ID from auth.users table
   - **role**: Select `admin`
5. Save

---

## 🔐 Security Checklist

### Required Steps:
- [ ] **Disable Email Confirmation** (for testing):
  - Go to **Authentication** → **Providers** → **Email**
  - Turn OFF "Confirm email"
  - Click Save

- [ ] **Set Site URL**:
  - Go to **Authentication** → **URL Configuration**
  - Set **Site URL**: Your app URL
  - Add **Redirect URLs**: 
    - `https://your-app.com/*`
    - `http://localhost:5173/*` (for local dev)

- [ ] **Never commit .env to Git**:
  - .env is already in .gitignore ✅
  - Never share your keys publicly

---

## 🧪 Testing Your Setup

### 1. Test Authentication
```bash
npm run dev
# Open http://localhost:8080
```
- [ ] Visit `/auth` page
- [ ] Sign up with email/password
- [ ] Check profile created (Supabase → Table Editor → profiles)
- [ ] Default 'user' role assigned (check user_roles table)

### 2. Test Admin Access
- [ ] Make yourself admin (see above)
- [ ] Sign in again
- [ ] Visit `/admin` - should work!
- [ ] Try uploading product image

### 3. Test Guest Flow
- [ ] Sign out
- [ ] Browse products
- [ ] Add to cart
- [ ] Cart persists after refresh

---

## 🔄 Automated Backup System

### Run Automated Backup
```bash
# Backup database tables only
npm run backup

# Backup database + list storage files
npm run backup --storage
```

Backups are saved to `backups/backup_TIMESTAMP/` folder with:
- JSON files for each table
- File lists for storage buckets
- backup_summary.json with stats

### Schedule Daily Backups (Linux/Mac)
```bash
# Open crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/project && npm run backup
```

### Manual Supabase Backups
See `BACKUP-GUIDE.md` for Supabase dashboard backup methods.

---

## ❓ Troubleshooting

### "Failed to create table"
- Make sure database password is correct in Supabase
- Check if tables already exist (Table Editor)
- Try running migrations manually from `supabase/migrations/` folder

### "Can't upload images"
Run this SQL in SQL Editor:
```sql
-- Copy from STORAGE-FIX.sql and run
```
Or just run the entire `STORAGE-FIX.sql` file.

### "Can't access admin panel"
- Make sure you added admin role to user_roles table
- Sign out and sign in again
- Check browser console for errors

### "Auth redirect to localhost"
- Update Site URL in Supabase (see Security Checklist)
- Add all your domains to Redirect URLs

---

## 🎨 Customization

### Change App Name
- Update `index.html` → `<title>` tag
- Update homepage text in `src/pages/Index.tsx`

### Change Colors
- Edit `src/index.css` → CSS variables
- Edit `tailwind.config.ts` → theme colors

### Add Products
- Sign in as admin
- Go to `/admin/products`
- Click "Add Product"
- Upload images, fill details, save

---

## 📁 Important Files

**Don't Edit These:**
- `src/integrations/supabase/client.ts` - Auto-generated
- `src/integrations/supabase/types.ts` - Auto-generated
- `.env` - Configured (only edit credentials)
- `supabase/config.toml` - Auto-configured

**Migration Files:**
- All SQL in `supabase/migrations/` runs automatically
- Migrations run in order by timestamp
- Never edit old migrations (create new ones)

**Helper Files:**
- `STORAGE-FIX.sql` - Fix image upload issues
- `BACKUP-GUIDE.md` - Backup strategies

---

## 🚀 Deploying to Production

1. **Push to GitHub**:
```bash
git add .
git commit -m "Setup complete"
git push origin main
```

2. **Deploy to Vercel** (Easiest):
   - Connect GitHub repo
   - Add environment variables from .env
   - Click Deploy
   - Update Site URL in Supabase to your Vercel URL

3. **Production Checklist**:
   - [ ] Enable email confirmation in Supabase
   - [ ] Update all Site URLs and Redirect URLs
   - [ ] Test auth flow on production domain
   - [ ] Make yourself admin on production DB
   - [ ] Add real products

---

## ✅ Summary

**Setup Time**: ~5 minutes
**Manual Steps**: 3 (Create project, update .env, run setup command)
**What's Automated**: Everything else!

**Single Migration File**: `supabase/migrations/0001_complete_schema.sql`
- Consolidated from 19 separate migrations
- One file = zero errors
- Complete schema in ~400 lines

**Automated Scripts**:
- `npm run setup` - Database setup helper
- `npm run backup` - Automated backups

You only need to:
1. Create Supabase project
2. Update .env with credentials  
3. Run: `npm run setup` (then follow instructions)
4. Make yourself admin
5. Done!

---

**Need Help?**
- Check Supabase SQL Editor for migration errors
- Check browser console for frontend errors
- Review `BACKUP-GUIDE.md` for data management
