import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request) {
  let email = '';
  try {
    const body = await request.json().catch(() => ({}));
    const identifier = String(body.identifier || '').trim();
    const password = String(body.password || '');

    if (!url || !anonKey) {
      console.error({ stage: 'supabase-config-error', hasUrl: Boolean(url), hasAnonKey: Boolean(anonKey) });
      return NextResponse.json({
        success: false,
        stage: 'supabase-config',
        message: 'Authentication service is not configured.',
        details: 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
      }, { status: 500 });
    }

    if (!identifier || !password) {
      return NextResponse.json({
        success: false,
        stage: 'validation',
        message: 'Please enter both email/username and password.',
        details: 'Required input parameters are missing.'
      }, { status: 400 });
    }

    const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    email = identifier.toLowerCase();

    // Username mapping resolution
    if (!email.includes('@')) {
      if (identifier.toLowerCase() === 'chandru') {
        email = 'chandrunavalarch@gmail.com';
      } else {
        email = `${identifier.toLowerCase()}@auraworkspace.local`;
      }
      console.log("LOGIN USERNAME RESOLVED:", { identifier, email });
    }

    console.log("LOGIN ATTEMPT START:", { email });

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !authData.session || !authData.user) {
      console.warn("LOGIN SIGNIN FAILURE:", { email, error: authError?.message || 'Session not returned' });
      return NextResponse.json({
        success: false,
        stage: 'supabase-signin',
        message: authError?.message || 'Invalid email/username or password.',
        details: authError?.message || 'Authentication provider rejected the credentials.'
      }, { status: 401 });
    }

    // Rely entirely on user_metadata inside Supabase Auth user record
    const meta = authData.user.user_metadata || {};
    const profile = {
      id: authData.user.id,
      email: authData.user.email,
      first_name: meta.first_name || 'System',
      last_name: meta.last_name || 'User',
      username: meta.username || email.split('@')[0],
      role: meta.role || (email === 'chandrunavalarch@gmail.com' ? 'Super Admin' : 'Engineer'),
      status: meta.status || 'Approved',
      is_system_admin: meta.is_system_admin || (email === 'chandrunavalarch@gmail.com')
    };

    console.log("LOGIN PROFILE PREPARED:", { email, role: profile.role, status: profile.status });

    if (['Suspended', 'Disabled', 'Rejected'].includes(profile.status)) {
      return NextResponse.json({
        success: false,
        stage: 'profile-inactive',
        message: 'Your account is inactive.',
        details: `Profile status '${profile.status}' blocks entry.`
      }, { status: 403 });
    }
    if (profile.status === 'Pending') {
      return NextResponse.json({
        success: false,
        stage: 'profile-pending',
        message: 'Your registration request is awaiting approval.',
        details: 'Profile is in Pending verification state.'
      }, { status: 403 });
    }

    const response = NextResponse.json({
      success: true,
      user: profile,
      session: { expiresAt: new Date(authData.session.expires_at * 1000).toISOString() }
    });

    const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' };
    response.cookies.set('supabase_access_token', authData.session.access_token, { ...options, maxAge: authData.session.expires_in });
    response.cookies.set('supabase_refresh_token', authData.session.refresh_token, { ...options, maxAge: 60 * 60 * 24 * 30 });

    console.log("LOGIN COMPLETE SUCCESS:", { email });
    return response;
  } catch (error) {
    console.error("LOGIN CRITICAL EXCEPTION:", {
      email,
      message: error?.message,
      stack: error?.stack
    });
    return NextResponse.json({
      success: false,
      stage: 'login-exception',
      message: 'Authentication service unavailable.',
      details: error?.message || 'An unexpected server exception occurred.'
    }, { status: 500 });
  }
}
