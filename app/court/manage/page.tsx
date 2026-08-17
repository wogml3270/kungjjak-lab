import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CourtCaseManager } from '@/components/court/court-case-manager';
import { createClient } from '@/lib/supabase/server';
import type { CourtCase } from '@/lib/court/types';

export default async function CourtManagePage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user || authData.user.is_anonymous)
    redirect('/login?next=/court/manage');
  const { data } = await supabase
    .from('court_cases')
    .select(
      'id, invite_code, creator_user_id, title, summary, plaintiff_name, defendant_name, plaintiff_claim, defendant_claim, status, visibility, moderation_status, moderation_reason, closes_at, created_at',
    )
    .eq('creator_user_id', authData.user.id)
    .order('created_at', { ascending: false });
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <Link className="font-black underline" href="/court">
        ← 사랑의 판결
      </Link>
      <header className="mt-6 rounded-3xl border-3 border-black bg-brand-blue p-6 shadow-neo-lg">
        <p className="text-xs font-black tracking-widest">MY CASE DESK</p>
        <h1 className="mt-2 text-3xl font-black">내 사건 관리</h1>
        <p className="mt-2 text-sm font-bold leading-6">
          사건을 수정하거나 배심원을 초대하고 공개 검수를 요청할 수 있어요.
        </p>
        <Link
          className="neo-button mt-5 flex justify-center bg-brand-yellow"
          href="/court/new"
        >
          새 사건 접수하기
        </Link>
      </header>
      <CourtCaseManager initialCases={(data ?? []) as CourtCase[]} />
    </main>
  );
}
