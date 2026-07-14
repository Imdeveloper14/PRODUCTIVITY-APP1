import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { getLocalDb, saveLocalDb, isSupabaseTableAvailable } from './dbFallback';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const PERMANENT_ADMIN_EMAIL = (process.env.AURA_ADMIN_EMAIL || 'chandrunavalarch@gmail.com').trim().toLowerCase();
export const PERMANENT_ADMIN_USERNAME = (process.env.AURA_ADMIN_USERNAME || 'chandru').trim();
export const DEFAULT_ADMIN_PASSWORD = process.env.AURA_ADMIN_PASSWORD || '';

export const DEFAULT_SYSTEM_ROLES = [
  'Super Admin',
  'Admin',
  'Project Manager',
  'Engineer',
  'Finance',
  'Viewer'
];

export function normalizeRole(role) {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'superadmin' || value === 'super admin') return 'Super Admin';
  if (value === 'project manager' || value === 'projectmanager' || value === 'manager') return 'Project Manager';
  if (value === 'engineer') return 'Engineer';
  if (value === 'finance') return 'Finance';
  if (value === 'viewer') return 'Viewer';
  if (value === 'admin') return 'Admin';
  return 'Viewer';
}

export function normalizeStatus(status) {
  const value = String(status || '').trim().toLowerCase();
  if (value === 'approved' || value === 'active') return 'Approved';
  if (value === 'pending') return 'Pending';
  if (value === 'rejected') return 'Rejected';
  if (value === 'suspended' || value === 'disabled') return 'Suspended';
  return 'Pending';
}

function makeAdminRecord(passwordHash) {
  const now = new Date().toISOString();
  return {
    id: 'u-admin-permanent',
    first_name: 'Permanent',
    last_name: 'Administrator',
    username: PERMANENT_ADMIN_USERNAME,
    email: PERMANENT_ADMIN_EMAIL,
    password_hash: passwordHash,
    status: 'Approved',
    role: 'Super Admin',
    mobile_number: '',
    department: 'Administration',
    designation: 'System Administrator',
    employee_id: 'ADMIN-0001',
    reporting_manager: '',
    is_system_admin: true,
    created_at: now,
    updated_at: now
  };
}

export async function ensurePermanentAdmin() {
  if (!DEFAULT_ADMIN_PASSWORD) {
    return {
      ok: false,
      error: 'AURA_ADMIN_PASSWORD is missing'
    };
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

  const localDb = getLocalDb();
  if (!localDb.roles) localDb.roles = DEFAULT_SYSTEM_ROLES;
  if (!localDb.users) localDb.users = [];

  const localExisting = localDb.users.find(u =>
    String(u.email || '').toLowerCase() === PERMANENT_ADMIN_EMAIL ||
    String(u.username || '').toLowerCase() === PERMANENT_ADMIN_USERNAME.toLowerCase() ||
    u.is_system_admin
  );

  if (!localExisting) {
    localDb.users.push(makeAdminRecord(passwordHash));
    saveLocalDb(localDb);
  } else {
    localExisting.email = PERMANENT_ADMIN_EMAIL;
    localExisting.username = PERMANENT_ADMIN_USERNAME;
    localExisting.first_name = localExisting.first_name || 'Permanent';
    localExisting.last_name = localExisting.last_name || 'Administrator';
    localExisting.role = 'Super Admin';
    localExisting.status = 'Approved';
    localExisting.is_system_admin = true;
    localExisting.password_hash = localExisting.password_hash || passwordHash;
    localExisting.updated_at = new Date().toISOString();
    saveLocalDb(localDb);
  }

  if (supabase && await isSupabaseTableAvailable('aura_users')) {
    const { data: existing, error: findError } = await supabase
      .from('aura_users')
      .select('id, email, username, is_system_admin')
      .or(`email.eq.${PERMANENT_ADMIN_EMAIL},username.eq.${PERMANENT_ADMIN_USERNAME},is_system_admin.eq.true`)
      .maybeSingle();

    if (findError && findError.code !== 'PGRST116') {
      return {
        ok: false,
        error: findError.message || 'Unable to inspect admin record'
      };
    }

    if (!existing) {
      const { error: insertError } = await supabase.from('aura_users').insert(makeAdminRecord(passwordHash));
      if (insertError) {
        return {
          ok: false,
          error: insertError.message || 'Unable to seed permanent admin'
        };
      }
    } else {
      const { error: updateError } = await supabase
        .from('aura_users')
        .update({
          email: PERMANENT_ADMIN_EMAIL,
          username: PERMANENT_ADMIN_USERNAME,
          first_name: 'Permanent',
          last_name: 'Administrator',
          role: 'Super Admin',
          status: 'Approved',
          is_system_admin: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) {
        return {
          ok: false,
          error: updateError.message || 'Unable to refresh permanent admin'
        };
      }
    }
  }

  return { ok: true };
}

export async function runBootstrap() {
  const adminResult = await ensurePermanentAdmin();
  return {
    ok: adminResult.ok,
    admin: adminResult,
    roles: DEFAULT_SYSTEM_ROLES
  };
}

export async function getBootstrapDiagnostics() {
  const env = {
    supabaseUrl: Boolean(supabaseUrl),
    supabaseAnonKey: Boolean(supabaseAnonKey),
    adminEmail: Boolean(PERMANENT_ADMIN_EMAIL),
    adminUsername: Boolean(PERMANENT_ADMIN_USERNAME),
    adminPassword: Boolean(DEFAULT_ADMIN_PASSWORD)
  };

  let db = { local: false, supabase: false };
  let storage = { available: false };
  let auth = { initialized: Boolean(supabase) };
  let admin = { exists: false };

  try {
    const localDb = getLocalDb();
    db.local = !!localDb.users;
    admin.exists = !!localDb.users?.find(u =>
      String(u.email || '').toLowerCase() === PERMANENT_ADMIN_EMAIL ||
      String(u.username || '').toLowerCase() === PERMANENT_ADMIN_USERNAME.toLowerCase() ||
      u.is_system_admin
    );
  } catch {}

  if (supabase) {
    try {
      const { error } = await supabase.from('aura_users').select('id').limit(1);
      db.supabase = !error;
    } catch {}

    try {
      const { data } = await supabase.storage.listBuckets();
      storage.available = Array.isArray(data);
    } catch {}
  }

  return {
    env,
    auth,
    db,
    storage,
    admin,
    roles: DEFAULT_SYSTEM_ROLES
  };
}
