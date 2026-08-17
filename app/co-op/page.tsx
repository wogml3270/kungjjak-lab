import type { Metadata } from 'next';
import { CoOpEntry } from '@/components/co-op/co-op-entry';

export const metadata: Metadata = {
  title: '2인 실시간 쿵짝 테스트',
  description:
    '한 사람을 초대해 같은 질문에 답하고 두 사람의 쿵짝 스코어를 확인하세요.',
  alternates: { canonical: '/co-op' },
};

export default function CoOpPage() {
  return <CoOpEntry />;
}
