import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  for (const name of ['aura_token', 'supabase_access_token', 'supabase_refresh_token']) response.cookies.set(name, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });
  return response;
}
