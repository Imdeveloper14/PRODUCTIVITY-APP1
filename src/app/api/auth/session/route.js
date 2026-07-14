import { NextResponse } from 'next/server';
import { getLocalDb, isSupabaseTableAvailable, supabase } from '../../../utils/dbFallback';
import { runBootstrap, PERMANENT_ADMIN_EMAIL } from '../../../utils/authBootstrap';
import { verifySessionToken } from '../../../utils/session';

export async function GET(request) {
  try {
    await runBootstrap();

    let token = request.cookies.get('aura_token')?.value;
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ success: true, authenticated: false, user: null });
    }

    let decoded;
    try {
      decoded = verifySessionToken(token);
    } catch (error) {
      return NextResponse.json({ success: true, authenticated: false, user: null, error: 'Session expired or invalid.' });
    }

    const useSupabase = await isSupabaseTableAvailable('aura_users');
    let user = null;

    if (useSupabase) {
      const { data, error } = await supabase
        .from('aura_users')
        .select('id, first_name, last_name, username, email, role, status, is_system_admin')
        .eq('id', decoded.id)
        .maybeSingle();

      if (!error) {
        user = data;
      }
    }

    if (!user) {
      const localDb = getLocalDb();
      user = localDb.users.find(u => u.id === decoded.id || String(u.email || '').toLowerCase() === String(decoded.email || '').toLowerCase());
    }

    if (!user) {
      return NextResponse.json({ success: true, authenticated: false, user: null });
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        is_system_admin: user.is_system_admin || String(user.email || '').toLowerCase() === PERMANENT_ADMIN_EMAIL
      },
      session: {
        valid: true,
        expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      authenticated: false,
      error: 'Authentication service unavailable.'
    }, { status: 500 });
  }
}
