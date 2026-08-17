import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CourtModerationBoard } from '@/components/admin/court-moderation-board';
import { createClient } from '@/lib/supabase/server';
import type { CourtCase } from '@/lib/court/types';

const ADMIN_EMAILS = ['wogml3270@gmail.com', 'wogml3270@naver.com'];
export default async function CourtAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) redirect('/login?next=/admin/court-cases');
  if (!user.email || !ADMIN_EMAILS.includes(user.email)) notFound();
  const { data, error } = await supabase
    .from('court_cases')
    .select(
      'id, invite_code, creator_user_id, title, summary, plaintiff_name, defendant_name, plaintiff_claim, defendant_claim, status, visibility, moderation_status, moderation_reason, closes_at, created_at',
    )
    .in('moderation_status', [
      'pending_review',
      'approved',
      'rejected',
      'hidden',
    ])
    .order('created_at', { ascending: true });
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-8">
      <div className="flex items-center justify-between">
        <Link className="font-black underline" href="/">
          ← 홈
        </Link>
        <span className="rounded-full border-2 border-black bg-brand-pink px-3 py-1 text-xs font-black">
          OWNER
        </span>
      </div>
      <header className="mt-6 rounded-3xl border-3 border-black bg-brand-yellow p-6 shadow-neo-lg">
        <p className="text-xs font-black tracking-widest">MODERATION DESK</p>
        <h1 className="mt-2 text-3xl font-black">공개 재판 검수</h1>
        <p className="mt-2 font-bold">
          공개 신청 사건을 직접 승인하거나 반려합니다.
        </p>
      </header>
      {error ? (
        <p className="mt-6 rounded-2xl border-3 border-black bg-brand-pink p-4 font-black">
          목록을 불러오지 못했습니다: {error.message}
        </p>
      ) : (
        <CourtModerationBoard
          adminUserId={user.id}
          cases={(data ?? []) as CourtCase[]}
        />
      )}
    </main>
  );
}
