import type { Metadata } from 'next';
import { CoOpLobby } from '@/components/co-op/co-op-lobby';

export const metadata: Metadata = {
  title: '쿵짝 실험 대기실',
  description: '초대 링크로 한 사람을 불러 2인 쿵짝 실험을 시작하세요.',
  robots: { index: false, follow: false },
};

export default async function CoOpRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <CoOpLobby code={code.toUpperCase()} />;
}
