import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const COOLDOWN = 7 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.is_anonymous)
    return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const nickname =
    typeof body?.nickname === 'string' ? body.nickname.trim() : '';
  if (!nickname || nickname.length > 10)
    return NextResponse.json(
      { error: '닉네임은 1~10자로 입력해 주세요.' },
      { status: 400 },
    );
  const changedAt =
    typeof user.user_metadata.nickname_changed_at === 'string'
      ? Date.parse(user.user_metadata.nickname_changed_at)
      : 0;
  if (changedAt && Date.now() - changedAt < COOLDOWN) {
    const availableAt = new Date(changedAt + COOLDOWN).toISOString();
    return NextResponse.json(
      { error: '닉네임은 7일에 한 번 변경할 수 있어요.', availableAt },
      { status: 429 },
    );
  }
  const now = new Date().toISOString();
  const { error } = await supabase.auth.updateUser({
    data: { service_nickname: nickname, nickname_changed_at: now },
  });
  if (error) {
    console.error('[profile] nickname update failed', error);
    return NextResponse.json(
      { error: '닉네임을 저장하지 못했어요.' },
      { status: 500 },
    );
  }
  return NextResponse.json({ nickname, changedAt: now });
}
