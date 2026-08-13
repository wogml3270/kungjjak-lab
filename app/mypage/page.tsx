import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { MyPageDashboard } from '@/components/mypage/mypage-dashboard';
import { createClient } from '@/lib/supabase/server';
import { normalizeProfileImage } from '@/lib/profile-image';

const axes = [
  { dimension: 'EI', left: '외향적', leftTrait: 'E', right: '내향적', rightTrait: 'I' },
  { dimension: 'SN', left: '현실적', leftTrait: 'S', right: '직관적', rightTrait: 'N' },
  { dimension: 'TF', left: '논리적', leftTrait: 'T', right: '감정적', rightTrait: 'F' },
  { dimension: 'JP', left: '계획적', leftTrait: 'J', right: '유연한', rightTrait: 'P' },
] as const;

export default async function MyPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const supabase = await createClient();
  const [{ data: { user } }, params] = await Promise.all([supabase.auth.getUser(), searchParams]);
  if (!user || user.is_anonymous) redirect('/login');

  const initialTab = params.tab === 'solo' || params.tab === 'co-op' ? params.tab : 'profile';
  const [soloResult, membershipResult] = await Promise.all([
    supabase.from('solo_results').select('id, mbti, confidence, axis_scores, completed_at').order('completed_at', { ascending: false }),
    supabase.from('participants').select('id, room_id').eq('user_id', user.id).eq('is_ready', true).order('joined_at', { ascending: false }),
  ]);

  if (soloResult.error) console.error('[mypage] solo history query failed', soloResult.error);
  if (membershipResult.error) console.error('[mypage] membership query failed', membershipResult.error);

  const roomIds = [...new Set((membershipResult.data ?? []).map(({ room_id }) => room_id).filter(Boolean))];
  const membershipByRoom = new Map((membershipResult.data ?? []).map((membership) => [membership.room_id, membership.id]));
  const [roomResult, reportResult, participantResult, responseResult, questionResult] = roomIds.length
    ? await Promise.all([
        supabase.from('rooms').select('id, status, created_at').in('id', roomIds).eq('status', 'completed'),
        supabase.from('reports').select('id, room_id, score, created_at').in('room_id', roomIds).order('created_at', { ascending: false }),
        supabase.from('participants').select('room_id, user_id, role, display_name').in('room_id', roomIds),
        supabase.from('responses').select('room_id, question_id, score_value').in('room_id', roomIds),
        supabase.from('questions').select('id, title, dimension, positive_trait').eq('is_active', true),
      ])
    : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }, { data: [], error: null }, { data: [], error: null }];

  if (roomResult.error) console.error('[mypage] completed room query failed', roomResult.error);
  if (reportResult.error) console.error('[mypage] co-op report query failed', reportResult.error);
  if (participantResult.error) console.error('[mypage] participant name query failed', participantResult.error);
  if (responseResult.error) console.error('[mypage] response query failed', responseResult.error);
  if (questionResult.error) console.error('[mypage] question query failed', questionResult.error);

  const avatarByUser = new Map<string, string>();
  const uniqueUserIds = [...new Set((participantResult.data ?? []).map(({ user_id }) => user_id))];
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    await Promise.all(uniqueUserIds.map(async (userId) => {
      const { data } = await admin.auth.admin.getUserById(userId);
      const candidate = data.user?.user_metadata.avatar_url ?? data.user?.user_metadata.picture;
      avatarByUser.set(userId, normalizeProfileImage(candidate));
    }));
  }
  const profilesByRoom = new Map<string, Array<{ name: string; avatarUrl: string; role: string }>>();
  for (const participant of participantResult.data ?? []) {
    profilesByRoom.set(participant.room_id, [...(profilesByRoom.get(participant.room_id) ?? []), { name: participant.display_name ?? '상대방', avatarUrl: avatarByUser.get(participant.user_id) ?? '/default-profile.svg', role: participant.role }]);
  }
  const reportsByRoom = new Map((reportResult.data ?? []).map((report) => [report.room_id, report]));
  const questionsById = new Map((questionResult.data ?? []).map((question) => [question.id, question]));
  const responsesByRoom = new Map<string, Map<string, number[]>>();
  for (const response of responseResult.data ?? []) {
    const byQuestion = responsesByRoom.get(response.room_id) ?? new Map<string, number[]>();
    byQuestion.set(response.question_id, [...(byQuestion.get(response.question_id) ?? []), response.score_value]);
    responsesByRoom.set(response.room_id, byQuestion);
  }
  const coOpHistories = (roomResult.data ?? []).map((room) => {
    const report = reportsByRoom.get(room.id);
    const profiles = (profilesByRoom.get(room.id) ?? []).sort((first, second) => first.role === 'host' ? -1 : second.role === 'host' ? 1 : 0);
    const names = profiles.map(({ name: participantName }) => participantName);
    const pairs = [...(responsesByRoom.get(room.id)?.values() ?? [])].filter((values) => values.length === 2);
    const difference = pairs.reduce((sum, values) => sum + Math.abs(values[0] - values[1]), 0);
    const fallbackScore = pairs.length === 24 ? Math.round((1 - difference / 96) * 100) : 0;
    const entries = [...(responsesByRoom.get(room.id)?.entries() ?? [])].filter(([, values]) => values.length === 2);
    const axisResults = axes.map((axis) => {
      const axisPairs = entries.filter(([questionId]) => questionsById.get(questionId)?.dimension === axis.dimension);
      const axisDifference = axisPairs.reduce((sum, [, values]) => sum + Math.abs(values[0] - values[1]), 0);
      const tendency = axisPairs.reduce((sum, [questionId, values]) => sum + (values[0] + values[1]) * (questionsById.get(questionId)?.positive_trait === axis.leftTrait ? 1 : -1), 0);
      const maximum = Math.max(1, axisPairs.length * 4);
      const leftPercent = Math.round(((tendency + maximum) / (maximum * 2)) * 100);
      return { ...axis, chemistry: Math.round((1 - axisDifference / maximum) * 100), leftPercent, rightPercent: 100 - leftPercent };
    });
    const biggestGap = entries.reduce((largest, [questionId, values]) => Math.abs(values[0] - values[1]) > largest.gap ? { gap: Math.abs(values[0] - values[1]), questionId } : largest, { gap: -1, questionId: '' });
    return {
      id: report?.id ?? room.id,
      participantId: membershipByRoom.get(room.id) ?? '',
      score: report ? Number(report.score) : fallbackScore,
      createdAt: report?.created_at ?? room.created_at,
      names: names.length === 2 ? names : ['나', '상대방'],
      profiles: profiles.length === 2 ? profiles.map(({ name: participantName, avatarUrl }) => ({ name: participantName, avatarUrl })) : [{ name: '나', avatarUrl: '/default-profile.svg' }, { name: '상대방', avatarUrl: '/default-profile.svg' }],
      exactMatches: pairs.filter(([first, second]) => first === second).length,
      closeMatches: pairs.filter(([first, second]) => Math.abs(first - second) <= 1).length,
      strongMatches: pairs.filter(([first, second]) => Math.abs(first) === 2 && first === second).length,
      axisResults,
      gap: biggestGap.gap,
      gapQuestion: questionsById.get(biggestGap.questionId)?.title ?? null,
    };
  });
  const name = user.user_metadata.full_name ?? user.user_metadata.name ?? user.user_metadata.preferred_username ?? '쿵짝 연구원';

  return <main className="mx-auto min-h-screen max-w-md px-5 py-8">
    <header className="flex items-center justify-between"><Link className="font-black underline underline-offset-4" href="/">← 홈</Link><SignOutButton /></header>
    <section className="mt-6 rounded-3xl border-3 border-black bg-brand-yellow p-6 shadow-neo-lg"><p className="text-xs font-black tracking-widest">MY LAB</p><h1 className="mt-2 text-3xl font-black">{name}님의 연구 기록</h1></section>
    <MyPageDashboard coOpHistories={coOpHistories} email={user.email ?? '이메일 비공개'} initialTab={initialTab} name={name} provider={user.app_metadata.provider === 'kakao' ? 'Kakao' : 'Google'} soloHistories={soloResult.data ?? []} />
  </main>;
}
