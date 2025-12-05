# Database Setup & Migration Guide

## 📋 Overview
This guide explains all database scripts and when to use each one.

---

## 🆕 For Fresh Database Setup

### Use: `SINGLE_INIT.sql`
**When**: Creating a brand new database from scratch

**What it includes**:
- ✅ All tables (profiles, products, orders, etc.)
- ✅ Email column in profiles table
- ✅ Boutique features (SKU, fabric, sizes, colors)
- ✅ Optimized RLS policies (no performance warnings)
- ✅ All functions and triggers
- ✅ Storage buckets and policies
- ✅ Indexes for performance
- ✅ Default payment method

**How to use**:
1. Go to Supabase Dashboard → SQL Editor
2. Copy entire content of `SINGLE_INIT.sql`
3. Run it once
4. Done! Your database is ready

---

## 🔄 For Existing Database Updates

### 1. `MIGRATION_BOUTIQUE_FEATURES.sql`
**Purpose**: Add boutique product features to existing database

**Adds**:
- `sku` column with auto-generation
- `fabric_type` column
- `available_sizes` (JSONB array)
- `available_colors` (JSONB array)
- `care_instructions` column
- `occasion_type` column
- `embellishment` column

**Critical**: Handles `stock` → `stock_quantity` column rename

**Run if**: You have an existing database without boutique features

---

### 2. `ADD_EMAIL_TO_PROFILES.sql`
**Purpose**: Add email column to profiles table

**Adds**:
- `email` column to profiles
- Trigger to sync email from auth.users
- Backfills existing users' emails

**Run if**: User Management page shows placeholder emails

---

### 3. `FIX_RLS_PERFORMANCE.sql`
**Purpose**: Optimize Row Level Security policies for better performance

**Fixes**: All 17 RLS policies by wrapping `auth.uid()` in SELECT statements

**Run if**: You see performance warnings in Supabase dashboard

---

## 📊 Migration Scripts Summary

| Script | Purpose | Required For | Safe to Re-run |
|--------|---------|--------------|----------------|
| `SINGLE_INIT.sql` | Fresh database setup | New projects | ❌ No (drops all data) |
| `MIGRATION_BOUTIQUE_FEATURES.sql` | Add boutique features | Existing DB | ✅ Yes (uses IF NOT EXISTS) |
| `ADD_EMAIL_TO_PROFILES.sql` | Add email to profiles | Existing DB | ✅ Yes (uses IF NOT EXISTS) |
| `FIX_RLS_PERFORMANCE.sql` | Optimize RLS policies | Existing DB | ✅ Yes (uses DROP/CREATE) |

---

## 🎯 Quick Decision Guide

### Scenario 1: Starting Fresh
```
Run: SINGLE_INIT.sql
```
That's it! Everything is included.

### Scenario 2: Existing Database (Pre-Boutique Features)
```
1. Run: MIGRATION_BOUTIQUE_FEATURES.sql
2. Run: ADD_EMAIL_TO_PROFILES.sql
3. Run: FIX_RLS_PERFORMANCE.sql
```

### Scenario 3: Only Performance Warnings
```
Run: FIX_RLS_PERFORMANCE.sql
```

### Scenario 4: Only Missing Emails
```
Run: ADD_EMAIL_TO_PROFILES.sql
```

---

## ✅ What's Already in SINGLE_INIT.sql

The `SINGLE_INIT.sql` file now includes **ALL** improvements:

1. ✅ **Email in Profiles** - No placeholder emails
2. ✅ **Boutique Features** - SKU, fabric, sizes, colors, etc.
3. ✅ **Optimized RLS Policies** - No performance warnings
4. ✅ **All Tables** - Complete schema
5. ✅ **Security** - Proper RLS and policies
6. ✅ **Performance** - Indexes and optimizations

---

## 🔍 How to Check What You Need

### Check 1: Do you have boutique columns?
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('sku', 'fabric_type', 'available_sizes');
```
If empty → Run `MIGRATION_BOUTIQUE_FEATURES.sql`

### Check 2: Do you have email in profiles?
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'email';
```
If empty → Run `ADD_EMAIL_TO_PROFILES.sql`

### Check 3: Do you have performance warnings?
Check Supabase Dashboard → Database → Advisors
If warnings → Run `FIX_RLS_PERFORMANCE.sql`

---

## 📝 Notes

- **Migration scripts are safe to re-run** - They use `IF NOT EXISTS` and `DROP IF EXISTS`
- **SINGLE_INIT.sql is NOT safe to re-run** - It will drop all your data
- **Always backup before running migrations** - Use Supabase backup feature
- **Test in development first** - Never run untested SQL in production

---

## 🚀 Recommended Workflow

### For Production:
1. Backup your database
2. Test migration in development/staging
3. Run migration in production
4. Verify everything works
5. Monitor for issues

### For Development:
1. Just run the migration
2. Test your app
3. If issues, restore backup and try again

---

## 📞 Need Help?

If you encounter issues:
1. Check Supabase logs
2. Verify all prerequisites are met
3. Ensure you're running scripts in correct order
4. Check for typos in column names
5. Verify RLS policies are enabled

---

**Last Updated**: 2025-12-05
**Version**: 1.0 (Includes all optimizations)
