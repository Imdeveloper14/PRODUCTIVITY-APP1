import fs from 'fs';
import path from 'path';
import { supabase } from './supabase';

const DB_FILE = path.join(process.cwd(), 'db.json');
const IS_VERCEL_RUNTIME = process.env.VERCEL === '1';

function ensureDbFile() {
  // Vercel's deployment filesystem is read-only. Local JSON persistence is
  // only a development fallback; production data must live in Supabase.
  if (IS_VERCEL_RUNTIME) return;
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
  if (IS_VERCEL_RUNTIME) {
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
  if (IS_VERCEL_RUNTIME) return;
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
