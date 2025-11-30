# 🛠️ Automated Setup & Backup Scripts

This folder contains automated scripts for database setup and backups.

## 📋 Available Scripts

### 1. Setup Script (`setup.js`)
Guides you through database setup process.

**Usage:**
```bash
npm run setup
```

**What it does:**
- Validates .env credentials
- Tests Supabase connection
- Provides step-by-step migration instructions
- Verifies setup completion

---

### 2. Backup Script (`backup.js`)
Automatically backs up database tables to JSON files.

**Usage:**
```bash
# Backup database tables only
npm run backup

# Backup database + storage file lists
npm run backup --storage
```

**What it does:**
- Creates timestamped backup folder in `backups/`
- Exports all tables to JSON files
- Generates backup summary with stats
- Lists storage bucket files (if --storage flag used)

**Output Structure:**
```
backups/
└── backup_2025-01-15T10-30-00-000Z/
    ├── profiles.json
    ├── products.json
    ├── orders.json
    ├── payment_methods.json
    ├── hero_slides.json
    ├── user_roles.json
    ├── product-images_files.json
    ├── hero-media_files.json
    └── backup_summary.json
```

---

## 🔄 Schedule Automated Backups

### Linux/Mac (Cron)
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/project && npm run backup

# Add daily backup with storage at 3 AM
0 3 * * * cd /path/to/project && npm run backup --storage
```

### Windows (Task Scheduler)
1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily at 2:00 AM
4. Action: Start a program
5. Program: `node`
6. Arguments: `C:\path\to\project\scripts\backup.js`
7. Start in: `C:\path\to\project`

---

## 📝 Manual npm Scripts Setup

If `npm run setup` and `npm run backup` don't work, add these to `package.json`:

```json
"scripts": {
  "setup": "node scripts/setup.js",
  "backup": "node scripts/backup.js"
}
```

---

## ⚡ Quick Start

1. **First Time Setup:**
   ```bash
   # Update .env with Supabase credentials
   npm run setup
   # Follow instructions to run migration
   ```

2. **Regular Backups:**
   ```bash
   # Run backup whenever you make changes
   npm run backup
   
   # Store backups externally (Google Drive, Dropbox, etc.)
   ```

3. **Production Setup:**
   ```bash
   # Schedule daily automated backups (see above)
   # Keep backups for at least 30 days
   ```

---

## 🔐 Security Notes

- **Never commit backups** to Git (already in .gitignore)
- Store backups in secure external location
- Backups contain sensitive data - keep them private
- .env file is required but never committed

---

## 🆘 Troubleshooting

**Error: "Missing Supabase credentials"**
- Check `.env` file exists and has correct keys
- Required: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

**Error: "Cannot find module 'dotenv'"**
- Run: `npm install dotenv`

**Backup fails with "permission denied"**
- Ensure `backups/` folder is writable
- Run: `mkdir -p backups && chmod 755 backups`

**Setup script says "connection failed"**
- Verify Supabase credentials are correct
- Check internet connection
- Ensure Supabase project is not paused

---

For detailed setup instructions, see `SETUP-GUIDE.md` in project root.
