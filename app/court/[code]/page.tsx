import { CourtRoom } from '@/components/court/court-room';
export default async function CourtRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <CourtRoom code={code.toUpperCase()} />;
}
