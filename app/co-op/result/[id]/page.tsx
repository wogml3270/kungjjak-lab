import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function CoOpResultPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) redirect('/login');
  const { id } = await params;
  const { data: report, error: reportError } = await supabase.from('reports').select('id, room_id, score, summary, created_at').eq('id', id).maybeSingle();
  if (reportError) console.error('[co-op result] report query failed', reportError);
  if (!report) notFound();
  const { data: participants, error: participantError } = await supabase.from('participants').select('display_name').eq('room_id', report.room_id);
  if (participantError) console.error('[co-op result] participant query failed', participantError);
  const names = (participants ?? []).map(({ display_name }) => display_name).filter((value): value is string => Boolean(value));

  return <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-10"><section className="w-full rounded-3xl border-3 border-black bg-brand-mint p-6 text-center shadow-neo-lg"><p className="text-xs font-black tracking-widest">CO-OP RESULT</p><span aria-hidden className="mt-4 block text-6xl">💞</span><h1 className="mt-4 text-3xl font-black">우리의 쿵짝 스코어</h1><p className="mt-2 text-sm font-black">{names.length === 2 ? names.join(' × ') : '나 × 상대방'}</p><p className="mt-3 text-7xl font-black">{Math.round(Number(report.score))}<span className="text-3xl">%</span></p><p className="mt-4 font-bold">{report.summary}</p><Link className="neo-button mt-7 flex items-center justify-center bg-brand-yellow" href="/mypage?tab=co-op">← 2인 기록 목록으로</Link></section></main>;
}
