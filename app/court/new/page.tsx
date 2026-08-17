import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CourtCreateForm } from '@/components/court/court-create-form';
import { createClient } from '@/lib/supabase/server';
import type { CourtTemplate } from '@/lib/court/types';

export default async function CourtNewPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    query,
  ] = await Promise.all([supabase.auth.getUser(), searchParams]);
  if (!user || user.is_anonymous) redirect('/login?next=/court/new');
  let template: CourtTemplate | null = null;
  if (query.template) {
    const { data } = await supabase
      .from('court_templates')
      .select(
        'id, category, title, summary, plaintiff_claim, defendant_claim, emoji, difficulty, is_featured',
      )
      .eq('id', query.template)
      .maybeSingle();
    template = data as CourtTemplate | null;
  }
  const nickname = String(
    user.user_metadata.service_nickname ??
      user.user_metadata.full_name ??
      user.user_metadata.name ??
      '나',
  ).slice(0, 10);
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <Link className="font-black underline" href="/court">
        ← 사건 목록
      </Link>
      <CourtCreateForm
        nickname={nickname}
        template={template}
        userId={user.id}
      />
    </main>
  );
}
