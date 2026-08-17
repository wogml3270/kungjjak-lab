import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OfficialCourtVote } from '@/components/court/official-court-vote';
import { createClient } from '@/lib/supabase/server';
import type { CourtTemplate } from '@/lib/court/types';

export default async function OfficialCourtPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data } = await (
    await createClient()
  )
    .from('court_templates')
    .select(
      'id, slug, category, title, summary, plaintiff_claim, defendant_claim, emoji, difficulty, is_featured, play_count',
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (!data) notFound();
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <Link className="font-black underline" href="/court">
        ← 사건 목록
      </Link>
      <OfficialCourtVote template={data as CourtTemplate} />
    </main>
  );
}
