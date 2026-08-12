'use client';

import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ensureAnonymousSession } from '@/lib/supabase/anonymous';
import { createClient } from '@/lib/supabase/client';

function normalizeCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 4);
}

export function CoOpEntry() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function createRoom() {
    setIsLoading(true);
    setError('');

    try {
      const userId = await ensureAnonymousSession();
      const supabase = createClient();
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({ mode: 'co_op', status: 'waiting_for_guest', host_user_id: userId })
        .select('id, code')
        .single();

      if (roomError) throw roomError;

      const { error: participantError } = await supabase.from('participants').insert({
        room_id: room.id,
        user_id: userId,
        role: 'host',
        is_ready: true,
      });

      if (participantError) throw participantError;
      router.push(`/co-op/${room.code}`);
    } catch (cause) {
      console.error('[co-op] room creation failed', cause);
      setError('방을 만들지 못했어요. 잠시 후 다시 시도해 주세요.');
      setIsLoading(false);
    }
  }

  function joinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (roomCode.length !== 4) {
      setError('4자리 방 코드를 입력해 주세요.');
      return;
    }
    router.push(`/co-op/${roomCode}`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-10">
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-3xl border-3 border-black bg-brand-blue p-6 shadow-neo-lg"
        initial={{ opacity: 0, y: 24 }}
      >
        <motion.span animate={{ rotate: [0, -8, 8, 0] }} aria-hidden className="inline-block text-5xl" transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1 }}>
          🧬
        </motion.span>
        <p className="mt-4 text-xs font-black tracking-widest">2-PERSON CO-OP</p>
        <h1 className="mt-2 text-3xl font-black">우리 쿵짝 실험하기</h1>
        <p className="mt-3 font-semibold leading-7">방을 만들고 딱 한 사람을 초대해 보세요. 두 사람이 모이면 함께 실험을 시작할 수 있어요.</p>

        <button className="neo-button mt-6 w-full bg-brand-yellow disabled:cursor-wait disabled:opacity-60" disabled={isLoading} onClick={createRoom} type="button">
          {isLoading ? '실험실 준비 중…' : '새로운 방 만들기'}
        </button>

        <div className="my-6 flex items-center gap-3" aria-hidden>
          <span className="h-0.5 flex-1 bg-black" />
          <span className="text-xs font-black">초대받았다면</span>
          <span className="h-0.5 flex-1 bg-black" />
        </div>

        <form className="flex gap-2" onSubmit={joinRoom}>
          <label className="sr-only" htmlFor="room-code">4자리 방 코드</label>
          <input
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border-3 border-black bg-white px-4 py-3 text-center text-lg font-black uppercase tracking-[0.3em] shadow-neo outline-none"
            id="room-code"
            maxLength={4}
            onChange={(event) => setRoomCode(normalizeCode(event.target.value))}
            placeholder="AB12"
            value={roomCode}
          />
          <button className="neo-button bg-brand-mint" type="submit">입장</button>
        </form>

        {error ? <p className="mt-4 rounded-xl border-2 border-black bg-brand-pink p-3 text-sm font-bold" role="alert">{error}</p> : null}

        <Link className="mt-6 inline-flex font-black underline decoration-2 underline-offset-4" href="/">← 홈으로</Link>
      </motion.section>
    </main>
  );
}
