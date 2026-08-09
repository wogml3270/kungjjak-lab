'use client';

import { useEffect } from 'react';
import { ensureAnonymousSession } from '@/lib/supabase/anonymous';

export function AnonymousSession() {
  useEffect(() => {
    ensureAnonymousSession().catch((error) => {
      console.error('[auth] Anonymous session bootstrap failed', error);
    });
  }, []);

  return null;
}
