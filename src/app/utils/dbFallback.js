import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

const DB_FILE = path.join(process.cwd(), 'db.json');

function ensureDbFile() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      users: [],
      audit_logs: [],
      notifications: [],
      quotations: [],
      quotation_items: [],
      quotation_costings: [],
      quotation_revisions: []
    }, null, 2));
  } else {
    // Merge missing keys dynamically
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      let modified = false;
      const defaults = {
        users: [],
        audit_logs: [],
        notifications: [],
        quotations: [],
        quotation_items: [],
        quotation_costings: [],
        quotation_revisions: []
      };
      for (const key in defaults) {
        if (!data[key]) {
          data[key] = defaults[key];
          modified = true;
        }
      }
      if (modified) {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
      }
    } catch (e) {
      // Ignore
    }
  }
}

export function getLocalDb() {
  ensureDbFile();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return {
      users: [],
      audit_logs: [],
      notifications: [],
      quotations: [],
      quotation_items: [],
      quotation_costings: [],
      quotation_revisions: []
    };
  }
}

export function saveLocalDb(data) {
  ensureDbFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Check if a table is available in Supabase
export async function isSupabaseTableAvailable(tableName) {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from(tableName).select('id').limit(1);
    if (error) {
      console.warn(`Supabase table check failed for ${tableName}:`, error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn(`Supabase table check threw for ${tableName}:`, e);
    return false;
  }
}
