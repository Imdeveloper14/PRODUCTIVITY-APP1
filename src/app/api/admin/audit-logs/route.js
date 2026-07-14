import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getLocalDb, saveLocalDb, isSupabaseTableAvailable } from '../../../utils/dbFallback';
import { verifySessionToken } from '../../../utils/session';
import { PERMANENT_ADMIN_EMAIL } from '../../../utils/authBootstrap';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

import { hasPermission } from '../../../utils/permissions';

// Helper to authenticate admin
function verifyAdmin(request) {
  try {
    let token = request.cookies.get('aura_token')?.value;

    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) return null;

    const decoded = verifySessionToken(token);
    const role = decoded.role || 'Employee';
    const email = decoded.email || '';
    
    if (hasPermission(role, 'canViewAuditLogs') || String(email).toLowerCase() === PERMANENT_ADMIN_EMAIL || role === 'Super Admin' || role === 'Admin' || role === 'SuperAdmin') {
      return decoded;
    }
    
    // Log unauthorized attempt if role lacks permission
    if (supabase) {
      isSupabaseTableAvailable('aura_audit_logs').then(useSup => {
        if (useSup) {
          supabase.from('aura_audit_logs').insert({
            event_type: 'unauthorized_access_attempt',
            email: email,
            username: decoded.username || 'unknown',
            actor: decoded.username || 'unknown',
            details: `Unauthorized attempt to access Admin Audit Logs API by role ${role}`
          }).then(({ error }) => { if (error) console.error("Error logging violation:", error); });
        } else {
          const localDb = getLocalDb();
          localDb.audit_logs.push({
            id: `log-${Date.now()}`,
            event_type: 'unauthorized_access_attempt',
            email: email,
            username: decoded.username || 'unknown',
            actor: decoded.username || 'unknown',
            details: `Unauthorized attempt to access Admin Audit Logs API by role ${role}`,
            created_at: new Date().toISOString()
          });
          saveLocalDb(localDb);
        }
      });
    }
    
    return null;
  } catch (err) {
    console.error("JWT verification failed:", err);
    return null;
  }
}

export async function GET(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access. Admin privileges required." }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Supabase connection is not configured." }, { status: 500 });
    }

    const useSupabase = await isSupabaseTableAvailable('aura_audit_logs');
    let logs = [];

    if (useSupabase) {
      const { data, error } = await supabase
        .from('aura_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.error("Error retrieving audit logs from database:", error);
        return NextResponse.json({ error: "Unable to retrieve audit log records at this time. Please try again later." }, { status: 500 });
      }
      logs = data;
    } else {
      const localDb = getLocalDb();
      // Sort logs by created_at descending
      logs = [...localDb.audit_logs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 200);
    }

    return NextResponse.json({ success: true, logs });
  } catch (err) {
    console.error("Error in admin audit-logs GET:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
