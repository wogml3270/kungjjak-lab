import type { Metadata } from 'next';
import { SoloResultView } from '@/components/solo/solo-result-view';

export const metadata: Metadata = {
  title: 'Solo 성향 분석 결과',
  robots: { index: false, follow: false },
};

export default async function SoloResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SoloResultView id={id} />;
}
