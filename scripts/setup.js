#!/usr/bin/env node

/**
 * AUTOMATED DATABASE SETUP SCRIPT
 * 
 * This script verifies credentials and provides setup instructions.
 * Direct SQL execution requires either:
 * - Supabase CLI (recommended): supabase db push
 * - SQL Editor (manual): Copy/paste migration file
 * 
 * Usage: npm run setup
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_ID = process.env.VITE_SUPABASE_PROJECT_ID;

// Validation
if (!SUPABASE_URL || !SERVICE_KEY || !PROJECT_ID) {
  console.error('❌ Missing Supabase credentials in .env file\n');
  console.error('Required variables:');
  console.error('  VITE_SUPABASE_URL');
  console.error('  VITE_SUPABASE_PROJECT_ID');
  console.error('  SUPABASE_SERVICE_ROLE_KEY\n');
  console.error('💡 Find these in: Supabase Dashboard → Project Settings → API\n');
  process.exit(1);
}

console.log('🚀 Starting database setup...\n');

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSetup() {
  try {
    // Test connection
    console.log('🔍 Testing connection...');
    const { data: health, error: healthError } = await supabase
      .from('_migrations')
      .select('*')
      .limit(1);
    
    if (healthError && healthError.code !== '42P01') { // 42P01 = table doesn't exist (expected for new DB)
      console.error('❌ Connection failed:', healthError.message);
      process.exit(1);
    }
    
    console.log('✅ Connection successful\n');
    
    // Read migration file
    const migrationPath = join(__dirname, '..', 'SINGLE_INIT.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded (432 lines)\n');
    console.log('⚠️  LIMITATION: Direct SQL execution requires Supabase CLI or Management API\n');
    console.log('📋 Choose ONE method:\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('METHOD 1: Supabase CLI (Recommended - 100% automated)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('1. Install CLI:');
    console.log('   npm install -g supabase\n');
    console.log('2. Login:');
    console.log('   supabase login\n');
    console.log('3. Link project:');
    console.log(`   supabase link --project-ref ${PROJECT_ID}\n`);
    console.log('4. Push migration:');
    console.log('   supabase db push\n');
    console.log('✅ Done! Database is ready.\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('METHOD 2: SQL Editor (Manual - 2 minutes)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('1. Open: Supabase Dashboard → SQL Editor');
    console.log('2. Copy content from: SINGLE_INIT.sql');
    console.log('3. Paste and click "Run"');
    console.log('✅ Done! Database is ready.\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📌 After setup:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('1. Sign up in your app');
    console.log('2. Run this SQL to make yourself admin:\n');
    console.log('   SELECT id, email FROM auth.users;');
    console.log('   INSERT INTO user_roles (user_id, role)');
    console.log('   VALUES (\'YOUR_USER_ID\', \'admin\');\n');
    console.log('3. Start building! 🎉\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

runSetup();
