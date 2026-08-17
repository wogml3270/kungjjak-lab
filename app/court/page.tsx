import Link from 'next/link';
import { CourtHub } from '@/components/court/court-hub';
import { createClient } from '@/lib/supabase/server';
import type { CourtCase, CourtTemplate } from '@/lib/court/types';
import { LoginRequiredLink } from '@/components/auth/login-required-link';

export const metadata = { title: '사랑의 판결 받기' };

export default async function CourtPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const adminResult =
    authData.user && !authData.user.is_anonymous
      ? await supabase.rpc('is_court_admin')
      : { data: false };
  const [{ data: templateData }, { data: caseData }] = await Promise.all([
    supabase
      .from('court_templates')
      .select(
        'id, slug, category, title, summary, plaintiff_claim, defendant_claim, emoji, difficulty, is_featured, play_count, created_at',
      )
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at'),
    supabase
      .from('court_cases')
      .select(
        'id, invite_code, creator_user_id, title, summary, plaintiff_name, defendant_name, plaintiff_claim, defendant_claim, status, visibility, moderation_status, moderation_reason, closes_at, created_at',
      )
      .eq('visibility', 'public')
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false }),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <header className="rounded-3xl border-3 border-black bg-brand-pink p-6 shadow-neo-lg">
        <div className="flex items-center justify-between gap-3">
          <Link className="text-sm font-black underline" href="/">
            ← 홈
          </Link>
          {adminResult.data ? (
            <Link
              className="rounded-full border-2 border-black bg-white px-3 py-2 text-xs font-black shadow-[2px_2px_0_#000]"
              href="/admin/court-cases"
            >
              🛡️ 관리자 검수
            </Link>
          ) : null}
        </div>
        <span aria-hidden className="mt-5 block text-6xl">
          ⚖️
        </span>
        <p className="mt-4 text-xs font-black tracking-widest">LOVE COURT</p>
        <h1 className="mt-2 text-4xl font-black">사랑의 판결 받기</h1>
        <p className="mt-3 font-bold leading-7">
          공식 사건에 바로 투표하거나, 우리만의 사건을 접수해 배심원을 모아
          보세요.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <LoginRequiredLink
            className="neo-button flex items-center justify-center bg-brand-yellow px-2 text-sm"
            href="/court/new"
            reason="사용자 지정 사건은 작성자 확인과 검수 상태 관리를 위해 로그인이 필요해요."
            signedIn={Boolean(authData.user && !authData.user.is_anonymous)}
          >
            사건 접수
          </LoginRequiredLink>
          <LoginRequiredLink
            className="neo-button flex items-center justify-center bg-white px-2 text-sm"
            href="/court/manage"
            reason="내가 만든 사건을 수정·삭제하고 검수 상태를 관리하려면 로그인이 필요해요."
            signedIn={Boolean(authData.user && !authData.user.is_anonymous)}
          >
            내 사건 관리
          </LoginRequiredLink>
        </div>
      </header>
      <CourtHub
        publicCases={(caseData ?? []) as CourtCase[]}
        signedIn={Boolean(authData.user && !authData.user.is_anonymous)}
        templates={(templateData ?? []) as CourtTemplate[]}
      />
    </main>
  );
}
