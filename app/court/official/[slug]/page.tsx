import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LiveCourtPlayer } from '@/components/court/official-court-vote';
import { createClient } from '@/lib/supabase/server';
import type { CourtRound } from '@/lib/court/types';

export default async function OfficialCourtPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('court_templates')
    .select(
      'id, slug, category, title, summary, plaintiff_claim, defendant_claim, emoji, difficulty, is_featured, play_count, created_at',
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (!data) notFound();
  const { data: roundData } = await supabase
    .from('court_rounds')
    .select(
      'id, round_order, round_type, title, content, emoji, evidence_label',
    )
    .eq('template_id', data.id)
    .order('round_order');
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <Link className="font-black underline" href="/court">
        ← 사건 목록
      </Link>
      <LiveCourtPlayer
        createdAt={data.created_at}
        rounds={(roundData ?? []) as CourtRound[]}
        subjectEmoji={data.emoji}
        subjectId={data.id}
        subjectKind="template"
        subjectTitle={data.title}
      />
    </main>
  );
}
