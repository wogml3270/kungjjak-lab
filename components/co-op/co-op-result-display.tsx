'use client';
import { motion } from 'framer-motion';

export type CoOpAxisResult = {
  dimension: string;
  left: string;
  leftTrait: string;
  right: string;
  rightTrait: string;
  chemistry: number;
  leftPercent: number;
  rightPercent: number;
};
export type CoOpProfile = { name: string; avatarUrl: string; role?: string };

export function CoOpResultDisplay({
  axisResults,
  closeMatches,
  exactMatches,
  gap,
  gapQuestion,
  profiles,
  score,
  strongMatches,
}: {
  axisResults: CoOpAxisResult[];
  closeMatches: number;
  exactMatches: number;
  gap: number;
  gapQuestion: string | null;
  profiles: CoOpProfile[];
  score: number;
  strongMatches: number;
}) {
  return (
    <>
      <section className="relative overflow-hidden rounded-3xl border-3 border-black bg-brand-mint p-5 text-center shadow-neo-lg">
        <CelebrationParticles />
        <motion.span
          animate={{ scale: [0, 1.25, 1], rotate: [0, -8, 5, 0] }}
          aria-hidden
          className="relative block text-6xl"
          initial={{ scale: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          💞
        </motion.span>
        <motion.h2
          animate={{ opacity: 1, y: 0 }}
          className="relative mt-3 text-3xl font-black"
          initial={{ opacity: 0, y: 12 }}
        >
          우리의 쿵짝 스코어
        </motion.h2>
        <div className="relative mx-auto mt-5 flex max-w-xs items-center justify-center gap-3">
          <ProfileBadge index={0} profile={profiles[0]} />
          <motion.span
            animate={{ scale: [0, 1.35, 1] }}
            className="text-2xl font-black"
            initial={{ scale: 0 }}
          >
            ×
          </motion.span>
          <ProfileBadge index={1} profile={profiles[1]} />
        </div>
        <motion.p
          animate={{ opacity: 1, scale: 1 }}
          className="relative mt-4 text-7xl font-black"
          initial={{ opacity: 0, scale: 0.65 }}
          transition={{ delay: 0.7, type: 'spring' }}
        >
          {Math.round(score)}
          <span className="text-3xl">%</span>
        </motion.p>
        <p className="mt-3 font-black">{scoreSummary(score)}</p>
        <div className="mt-6 grid grid-cols-3 gap-2">
          <Stat color="bg-brand-yellow" label="완전 일치" value={`${exactMatches}개`} />
          <Stat color="bg-brand-blue" label="비슷한 답" value={`${closeMatches}개`} />
          <Stat color="bg-brand-pink" label="강한 공감" value={`${strongMatches}개`} />
        </div>
      </section>
      <section className="mt-5 rounded-3xl border-3 border-black bg-white p-5 shadow-neo">
        <h3 className="text-lg font-black">우리의 심리 밸런스</h3>
        <p className="mt-1 text-xs font-semibold text-neutral-600">
          두 사람의 답변 강도를 네 가지 성향 축으로 분석했어요.
        </p>
        <div className="mt-5 space-y-5">
          {axisResults.map((axis) => (
            <div key={axis.dimension}>
              <div className="flex justify-between gap-2 text-xs font-black">
                <span>
                  {axis.left}({axis.leftTrait}) {axis.leftPercent}%
                </span>
                <span>
                  {axis.rightPercent}% {axis.right}({axis.rightTrait})
                </span>
              </div>
              <div className="mt-2 flex h-4 overflow-hidden rounded-full border-2 border-black">
                <div className="bg-brand-pink" style={{ width: `${axis.leftPercent}%` }} />
                <div className="bg-brand-blue" style={{ width: `${axis.rightPercent}%` }} />
              </div>
              <p className="mt-1 text-right text-[10px] font-black text-neutral-600">
                이 축의 쿵짝 {axis.chemistry}%
              </p>
            </div>
          ))}
        </div>
      </section>
      {gapQuestion ? (
        <section className="mt-5 rounded-3xl border-3 border-black bg-brand-yellow p-5 shadow-neo">
          <p className="text-xs font-black">우리의 대화 포인트 💬</p>
          <p className="mt-2 font-bold">“{gapQuestion}”</p>
          <p className="mt-2 text-xs font-semibold">
            이 질문에서 {gap}단계 차이가 났어요. 서로의 이유를 물어보세요.
          </p>
        </section>
      ) : null}
    </>
  );
}
function ProfileBadge({
  index,
  profile = { name: '상대방', avatarUrl: '/default-profile.svg' },
}: {
  index: number;
  profile?: CoOpProfile;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, x: 0, rotate: index ? 3 : -3 }}
      className="min-w-0 flex-1"
      initial={{ opacity: 0, x: index ? 40 : -40 }}
    >
      <div className="mx-auto size-20 overflow-hidden rounded-full border-3 border-black bg-white shadow-neo">
        <img
          alt={`${profile.name} 프로필`}
          className="size-full object-cover"
          src={profile.avatarUrl}
        />
      </div>
      <p className="mt-2 truncate rounded-full border-2 border-black bg-white px-2 py-1 text-xs font-black">
        {profile.name}
      </p>
      {profile.role ? (
        <span
          className={`mt-1 inline-flex rounded-full border border-black px-2 py-0.5 text-[9px] font-black ${profile.role === 'host' ? 'bg-brand-yellow' : 'bg-brand-blue'}`}
        >
          {profile.role === 'host' ? '호스트' : '게스트'}
        </span>
      ) : null}
    </motion.div>
  );
}
function CelebrationParticles() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {Array.from({ length: 14 }, (_, index) => (
        <motion.i
          animate={{ y: [0, 170], rotate: [0, 240], opacity: [0, 1, 0] }}
          className={`absolute top-0 size-2 border border-black ${['bg-brand-pink', 'bg-brand-yellow', 'bg-brand-blue', 'bg-white'][index % 4]}`}
          initial={{ left: `${6 + index * 7}%`, y: -15 }}
          key={index}
          transition={{ delay: index * 0.04, duration: 1.5 }}
        />
      ))}
    </div>
  );
}
function Stat({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className={`rounded-xl border-2 border-black p-2 ${color}`}>
      <p className="text-lg font-black">{value}</p>
      <p className="text-[10px] font-black">{label}</p>
    </div>
  );
}
function scoreSummary(score: number) {
  return score >= 85
    ? '말하지 않아도 통하는 텔레파시형'
    : score >= 70
      ? '닮음과 다름이 균형 잡힌 단짝형'
      : score >= 50
        ? '차이를 발견할수록 재밌는 탐험형'
        : '대화할수록 가까워지는 반전형';
}
