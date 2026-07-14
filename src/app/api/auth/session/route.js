import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const accessToken = request.cookies.get('supabase_access_token')?.value;
  const refreshToken = request.cookies.get('supabase_refresh_token')?.value;
  if (!url || !key || (!accessToken && !refreshToken)) {
    return NextResponse.json({ success: true, authenticated: false, user: null });
  }

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    if (accessToken && refreshToken) await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ success: true, authenticated: false, user: null });

    const { data: profile, error: profileError } = await supabase
      .from('aura_users')
      .select('id, first_name, last_name, username, email, role, status, is_system_admin')
      .or(`id.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle();
    if (profileError || !profile) return NextResponse.json({ success: false, authenticated: false, error: 'User profile is missing.' }, { status: 404 });
    if (['Suspended', 'Disabled', 'Rejected', 'Pending'].includes(profile.status)) return NextResponse.json({ success: false, authenticated: false, error: 'Account is not active.' }, { status: 403 });
    return NextResponse.json({ success: true, authenticated: true, user: profile });
  } catch (error) {
    console.error({ stage: 'session-lookup', error: error?.message });
    return NextResponse.json({ success: false, authenticated: false, error: 'Authentication service unavailable.' }, { status: 500 });
  }
}
