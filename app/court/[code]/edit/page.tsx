import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CourtEditForm } from '@/components/court/court-edit-form';
import { createClient } from '@/lib/supabase/server';
import type { CourtCase } from '@/lib/court/types';

export default async function CourtEditPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user || authData.user.is_anonymous)
    redirect(`/login?next=${encodeURIComponent(`/court/${code}/edit`)}`);
  const { data } = await supabase
    .from('court_cases')
    .select(
      'id, invite_code, creator_user_id, title, summary, plaintiff_name, defendant_name, plaintiff_claim, defendant_claim, status, visibility, moderation_status, moderation_reason, closes_at, created_at',
    )
    .eq('invite_code', code)
    .eq('creator_user_id', authData.user.id)
    .maybeSingle();
  if (!data || !['private', 'rejected'].includes(data.moderation_status))
    notFound();
  const { data: evidence } = await supabase
    .from('court_rounds')
    .select('content')
    .eq('case_id', data.id)
    .eq('round_type', 'evidence')
    .maybeSingle();
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <Link className="font-black underline" href="/court/manage">
        ← 내 사건 관리
      </Link>
      <CourtEditForm
        courtCase={data as CourtCase}
        evidence={evidence?.content ?? ''}
      />
    </main>
  );
}
