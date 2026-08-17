'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { NicknameEditor } from '@/components/profile/nickname-editor';
import { CoOpResultDisplay } from '@/components/co-op/co-op-result-display';

type Tab = 'profile' | 'solo' | 'co-op';
type SoloHistory = {
  id: string;
  mbti: string;
  confidence: number;
  axis_scores: Record<string, number>;
  completed_at: string;
};
type AxisResult = {
  dimension: string;
  left: string;
  leftTrait: string;
  right: string;
  rightTrait: string;
  chemistry: number;
  leftPercent: number;
  rightPercent: number;
};
type CoOpHistory = {
  id: string;
  participantId: string;
  score: number;
  createdAt: string;
  names: string[];
  profiles: Array<{ name: string; avatarUrl: string; role: string }>;
  exactMatches: number;
  closeMatches: number;
  strongMatches: number;
  axisResults: AxisResult[];
  gap: number;
  gapQuestion: string | null;
};

const tabs: Array<{ label: string; value: Tab; color: string }> = [
  { label: '내 정보', value: 'profile', color: 'bg-brand-pink' },
  { label: 'Solo 기록', value: 'solo', color: 'bg-brand-blue' },
  { label: '2인 기록', value: 'co-op', color: 'bg-brand-mint' },
];

export function MyPageDashboard({
  coOpHistories,
  createdAt,
  email,
  initialTab,
  lastSignInAt,
  name,
  nextNicknameChangeAt,
  nickname,
  profileImage,
  provider,
  soloHistories,
}: {
  coOpHistories: CoOpHistory[];
  createdAt: string;
  email: string;
  initialTab: Tab;
  lastSignInAt: string | null;
  name: string;
  nextNicknameChangeAt: string | null;
  nickname: string;
  profileImage: string;
  provider: string;
  soloHistories: SoloHistory[];
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [selectedSolo, setSelectedSolo] = useState<SoloHistory | null>(null);
  const [selectedResult, setSelectedResult] = useState<CoOpHistory | null>(null);
  const [visibleSoloHistories, setVisibleSoloHistories] = useState(soloHistories);
  const [visibleCoOpHistories, setVisibleCoOpHistories] = useState(coOpHistories);

  async function deleteSolo(item: SoloHistory) {
    if (!window.confirm(`${item.mbti} Solo 기록을 삭제할까요? 삭제 후 복구할 수 없어요.`)) return;
    const { error } = await createClient().from('solo_results').delete().eq('id', item.id);
    if (error) {
      window.alert('기록을 삭제하지 못했어요. 다시 시도해 주세요.');
      return;
    }
    setVisibleSoloHistories((items) => items.filter(({ id }) => id !== item.id));
    if (selectedSolo?.id === item.id) setSelectedSolo(null);
  }

  async function deleteCoOp(item: CoOpHistory) {
    if (!window.confirm(`${item.names.join(' × ')} 기록을 내 목록에서 삭제할까요?`)) return;
    const { error } = await createClient()
      .from('participants')
      .update({ history_visible: false })
      .eq('id', item.participantId);
    if (error) {
      window.alert('기록을 삭제하지 못했어요. 다시 시도해 주세요.');
      return;
    }
    setVisibleCoOpHistories((items) => items.filter(({ id }) => id !== item.id));
    if (selectedResult?.id === item.id) setSelectedResult(null);
  }

  function changeTab(nextTab: Tab) {
    setTab(nextTab);
    window.history.replaceState(null, '', `/mypage?tab=${nextTab}`);
  }

  return (
    <>
      <nav aria-label="마이페이지 메뉴" className="mt-7 grid grid-cols-3 gap-2 text-sm">
        {tabs.map((item) => (
          <button
            aria-current={tab === item.value ? 'page' : undefined}
            className={`neo-button flex items-center justify-center text-center ${tab === item.value ? item.color : 'bg-white'}`}
            disabled={tab === item.value}
            key={item.value}
            onClick={() => changeTab(item.value)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === 'profile' ? (
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 overflow-hidden rounded-3xl border-3 border-black bg-white shadow-neo"
          initial={{ opacity: 0, y: 16 }}
        >
          <div className="relative bg-brand-mint p-6 text-center">
            <motion.div
              animate={{ rotate: [0, -3, 3, 0] }}
              className="mx-auto size-28 overflow-hidden rounded-full border-3 border-black bg-white shadow-neo"
              transition={{ duration: 1.1 }}
              whileHover={{ scale: 1.06, rotate: 0 }}
            >
              <img alt="내 프로필" className="size-full object-cover" src={profileImage} />
            </motion.div>
            <h2 className="mt-4 text-2xl font-black">{name}</h2>
            <span className="mt-2 inline-flex rounded-full border-2 border-black bg-brand-yellow px-3 py-1 text-xs font-black">
              {provider} 계정
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-3 p-5 text-sm">
            <NicknameEditor initialNickname={nickname} nextChangeAt={nextNicknameChangeAt} />
            <ProfileInfo color="bg-brand-pink" label="이메일" value={email} wide />
            <ProfileInfo
              color="bg-brand-blue"
              label="가입한 날"
              value={formatDateTime(createdAt)}
            />
            <ProfileInfo
              color="bg-brand-yellow"
              label="최근 로그인"
              value={lastSignInAt ? formatDateTime(lastSignInAt) : '기록 없음'}
            />
            <ProfileInfo
              color="bg-brand-mint"
              label="완료한 검사"
              value={`${visibleSoloHistories.length + visibleCoOpHistories.length}회`}
            />
            <ProfileInfo
              color="bg-white"
              label="보관 중인 기록"
              value={`Solo ${visibleSoloHistories.length} · 2인 ${visibleCoOpHistories.length}`}
            />
          </dl>
        </motion.section>
      ) : null}

      {tab === 'solo' ? (
        <section className="mt-6 space-y-4">
          {visibleSoloHistories.length === 0 ? (
            <Empty text="아직 저장된 Solo 기록이 없어요." />
          ) : (
            visibleSoloHistories.map((item) => (
              <button
                className="flex w-full items-center justify-between rounded-2xl border-3 border-black bg-white p-5 text-left shadow-neo transition-transform hover:-translate-y-0.5"
                key={item.id}
                onClick={() => setSelectedSolo(item)}
                type="button"
              >
                <div>
                  <p className="text-2xl font-black">{item.mbti}</p>
                  <DateText value={item.completed_at} />
                </div>
                <span aria-hidden className="text-2xl">
                  →
                </span>
              </button>
            ))
          )}
        </section>
      ) : null}

      {tab === 'co-op' ? (
        <section className="mt-6 space-y-4">
          {visibleCoOpHistories.length === 0 ? (
            <Empty text="완료된 2인 멀티버스 기록이 없어요." />
          ) : (
            visibleCoOpHistories.map((item) => (
              <button
                className="w-full rounded-2xl border-3 border-black bg-white p-4 text-left shadow-neo transition-transform hover:-translate-y-0.5"
                key={item.id}
                onClick={() => setSelectedResult(item)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {item.profiles.map((profile) => (
                      <div
                        className="min-w-0 flex-1 text-center"
                        key={`${item.id}-${profile.role}`}
                      >
                        <div className="mx-auto size-12 overflow-hidden rounded-full border-2 border-black bg-white">
                          <img
                            alt={`${profile.name} 프로필`}
                            className="size-full object-cover"
                            src={profile.avatarUrl}
                          />
                        </div>
                        <p className="mt-1 truncate text-xs font-black">{profile.name}</p>
                        <span
                          className={`inline-flex rounded-full border border-black px-2 py-0.5 text-[9px] font-black ${profile.role === 'host' ? 'bg-brand-yellow' : 'bg-brand-blue'}`}
                        >
                          {profile.role === 'host' ? '호스트' : '게스트'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <span className="shrink-0 rounded-full border-2 border-black bg-brand-mint px-3 py-2 text-sm font-black">
                    {Math.round(item.score)}%
                  </span>
                </div>
                <div className="mt-3 border-t-2 border-dashed border-neutral-300 pt-2">
                  <DateText value={item.createdAt} />
                </div>
              </button>
            ))
          )}
        </section>
      ) : null}

      <ResultDrawer
        onClose={() => setSelectedResult(null)}
        onDelete={deleteCoOp}
        result={selectedResult}
      />
      <SoloResultDrawer
        onClose={() => setSelectedSolo(null)}
        onDelete={deleteSolo}
        result={selectedSolo}
      />
    </>
  );
}

const soloAxes = [
  { key: 'EI', left: 'E', right: 'I' },
  { key: 'SN', left: 'S', right: 'N' },
  { key: 'TF', left: 'T', right: 'F' },
  { key: 'JP', left: 'J', right: 'P' },
] as const;
function clarityProfile(clarity: number) {
  if (clarity >= 60)
    return {
      label: '선명한 성향형',
      description: '여러 상황에서도 선호하는 방향이 비교적 뚜렷하게 나타났어요.',
    };
  if (clarity >= 30)
    return {
      label: '상황 적응형',
      description: '기본 성향은 있지만 사람과 상황에 맞춰 유연하게 반응하는 편이에요.',
    };
  return {
    label: '균형 탐색형',
    description: '한쪽 성향에 갇히기보다 서로 다른 방식을 고르게 활용하는 편이에요.',
  };
}

function SoloResultDrawer({
  onClose,
  onDelete,
  result,
}: {
  onClose: () => void;
  onDelete: (item: SoloHistory) => Promise<void>;
  result: SoloHistory | null;
}) {
  useEffect(() => {
    if (!result) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose, result]);
  const profile = result ? clarityProfile(result.confidence) : null;

  return (
    <AnimatePresence>
      {result && profile ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/40"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            animate={{ x: 0 }}
            aria-label="Solo 결과 상세"
            aria-modal="true"
            className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto border-l-3 border-black bg-[#FFF8F0] px-5 py-6 shadow-[-8px_0_0_#000]"
            exit={{ x: '105%' }}
            initial={{ x: '105%' }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-black tracking-widest">SOLO RESULT</p>
              <button
                aria-label="결과 닫기"
                className="flex size-10 items-center justify-center rounded-full border-2 border-black bg-white text-2xl font-black shadow-[2px_2px_0_#000]"
                onClick={onClose}
                type="button"
              >
                ×
              </button>
            </div>
            <section className="mt-5 rounded-3xl border-3 border-black bg-brand-mint p-6 shadow-neo-lg">
              <h2 className="text-5xl font-black">{result.mbti}</h2>
              <div className="mt-4 rounded-2xl border-3 border-black bg-white p-4">
                <p className="text-xs font-black tracking-wider">나의 성향 표현 스타일</p>
                <p className="mt-1 text-xl font-black">{profile.label}</p>
                <p className="mt-2 text-xs font-semibold leading-5">{profile.description}</p>
              </div>
              <div className="mt-6 space-y-5">
                {soloAxes.map(({ key, left, right }) => {
                  const score = Number(result.axis_scores[key] ?? 0);
                  const leftPercent = Math.round(((score + 12) / 24) * 100);
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs font-black">
                        <span>
                          {left} {leftPercent}%
                        </span>
                        <span>
                          {100 - leftPercent}% {right}
                        </span>
                      </div>
                      <div className="mt-2 flex h-4 overflow-hidden rounded-full border-2 border-black">
                        <div className="bg-brand-pink" style={{ width: `${leftPercent}%` }} />
                        <div className="bg-brand-blue" style={{ width: `${100 - leftPercent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            <DangerZone onDelete={() => void onDelete(result)} />
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ResultDrawer({
  onClose,
  onDelete,
  result,
}: {
  onClose: () => void;
  onDelete: (item: CoOpHistory) => Promise<void>;
  result: CoOpHistory | null;
}) {
  useEffect(() => {
    if (!result) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose, result]);

  return (
    <AnimatePresence>
      {result ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/40"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            animate={{ x: 0 }}
            aria-label="2인 멀티버스 결과 상세"
            aria-modal="true"
            className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto border-l-3 border-black bg-[#FFF8F0] px-5 py-6 shadow-[-8px_0_0_#000]"
            exit={{ x: '105%' }}
            initial={{ x: '105%' }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-black tracking-widest">CO-OP RESULT</p>
              <button
                aria-label="결과 닫기"
                className="flex size-10 items-center justify-center rounded-full border-2 border-black bg-white text-2xl font-black shadow-[2px_2px_0_#000]"
                onClick={onClose}
                type="button"
              >
                ×
              </button>
            </div>
            <div className="mt-5">
              <CoOpResultDisplay
                axisResults={result.axisResults}
                closeMatches={result.closeMatches}
                exactMatches={result.exactMatches}
                gap={result.gap}
                gapQuestion={result.gapQuestion}
                profiles={result.profiles}
                score={result.score}
                strongMatches={result.strongMatches}
              />
            </div>
            <DangerZone onDelete={() => void onDelete(result)} />
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function DateText({ value }: { value: string }) {
  return (
    <p className="mt-1 text-xs font-bold text-neutral-500">
      {new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value))}
    </p>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border-3 border-black bg-white p-6 text-center font-bold shadow-neo">
      {text}
    </div>
  );
}
function ProfileInfo({
  color,
  label,
  value,
  wide = false,
}: {
  color: string;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <motion.div
      className={`min-w-0 rounded-2xl border-2 border-black p-3 ${color} ${wide ? 'col-span-2' : ''}`}
      whileHover={{ y: -3, rotate: wide ? 0 : -1 }}
    >
      <dt className="text-[10px] font-black text-neutral-600">{label}</dt>
      <dd className="mt-1 break-all font-black">{value}</dd>
    </motion.div>
  );
}
function DangerZone({ onDelete }: { onDelete: () => void }) {
  return (
    <div className="mb-3 mt-7 border-t-2 border-dashed border-neutral-400 pt-5">
      <button
        className="w-full rounded-xl border-2 border-black bg-brand-pink px-4 py-3 text-sm font-black shadow-[2px_2px_0_#000] transition-transform hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        onClick={onDelete}
        type="button"
      >
        이 기록 삭제하기
      </button>
      <p className="mt-2 text-center text-[10px] font-bold text-neutral-500">
        삭제한 기록은 복구할 수 없어요.
      </p>
    </div>
  );
}
function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}
