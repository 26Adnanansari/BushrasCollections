# ✅ Auto-Setup Checklist - New Database

## 🎯 What You Need To Do (Manual)

### 1. Create Supabase Project (2 minutes)
- [ ] Go to supabase.com
- [ ] Click "New Project"
- [ ] Choose name, password, region
- [ ] Wait for project creation

### 2. Update .env File (1 minute)
Get from Supabase Dashboard → Settings → API:
- [ ] Copy **Project URL** → Update `VITE_SUPABASE_URL`
- [ ] Copy **anon/public key** → Update `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] Copy **Project ID** → Update `VITE_SUPABASE_PROJECT_ID`

### 3. Run Database Setup (1 minute)
**Option A - Automated Setup Script:**
```bash
npm run setup
# This will guide you through the setup process
```

**Option B - Using Supabase CLI:**
```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Push single consolidated migration
supabase db push
```

**Option C - Manual via SQL Editor:**
1. Open Supabase Dashboard → SQL Editor
2. Copy content from `supabase/migrations/0001_complete_schema.sql`
3. Paste and run (single file, ~400 lines)

### 4. Run Storage Setup (1 minute)
In SQL Editor, run:
```sql
-- Copy entire STORAGE-FIX.sql file and execute
```

### 5. Configure Auth (1 minute)
- [ ] Authentication → Providers → Email → **Disable** "Confirm email" (for testing)
- [ ] Authentication → URL Configuration → Set **Site URL**: `http://localhost:5173`
- [ ] Add **Redirect URLs**: 
  - `http://localhost:5173/*`
  - `http://localhost:8080/*`
  - Your production domain

### 6. Make Yourself Admin (1 minute)
```sql
-- In SQL Editor, run:
-- 1. Find your user ID after signing up
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- 2. Assign admin role (replace with your ID)
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-id-here', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

---

## ⚙️ What Happens Automatically

### Single Migration File (`0001_complete_schema.sql`):
✅ **Tables Created:**
- profiles (user data)
- user_roles (security: roles separate from profiles)
- products (catalog)
- orders (user purchases)
- payment_methods (payment options)
- hero_slides (homepage carousel)

✅ **Security Functions:**
- has_role() - Check user role
- is_admin() - Check admin/super_admin
- is_super_admin() - Check super_admin only

✅ **RLS Policies:**
- Users can only see their own data
- Admins can manage all data
- Public can view products/slides

✅ **Storage Buckets:**
- product-images (5MB limit, images only)
- hero-media (10MB limit, images/videos)
- Proper admin-only upload policies

✅ **Performance:**
- Database indexes on all key columns
- Optimized for queries and searches

✅ **Automation:**
- Auto-create profile on signup
- Auto-update timestamps
- Default 'user' role assignment

✅ **Default Data:**
- "Contact Payment" method
- Sample products (optional demo)

---

## 🧪 Testing Steps

### 1. Start the App
```bash
npm install  # First time only
npm run dev  # Starts on http://localhost:8080
```

### 2. Test Guest Flow
- [ ] Homepage loads
- [ ] Products page shows products (or empty state)
- [ ] Can add to cart
- [ ] Cart persists after refresh

### 3. Test Sign Up
- [ ] Go to `/auth`
- [ ] Sign up with email/password
- [ ] Redirected to homepage
- [ ] Check Supabase → Table Editor → `profiles` (profile created)
- [ ] Check `user_roles` (default 'user' role assigned)

### 4. Test Admin Access
- [ ] Make yourself admin (SQL from step 6 above)
- [ ] Sign out and sign in again
- [ ] Visit `/admin` - should load dashboard
- [ ] Try `/admin/products` - should work
- [ ] Upload a product image - should succeed

### 5. Test Order Flow
- [ ] Add products to cart
- [ ] Go to checkout
- [ ] Fill shipping info
- [ ] Select payment method
- [ ] Place order
- [ ] Check Supabase → `orders` table (order created)
- [ ] Cart should be cleared

---

## 🐛 Common Issues & Fixes

### "Database connection failed"
**Fix**: Check .env has correct credentials from Supabase

### "Migration failed: table already exists"
**Fix**: Tables exist from previous setup. Either:
- Drop all tables in Supabase and re-run migrations
- Skip migrations if database already setup

### "Can't upload images"
**Fix**: Run `STORAGE-FIX.sql` in SQL Editor

### "Infinite recursion in policy"
**Fix**: Migrations already handle this with security definer functions

### "Can't access admin routes"
**Fix**: 
1. Check you added admin role to `user_roles` table
2. Sign out and sign in again
3. Check browser console for errors

---

## 📦 Final Checklist

Before considering setup complete:
- [ ] App runs without errors
- [ ] Can sign up/sign in
- [ ] Profile created automatically
- [ ] Guest cart works
- [ ] Admin can access admin panel
- [ ] Images upload successfully
- [ ] Orders can be created
- [ ] RLS policies working (users only see their own data)

---

## 🚀 Production Deployment

When ready to deploy:
1. **Update .env for production**:
   - Create production Supabase project (repeat steps 1-6)
   - Or use same database for dev/prod (not recommended)

2. **Deploy to Vercel/Netlify**:
   - Push to GitHub
   - Connect repo
   - Add environment variables
   - Deploy

3. **Update Supabase URLs**:
   - Site URL → your production domain
   - Redirect URLs → add production domain

4. **Production Security**:
   - [ ] Enable email confirmation
   - [ ] Enable password strength requirements
   - [ ] Review RLS policies
   - [ ] Set up database backups
   - [ ] Enable rate limiting

---

## 📊 Database Schema Overview

```
auth.users (Supabase managed)
    ↓
profiles (auto-created on signup)
    ↓
user_roles (default: 'user', can be 'admin', 'super_admin')

products (catalog)
    ↓
orders (user orders)
    ↓
items (JSON field with cart items)

payment_methods (admin managed)
hero_slides (homepage carousel)
```

---

**Total Setup Time**: ~10 minutes
**Manual Steps**: 6
**Automated**: Everything else!
