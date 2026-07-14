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
  if (!hasPermission(role, 'canViewInvoices')) {
    await logViolation(user, `Attempted unauthorized GET access to Invoices API as role ${role}`);
    return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  if (!supabase) {
    return NextResponse.json({ error: "Supabase connection is not configured." }, { status: 500 });
  }

  const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request) {
  const user = verifyToken(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = user.role || 'Employee';
  if (!hasPermission(role, 'canManageInvoices')) {
    await logViolation(user, `Attempted unauthorized POST creation of Invoice as role ${role}`);
    return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  if (!supabase) {
    return NextResponse.json({ error: "Supabase connection is not configured." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { data, error } = await supabase.from('invoices').insert(body).select().single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
