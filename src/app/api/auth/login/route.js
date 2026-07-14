import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request) {
  const body = await request.json();
  const identifier = String(body.identifier || '').trim();
  const password = String(body.password || '');

  if (!url || !anonKey) {
    console.error({ stage: 'supabase-config', hasUrl: Boolean(url), hasAnonKey: Boolean(anonKey) });
    return NextResponse.json({ error: 'Authentication service is not configured.' }, { status: 500 });
  }
  if (!identifier || !password) {
    return NextResponse.json({ error: 'Please enter both email/username and password.' }, { status: 400 });
  }

  const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let email = identifier.toLowerCase();

  try {
    if (!email.includes('@')) {
      const { data: profile, error } = await supabase
        .from('aura_users')
        .select('email')
        .eq('username', identifier)
        .maybeSingle();
      console.error({ stage: 'username-resolution', username: identifier, found: Boolean(profile), error: error?.message });
      if (error) return NextResponse.json({ error: 'Unable to resolve username.' }, { status: 500 });
      if (!profile?.email) return NextResponse.json({ error: 'Invalid email/username or password.' }, { status: 401 });
      email = String(profile.email).toLowerCase();
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    console.error({ stage: 'supabase-login', email, success: Boolean(authData?.session), error: authError?.message });
    if (authError || !authData.session || !authData.user) {
      return NextResponse.json({ error: 'Invalid email/username or password.' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('aura_users')
      .select('id, first_name, last_name, username, email, role, status, is_system_admin')
      .or(`id.eq.${authData.user.id},email.eq.${email}`)
      .maybeSingle();
    console.error({ stage: 'profile-lookup', email, found: Boolean(profile), role: profile?.role, status: profile?.status, error: profileError?.message });

    if (profileError) return NextResponse.json({ error: 'Unable to load your user profile.' }, { status: 500 });
    if (!profile) return NextResponse.json({ error: 'User profile is missing.' }, { status: 404 });
    if (['Suspended', 'Disabled', 'Rejected'].includes(profile.status)) {
      return NextResponse.json({ error: 'Your account is inactive.' }, { status: 403 });
    }
    if (profile.status === 'Pending') {
      return NextResponse.json({ error: 'Your registration request is awaiting approval.' }, { status: 403 });
    }

    const response = NextResponse.json({
      success: true,
      user: profile,
      session: { expiresAt: new Date(authData.session.expires_at * 1000).toISOString() }
    });
    const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' };
    response.cookies.set('supabase_access_token', authData.session.access_token, { ...options, maxAge: authData.session.expires_in });
    response.cookies.set('supabase_refresh_token', authData.session.refresh_token, { ...options, maxAge: 60 * 60 * 24 * 30 });
    return response;
  } catch (error) {
    console.error({ stage: 'login-exception', email, error: error?.message });
    return NextResponse.json({ error: 'Authentication service unavailable.' }, { status: 500 });
  }
}
