'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { CoOpExperiment } from '@/components/co-op/co-op-experiment';
import { ensureAnonymousSession } from '@/lib/supabase/anonymous';
import { createClient } from '@/lib/supabase/client';

type Room = { id: string; code: string; status: string; host_user_id: string; current_question: number };
type Participant = { id: string; user_id: string; role: 'host' | 'guest'; is_ready: boolean };

function roomEntryMessage(cause: unknown) {
  const message = cause instanceof Error
    ? cause.message
    : typeof cause === 'object' && cause && 'message' in cause
      ? String(cause.message)
      : String(cause);
  if (/Authentication|required|JWT|session/i.test(message)) return '익명 참여 세션을 만들지 못했어요. 페이지를 새로고침해 다시 시도해 주세요.';
  if (/duplicate|unique|already|unavailable/i.test(message)) return '이미 두 명이 참여한 방이에요. 방장에게 새 초대 링크를 요청해 주세요.';
  if (/not found/i.test(message)) return '존재하지 않거나 만료된 방이에요. 방 코드를 다시 확인해 주세요.';
  return '방에 입장하지 못했어요. 네트워크를 확인한 뒤 다시 시도해 주세요.';
}

export function CoOpLobby({ code }: { code: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState('초대장을 확인하고 있어요…');
  const [error, setError] = useState('');

  const loadParticipants = useCallback(async (roomId: string) => {
    const { data, error: participantError } = await supabase
      .from('participants')
      .select('id, user_id, role, is_ready')
      .eq('room_id', roomId)
      .order('joined_at');
    if (participantError) throw participantError;
    setParticipants((data ?? []) as Participant[]);
  }, [supabase]);

  useEffect(() => {
    let active = true;

    async function enterRoom() {
      try {
        const currentUserId = await ensureAnonymousSession();
        if (!active) return;
        setUserId(currentUserId);

        let { data: foundRoom } = await supabase
          .from('rooms')
          .select('id, code, status, host_user_id, current_question')
          .eq('code', code)
          .maybeSingle();

        if (!foundRoom) {
          const { data: joined, error: joinError } = await supabase.rpc('join_room', { room_code: code });
          if (joinError) throw joinError;
          const participant = Array.isArray(joined) ? joined[0] : joined;
          const { data, error: roomError } = await supabase
            .from('rooms')
            .select('id, code, status, host_user_id, current_question')
            .eq('id', participant.room_id)
            .single();
          if (roomError) throw roomError;
          foundRoom = data;
        }

        if (!active) return;
        setRoom(foundRoom as Room);
        setMessage('상대방을 기다리고 있어요.');
        await loadParticipants(foundRoom.id);
      } catch (cause) {
        console.error('[co-op] room entry failed', cause);
        if (!active) return;
        setError(roomEntryMessage(cause));
      }
    }

    enterRoom();
    return () => { active = false; };
  }, [code, loadParticipants, supabase]);

  useEffect(() => {
    if (!room) return;
    const channel = supabase
      .channel(`room:${room.id}:lobby`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `room_id=eq.${room.id}` }, () => {
        loadParticipants(room.id).catch(console.error);
      })
      .subscribe();

    const fallback = window.setInterval(() => loadParticipants(room.id).catch(console.error), 4000);
    return () => {
      window.clearInterval(fallback);
      supabase.removeChannel(channel);
    };
  }, [loadParticipants, room, supabase]);

  useEffect(() => {
    if (!room) return;
    const roomChannel = supabase
      .channel(`room:${room.id}:state`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, (payload) => {
        setRoom(payload.new as Room);
      })
      .subscribe();
    return () => { supabase.removeChannel(roomChannel); };
  }, [room?.id, supabase]);

  const inviteUrl = typeof window === 'undefined' ? '' : `${window.location.origin}/co-op/${code}`;
  const isHost = room?.host_user_id === userId;
  const isFull = participants.length === 2;

  async function shareInvite() {
    const shareData = { title: '쿵짝랩 초대장', text: '나와 함께 2인 쿵짝 실험할래?', url: inviteUrl };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(inviteUrl);
        setMessage('초대 링크를 복사했어요!');
      }
    } catch (cause) {
      if ((cause as DOMException).name !== 'AbortError') setMessage('공유하지 못했어요. 다시 시도해 주세요.');
    }
  }

  async function shareToKakao() {
    const javascriptKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
    if (!javascriptKey) {
      setMessage('카카오 JavaScript 키 설정이 필요해요. 일반 공유를 이용해 주세요.');
      return;
    }

    try {
      const kakao = await loadKakaoSdk();
      if (!kakao.isInitialized()) kakao.init(javascriptKey);
      kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: '쿵짝 실험에 초대받았어요 🫶',
          description: `방 코드 ${code} · 로그인 없이 바로 참여할 수 있어요.`,
          imageUrl: `${window.location.origin}/opengraph-image`,
          link: { mobileWebUrl: inviteUrl, webUrl: inviteUrl },
        },
        buttons: [{ title: '2인 쿵짝 실험 참여하기', link: { mobileWebUrl: inviteUrl, webUrl: inviteUrl } }],
      });
    } catch (cause) {
      console.error('[co-op] Kakao share failed', cause);
      setMessage('카카오톡 공유를 열지 못했어요. 일반 공유를 이용해 주세요.');
    }
  }

  async function startExperiment() {
    if (!room || !isHost || !isFull) return;
    const { error: startError } = await supabase.from('rooms').update({ status: 'in_progress', current_question: 1 }).eq('id', room.id);
    if (startError) setMessage('실험을 시작하지 못했어요. 다시 시도해 주세요.');
    else setRoom({ ...room, status: 'in_progress', current_question: 1 });
  }

  if (room && ['in_progress', 'calculating', 'completed'].includes(room.status)) {
    const me = participants.find((participant) => participant.user_id === userId);
    if (me) return <CoOpExperiment participant={me} room={room} />;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-10">
      <motion.section animate={{ opacity: 1, scale: 1 }} className="w-full rounded-3xl border-3 border-black bg-white p-6 shadow-neo-lg" initial={{ opacity: 0, scale: 0.96 }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black tracking-widest">2-PERSON LOBBY</p>
            <h1 className="mt-2 text-3xl font-black">쿵짝 실험 대기실</h1>
          </div>
          <motion.span animate={{ y: [0, -7, 0] }} aria-hidden className="text-4xl" transition={{ duration: 1.5, repeat: Infinity }}>🫶</motion.span>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border-3 border-black bg-brand-pink p-4">
            <p className="font-black" role="alert">{error}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="neo-button bg-brand-yellow" onClick={() => window.location.reload()} type="button">다시 입장하기</button>
              <Link className="neo-button inline-flex items-center bg-white" href="/co-op">다른 방 찾기</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-2xl border-3 border-black bg-brand-yellow p-5 text-center shadow-neo">
              <p className="text-xs font-black">ROOM CODE</p>
              <p className="mt-1 text-4xl font-black tracking-[0.25em]" aria-label={`방 코드 ${code}`}>{code}</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {[0, 1].map((index) => {
                const participant = participants[index];
                return (
                  <motion.div key={participant?.id ?? index} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border-3 border-black p-4 text-center ${participant ? 'bg-brand-mint' : 'bg-neutral-100'}`} initial={{ opacity: 0, y: 12 }}>
                    <span aria-hidden className="text-3xl">{participant ? (participant.user_id === userId ? '🙋' : '🙌') : '⏳'}</span>
                    <p className="mt-2 text-sm font-black">{participant ? (participant.user_id === userId ? '나' : participant.role === 'host' ? '방장' : '초대받은 사람') : '자리 비어 있음'}</p>
                    <p className="mt-1 text-xs font-bold">{participant ? '입장 완료' : '기다리는 중'}</p>
                  </motion.div>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.p key={isFull ? 'full' : message} animate={{ opacity: 1 }} className="mt-5 text-center font-black" exit={{ opacity: 0 }} initial={{ opacity: 0 }} role="status">
                {isFull ? '두 사람이 모두 모였어요! 🎉' : message}
              </motion.p>
            </AnimatePresence>

            {isHost && !isFull ? (
              <div className="mt-5 grid gap-3">
                <button className="neo-button w-full bg-[#FEE500]" onClick={shareToKakao} type="button">카카오톡으로 초대하기</button>
                <button className="neo-button w-full bg-brand-blue" onClick={shareInvite} type="button">다른 앱으로 공유하기</button>
              </div>
            ) : null}
            {isHost && isFull ? <button className="neo-button mt-5 w-full bg-brand-pink" onClick={startExperiment} type="button">24문항 실험 시작하기</button> : null}
            {!isHost && room ? <p className="mt-5 rounded-xl border-2 border-black bg-brand-blue p-3 text-center text-sm font-bold">방장이 실험을 시작할 때까지 잠시 기다려 주세요.</p> : null}
          </>
        )}

        <Link className="mt-6 inline-flex font-black underline decoration-2 underline-offset-4" href="/co-op">← 대기실 나가기</Link>
      </motion.section>
    </main>
  );
}

type KakaoSdk = {
  init: (key: string) => void;
  isInitialized: () => boolean;
  Share: { sendDefault: (options: Record<string, unknown>) => void };
};

declare global {
  interface Window { Kakao?: KakaoSdk }
}

let kakaoSdkPromise: Promise<KakaoSdk> | null = null;

function loadKakaoSdk() {
  if (window.Kakao) return Promise.resolve(window.Kakao);
  kakaoSdkPromise ??= new Promise<KakaoSdk>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.2/kakao.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => window.Kakao ? resolve(window.Kakao) : reject(new Error('Kakao SDK를 불러오지 못했습니다.'));
    script.onerror = () => reject(new Error('Kakao SDK를 불러오지 못했습니다.'));
    document.head.appendChild(script);
  });
  return kakaoSdkPromise;
}
