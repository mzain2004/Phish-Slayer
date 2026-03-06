import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  console.log('🚨 [Auth Callback] Route hit! URL:', request.url);

  if (code) {
    console.log('⏳ [Auth Callback] Authorization code found. Exchanging for session...');
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('❌ [Auth Callback] Supabase Error:', error.message);
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin));
      }

      console.log('✅ [Auth Callback] Session established for:', data.user?.email);
      console.log('🚀 [Auth Callback] Redirecting to:', next);
      
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    } catch (err) {
      console.error('💥 [Auth Callback] Server Crash:', err);
      return NextResponse.redirect(new URL('/login?error=ServerCrash', requestUrl.origin));
    }
  }

  console.warn('⚠️ [Auth Callback] No code found in URL.');
  return NextResponse.redirect(new URL('/login?error=NoCode', requestUrl.origin));
}