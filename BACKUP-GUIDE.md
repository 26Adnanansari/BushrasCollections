# Database Backup & Restore Guide

## 🎯 Why Backups Matter

Even with dummy data now, learning backups is crucial for when you have real customer data later.

---

## 📦 Method 1: Export Data (Easiest for Beginners)

### Backup Your Data

1. **Via Supabase Dashboard:**
   - Go to **Table Editor**
   - Select a table (e.g., `products`)
   - Click **"Export"** → Choose **CSV** or **JSON**
   - Repeat for each table: `orders`, `profiles`, `user_roles`, etc.

2. **Save files with date:**
   ```
   products-2024-01-15.csv
   orders-2024-01-15.csv
   profiles-2024-01-15.csv
   ```

### Restore Your Data

1. Go to **Table Editor**
2. Select table
3. Click **"Insert"** → **"Import data from CSV"**
4. Upload your backup file

---

## 🔧 Method 2: SQL Backup (Better for Full Backups)

### Create Full Database Backup

1. **In Supabase Dashboard**, go to **SQL Editor**
2. Run this to see your data:

```sql
-- Backup products
SELECT * FROM public.products;

-- Backup orders
SELECT * FROM public.orders;

-- Backup profiles
SELECT * FROM public.profiles;

-- Backup user_roles
SELECT * FROM public.user_roles;

-- Backup payment_methods
SELECT * FROM public.payment_methods;

-- Backup hero_slides
SELECT * FROM public.hero_slides;
```

3. Copy the results and save to files

### Or Use pg_dump (Advanced)

```bash
# If you have PostgreSQL client installed
pg_dump -h YOUR-PROJECT.supabase.co \
  -U postgres \
  -d postgres \
  --no-owner \
  --no-privileges \
  > backup-2024-01-15.sql
```

---

## 🔄 What Your Current SQL Files Do

### Migration Files (Setup, Not Backup)

1. **`CLEAN-DATABASE-RESET.sql`**
   - Creates empty table structure
   - Sets up RLS policies
   - **Does NOT contain your data**

2. **`database-complete-setup.sql`**
   - Creates tables, functions, triggers
   - Initial setup only

3. **`admin-permissions-migration.sql`**
   - Sets up role system
   - Not a backup

**Important:** These are *schema* files (structure), not *data* files (content)

---

## 📋 Complete Backup Checklist

### What to Backup:

**Database:**
- [ ] Products table data
- [ ] Orders table data
- [ ] Profiles table data
- [ ] User_roles table data
- [ ] Payment_methods table data
- [ ] Hero_slides table data

**Schema:**
- [ ] Table structure (automatically backed up in migrations/)
- [ ] RLS policies (in migrations/)
- [ ] Functions (in migrations/)

**Storage Buckets:**
- [ ] Product images from `product-images` bucket
- [ ] Hero images from `hero-media` bucket

**Code:**
- [ ] Push to GitHub (automatic backup)

---

## 💾 Download Storage Files

### Backup Product Images

1. Go to **Storage** → **product-images**
2. Select images
3. Download individually or use CLI:

```bash
# List files
supabase storage ls product-images

# Download all
supabase storage download product-images/*
```

---

## 🔒 Backup Strategy (Production)

### Daily Backups (Automatic)

Supabase provides:
- **Automatic daily backups** (Pro plan)
- Point-in-time recovery (Enterprise)

### Manual Weekly Backups

**Every Sunday:**
1. Export all tables to CSV
2. Download storage bucket files
3. Save to external drive or cloud storage (Google Drive, Dropbox)
4. Name with date: `backup-YYYY-MM-DD/`

### Before Major Changes

Always backup before:
- Running new migrations
- Deleting data
- Updating payment methods
- Changing user roles

---

## 🚀 Quick Backup Script (For When You Have Real Data)

Create `backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR="backups/$DATE"

mkdir -p $BACKUP_DIR

echo "Backing up database..."
# Add your pg_dump command here

echo "Backup complete: $BACKUP_DIR"
```

Run weekly:
```bash
chmod +x backup.sh
./backup.sh
```

---

## 🔄 Restore From Backup

### Restore Tables

1. **Delete existing data** (careful!):
```sql
DELETE FROM public.products;
DELETE FROM public.orders;
-- etc.
```

2. **Import CSV files** via Table Editor

### Or Restore Full Database

```sql
-- In SQL Editor, paste your backup SQL
INSERT INTO public.products (id, name, price, ...) VALUES
  ('uuid-1', 'Product 1', 100, ...),
  ('uuid-2', 'Product 2', 200, ...);
```

---

## 📝 Sample Backup Routine

### For Your Current Project

**Now (Testing Phase):**
- Don't need frequent backups
- Your migrations/ folder has the structure
- GitHub has your code

**Before Going Live:**
1. Create first real backup
2. Set up weekly backup schedule
3. Test restore process once

**After Launch:**
1. Daily: Supabase auto-backup (if Pro plan)
2. Weekly: Manual export to CSV
3. Monthly: Full database dump
4. Before migrations: Always backup first

---

## ⚠️ Important Notes

1. **Supabase Free Tier:**
   - No automatic backups
   - Must backup manually

2. **Supabase Pro Tier:**
   - Daily automatic backups (7 days retention)
   - Point-in-time recovery available

3. **Storage Bucket Backups:**
   - Must download manually
   - Not included in database backups

4. **Migrations vs Backups:**
   - Migrations = table structure + policies
   - Backups = your actual data

---

## 🆘 Emergency Recovery

### If You Lose Data

1. **Check Supabase Dashboard:**
   - Pro plan: Restore from automatic backup

2. **Use Your Manual Backup:**
   - Import CSV files
   - Run restore SQL

3. **Rebuild From Migrations:**
   - If data is lost but structure is ok
   - Re-run migrations from `supabase/migrations/`

---

## ✅ Summary

**Right Now:**
- No need to backup dummy data
- Keep your migration files (they recreate structure)
- Push code to GitHub

**When You Have Real Data:**
- Export tables weekly to CSV
- Download storage files monthly
- Keep backups in multiple locations
- Test restore process before you need it

**Golden Rule:**
> If you can't afford to lose it, back it up. Test your backups regularly.
