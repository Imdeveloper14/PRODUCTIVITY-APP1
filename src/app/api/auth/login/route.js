import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;
const JWT_SECRET = process.env.JWT_SECRET || 'aura_secret_key_123456_change_me';
import { seedDatabase } from '../../../utils/seeder';
import { getLocalDb, saveLocalDb, isSupabaseTableAvailable } from '../../../utils/dbFallback';
export async function POST(request) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Supabase connection is not configured." }, { status: 500 });
    }

    // Run startup seeder dynamically
    await seedDatabase();

    const body = await request.json();
    const { identifier, password } = body; // identifier is email or username

    if (!identifier || !password) {
      return NextResponse.json({ error: "Please enter both credentials and password." }, { status: 400 });
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();

    // Check if Supabase aura_users table is available
    const useSupabase = await isSupabaseTableAvailable('aura_users');
    let user = null;

    if (useSupabase) {
      const { data: dbUser, error: findError } = await supabase
        .from('aura_users')
        .select('*')
        .or(`email.eq.${normalizedIdentifier},username.eq.${identifier.trim()}`)
        .maybeSingle();

      if (findError) {
        console.warn("Supabase login search failed, falling back to local DB:", findError);
        const localDb = getLocalDb();
        user = localDb.users.find(u => u.email.toLowerCase() === normalizedIdentifier || u.username === identifier.trim());
      } else {
        user = dbUser;
      }
    } else {
      // Local db fallback
      const localDb = getLocalDb();
      user = localDb.users.find(u => u.email.toLowerCase() === normalizedIdentifier || u.username === identifier.trim());
    }

    if (!user) {
      if (useSupabase) {
        await supabase.from('aura_audit_logs').insert({
          event_type: 'login_attempt_failed_incorrect',
          email: normalizedIdentifier.includes('@') ? normalizedIdentifier : 'unknown',
          username: !normalizedIdentifier.includes('@') ? identifier.trim() : 'unknown',
          actor: 'system',
          details: `Login attempt failed: user not found.`
        });
      } else {
        const localDb = getLocalDb();
        localDb.audit_logs.push({
          id: `log-${Date.now()}`,
          event_type: 'login_attempt_failed_incorrect',
          email: normalizedIdentifier.includes('@') ? normalizedIdentifier : 'unknown',
          username: !normalizedIdentifier.includes('@') ? identifier.trim() : 'unknown',
          actor: 'system',
          details: `Login attempt failed: user not found.`,
          created_at: new Date().toISOString()
        });
        saveLocalDb(localDb);
      }
      return NextResponse.json({ error: "Invalid email/username or password." }, { status: 401 });
    }

    // Check account status and apply requested user messages
    if (user.status === 'Pending') {
      const details = `Login block: account status is Pending.`;
      const errorMsg = "Your registration request is awaiting administrator approval.";
      
      if (useSupabase) {
        await supabase.from('aura_audit_logs').insert({
          event_type: 'login_attempt_failed_pending',
          email: user.email,
          username: user.username,
          actor: 'system',
          details
        });
      } else {
        const localDb = getLocalDb();
        localDb.audit_logs.push({
          id: `log-${Date.now()}`,
          event_type: 'login_attempt_failed_pending',
          email: user.email,
          username: user.username,
          actor: 'system',
          details,
          created_at: new Date().toISOString()
        });
        saveLocalDb(localDb);
      }
      return NextResponse.json({ error: errorMsg, status: 'Pending' }, { status: 403 });
    }

    if (user.status === 'Rejected') {
      const details = `Login block: account status is Rejected.`;
      const errorMsg = "Your registration request has been rejected. Please contact your administrator.";
      
      if (useSupabase) {
        await supabase.from('aura_audit_logs').insert({
          event_type: 'login_attempt_failed_rejected',
          email: user.email,
          username: user.username,
          actor: 'system',
          details
        });
      } else {
        const localDb = getLocalDb();
        localDb.audit_logs.push({
          id: `log-${Date.now()}`,
          event_type: 'login_attempt_failed_rejected',
          email: user.email,
          username: user.username,
          actor: 'system',
          details,
          created_at: new Date().toISOString()
        });
        saveLocalDb(localDb);
      }
      return NextResponse.json({ error: errorMsg, status: 'Rejected' }, { status: 403 });
    }

    if (user.status === 'Disabled') {
      const details = `Login block: account status is Disabled.`;
      const errorMsg = "Your account has been disabled.";
      
      if (useSupabase) {
        await supabase.from('aura_audit_logs').insert({
          event_type: 'login_attempt_failed_disabled',
          email: user.email,
          username: user.username,
          actor: 'system',
          details
        });
      } else {
        const localDb = getLocalDb();
        localDb.audit_logs.push({
          id: `log-${Date.now()}`,
          event_type: 'login_attempt_failed_disabled',
          email: user.email,
          username: user.username,
          actor: 'system',
          details,
          created_at: new Date().toISOString()
        });
        saveLocalDb(localDb);
      }
      return NextResponse.json({ error: errorMsg, status: 'Disabled' }, { status: 403 });
    }

    // Verify Password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      const details = `Login attempt failed: incorrect password.`;
      if (useSupabase) {
        await supabase.from('aura_audit_logs').insert({
          event_type: 'login_attempt_failed_incorrect',
          email: user.email,
          username: user.username,
          actor: 'system',
          details
        });
      } else {
        const localDb = getLocalDb();
        localDb.audit_logs.push({
          id: `log-${Date.now()}`,
          event_type: 'login_attempt_failed_incorrect',
          email: user.email,
          username: user.username,
          actor: 'system',
          details,
          created_at: new Date().toISOString()
        });
        saveLocalDb(localDb);
      }
      return NextResponse.json({ error: "Invalid email/username or password." }, { status: 401 });
    }

    // Generate JWT
    const tokenPayload = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    // Save success audit log
    const details = `Successful login. Role: ${user.role}.`;
    if (useSupabase) {
      await supabase.from('aura_audit_logs').insert({
        event_type: 'login_attempt_success',
        email: user.email,
        username: user.username,
        actor: user.username,
        details
      });
    } else {
      const localDb = getLocalDb();
      localDb.audit_logs.push({
        id: `log-${Date.now()}`,
        event_type: 'login_attempt_success',
        email: user.email,
        username: user.username,
        actor: user.username,
        details,
        created_at: new Date().toISOString()
      });
      saveLocalDb(localDb);
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
      },
      token
    });

    // Set secure cookie
    response.cookies.set('aura_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return response;

  } catch (error) {
    console.error("Unhandled login error details:", error);
    return NextResponse.json({ error: "An unexpected error occurred during login. Please try again later." }, { status: 500 });
  }
}
