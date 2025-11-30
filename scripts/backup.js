#!/usr/bin/env node

/**
 * AUTOMATED DATABASE BACKUP SCRIPT
 * 
 * This script automatically backs up your Supabase database by:
 * 1. Reading credentials from .env
 * 2. Exporting all table data to JSON files
 * 3. Creating timestamped backup directory
 * 4. Optionally downloading storage files
 * 
 * Usage: 
 *   npm run backup              (backup database only)
 *   npm run backup --storage    (backup database + storage files)
 * 
 * Schedule with cron:
 *   0 2 * * * cd /path/to/project && npm run backup
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validation
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Configuration
const TABLES = [
  'profiles',
  'user_roles',
  'products',
  'orders',
  'payment_methods',
  'hero_slides'
];

const BACKUP_DIR = join(__dirname, '..', 'backups');
const INCLUDE_STORAGE = process.argv.includes('--storage');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createBackup() {
  try {
    // Create timestamped backup directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(BACKUP_DIR, `backup_${timestamp}`);
    
    if (!existsSync(BACKUP_DIR)) {
      mkdirSync(BACKUP_DIR, { recursive: true });
    }
    mkdirSync(backupPath, { recursive: true });
    
    console.log('🗄️  Starting database backup...');
    console.log('📁 Backup location:', backupPath, '\n');
    
    // Backup each table
    const backupSummary = {
      timestamp: new Date().toISOString(),
      tables: {},
      storage: INCLUDE_STORAGE ? {} : null
    };
    
    for (const table of TABLES) {
      try {
        console.log(`⏳ Backing up ${table}...`);
        
        const { data, error } = await supabase
          .from(table)
          .select('*');
        
        if (error) {
          console.error(`   ❌ Error: ${error.message}`);
          backupSummary.tables[table] = { error: error.message, count: 0 };
          continue;
        }
        
        const filePath = join(backupPath, `${table}.json`);
        writeFileSync(filePath, JSON.stringify(data, null, 2));
        
        console.log(`   ✅ ${data.length} rows backed up`);
        backupSummary.tables[table] = { count: data.length, file: `${table}.json` };
        
      } catch (err) {
        console.error(`   ❌ Failed: ${err.message}`);
        backupSummary.tables[table] = { error: err.message, count: 0 };
      }
    }
    
    // Backup storage files if requested
    if (INCLUDE_STORAGE) {
      console.log('\n📦 Backing up storage files...');
      
      const buckets = ['product-images', 'hero-media'];
      
      for (const bucket of buckets) {
        try {
          const { data: files, error } = await supabase
            .storage
            .from(bucket)
            .list();
          
          if (error) {
            console.error(`   ❌ ${bucket}: ${error.message}`);
            backupSummary.storage[bucket] = { error: error.message, count: 0 };
            continue;
          }
          
          console.log(`   ℹ️  ${bucket}: ${files.length} files found`);
          console.log('   ⚠️  Note: Automatic file download not implemented');
          console.log('   💡 Download manually from Supabase Dashboard → Storage');
          
          // Save file list
          const listPath = join(backupPath, `${bucket}_files.json`);
          writeFileSync(listPath, JSON.stringify(files, null, 2));
          
          backupSummary.storage[bucket] = { 
            count: files.length, 
            file: `${bucket}_files.json`,
            note: 'File list only - download files manually'
          };
          
        } catch (err) {
          console.error(`   ❌ ${bucket}: ${err.message}`);
          backupSummary.storage[bucket] = { error: err.message, count: 0 };
        }
      }
    }
    
    // Save backup summary
    const summaryPath = join(backupPath, 'backup_summary.json');
    writeFileSync(summaryPath, JSON.stringify(backupSummary, null, 2));
    
    console.log('\n✅ Backup complete!');
    console.log('📋 Summary:');
    console.log(`   Location: ${backupPath}`);
    console.log(`   Tables: ${Object.keys(backupSummary.tables).length}`);
    console.log(`   Total rows: ${Object.values(backupSummary.tables).reduce((sum, t) => sum + (t.count || 0), 0)}`);
    
    if (INCLUDE_STORAGE) {
      console.log(`   Storage buckets: ${Object.keys(backupSummary.storage).length}`);
    }
    
    console.log('\n💡 Tip: Store backups in external location (Google Drive, Dropbox, etc.)');
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

// Run backup
createBackup();
