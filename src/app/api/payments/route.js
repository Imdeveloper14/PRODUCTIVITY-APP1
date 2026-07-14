import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hasPermission } from '../../utils/permissions';
import { verifySessionToken } from '../../utils/session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

function verifyToken(request) {
  try {
    let token = request.cookies.get('aura_token')?.value;
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    if (!token) return null;
    return verifySessionToken(token);
  } catch (err) {
    return null;
  }
}

async function logViolation(user, details) {
  if (supabase && user) {
    await supabase.from('aura_audit_logs').insert({
      event_type: 'unauthorized_api_violation',
      email: user.email || '',
      username: user.username || 'unknown',
      actor: user.username || 'unknown',
      details: details
    });
  }
}

export async function GET(request) {
  const user = verifyToken(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = user.role || 'Employee';
  if (!hasPermission(role, 'canViewRevenue')) {
    await logViolation(user, `Attempted unauthorized GET access to Payments API as role ${role}`);
    return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  if (!supabase) {
    return NextResponse.json({ error: "Supabase connection is not configured." }, { status: 500 });
  }

  // Fetch payments from invoices or separate payments table
  const { data, error } = await supabase.from('invoices').select('id, invoice_number, grand_total, payment_status, due_date').order('due_date', { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
