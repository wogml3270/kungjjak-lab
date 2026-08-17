import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function CoOpResultPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) redirect('/login');
  const { id } = await params;
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('id, room_id, score, summary, created_at')
    .eq('id', id)
    .maybeSingle();
  if (reportError) console.error('[co-op result] report query failed', reportError);
  const roomId = report?.room_id ?? id;
  if (!report) {
    const { data: room } = await supabase
      .from('rooms')
      .select('id')
      .eq('id', roomId)
      .eq('status', 'completed')
      .maybeSingle();
    if (!room) notFound();
  }
  const [
    { data: participants, error: participantError },
    { data: responses, error: responseError },
  ] = await Promise.all([
    supabase.from('participants').select('display_name').eq('room_id', roomId),
    supabase.from('responses').select('question_id, score_value').eq('room_id', roomId),
  ]);
  if (participantError) console.error('[co-op result] participant query failed', participantError);
  if (responseError) console.error('[co-op result] response query failed', responseError);
  const names = (participants ?? [])
    .map(({ display_name }) => display_name)
    .filter((value): value is string => Boolean(value));
  const byQuestion = new Map<string, number[]>();
  for (const response of responses ?? [])
    byQuestion.set(response.question_id, [
      ...(byQuestion.get(response.question_id) ?? []),
      response.score_value,
    ]);
  const pairs = [...byQuestion.values()].filter((values) => values.length === 2);
  const difference = pairs.reduce((sum, values) => sum + Math.abs(values[0] - values[1]), 0);
  const score = report
    ? Number(report.score)
    : pairs.length === 24
      ? Math.round((1 - difference / 96) * 100)
      : 0;
  const summary = report?.summary ?? '24문항 쿵짝 실험 완료';

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-10">
      <section className="w-full rounded-3xl border-3 border-black bg-brand-mint p-6 text-center shadow-neo-lg">
        <p className="text-xs font-black tracking-widest">CO-OP RESULT</p>
        <span aria-hidden className="mt-4 block text-6xl">
          💞
        </span>
        <h1 className="mt-4 text-3xl font-black">우리의 쿵짝 스코어</h1>
        <p className="mt-2 text-sm font-black">
          {names.length === 2 ? names.join(' × ') : '나 × 상대방'}
        </p>
        <p className="mt-3 text-7xl font-black">
          {Math.round(score)}
          <span className="text-3xl">%</span>
        </p>
        <p className="mt-4 font-bold">{summary}</p>
        <Link
          className="neo-button mt-7 flex items-center justify-center bg-brand-yellow"
          href="/mypage?tab=co-op"
        >
          ← 2인 기록 목록으로
        </Link>
      </section>
    </main>
  );
}
