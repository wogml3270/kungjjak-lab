'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function SignOutButton() {
  const router = useRouter();
  return <button className="text-sm font-black underline underline-offset-4" onClick={async () => { await createClient().auth.signOut(); router.replace('/'); router.refresh(); }} type="button">로그아웃</button>;
}
