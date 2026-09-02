import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseEnv } from './env';

const AUTH_REFRESH_TIMEOUT_MS = 2500;

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      ({ name }) =>
        name.startsWith('sb-') && /-auth-token(?:\.\d+)?$/.test(name),
    );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Anonymous visitors do not have a session to refresh. Avoid making every
  // public request depend on the availability of the external Auth service.
  if (!hasSupabaseAuthCookie(request)) return response;

  const { url, anonKey } = getSupabaseEnv();
  const supabase = createServerClient(url, anonKey, {
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: AbortSignal.timeout(AUTH_REFRESH_TIMEOUT_MS),
        }),
    },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch (error) {
    // Session refresh is best-effort here. Protected pages perform their own
    // server-side authorization and must remain the security boundary.
    console.warn('Supabase session refresh skipped:', error);
  }

  return response;
}
