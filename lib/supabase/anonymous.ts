import { createClient } from './client';

const ANONYMOUS_USER_ID_KEY = 'anonymous_user_id';
let sessionPromise: Promise<string> | null = null;

async function createOrRestoreAnonymousSession() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user.id) {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user?.id) {
      window.localStorage.setItem(ANONYMOUS_USER_ID_KEY, data.user.id);
      return data.user.id;
    }

    // 모바일 인앱 브라우저에 만료된 세션이 남아 있으면 새 익명 세션으로 복구한다.
    await supabase.auth.signOut({ scope: 'local' });
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) throw error;
  if (!data.session?.user.id) throw new Error('익명 세션을 생성하지 못했습니다.');

  window.localStorage.setItem(ANONYMOUS_USER_ID_KEY, data.session.user.id);
  return data.session.user.id;
}

export function ensureAnonymousSession() {
  sessionPromise ??= createOrRestoreAnonymousSession().catch((error) => {
    sessionPromise = null;
    throw error;
  });

  return sessionPromise;
}
