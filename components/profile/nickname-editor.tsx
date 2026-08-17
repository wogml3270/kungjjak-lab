'use client';
import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';

export function NicknameEditor({
  initialNickname,
  nextChangeAt,
}: {
  initialNickname: string;
  nextChangeAt: string | null;
}) {
  const [nickname, setNickname] = useState(initialNickname);
  const [savedNickname, setSavedNickname] = useState(initialNickname);
  const [availableAt, setAvailableAt] = useState(nextChangeAt);
  const [message, setMessage] = useState('');
  const locked = Boolean(availableAt && Date.parse(availableAt) > Date.now());
  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    const response = await fetch('/api/profile/nickname', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nickname }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error);
      if (data.availableAt) setAvailableAt(data.availableAt);
      return;
    }
    setSavedNickname(data.nickname);
    setNickname(data.nickname);
    setAvailableAt(new Date(Date.parse(data.changedAt) + 7 * 86400000).toISOString());
    setMessage('닉네임을 저장했어요.');
  }
  return (
    <motion.form
      className="col-span-2 rounded-2xl border-2 border-black bg-brand-yellow p-4"
      onSubmit={submit}
      whileHover={{ y: -2 }}
    >
      <label className="text-xs font-black" htmlFor="profile-nickname">
        서비스 닉네임
      </label>
      <div className="mt-2 flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-xl border-2 border-black bg-white px-3 py-2 font-black"
          disabled={locked}
          id="profile-nickname"
          maxLength={10}
          onChange={(event) => setNickname(event.target.value)}
          value={nickname}
        />
        <button
          className="rounded-xl border-2 border-black bg-brand-mint px-3 text-xs font-black disabled:opacity-40"
          disabled={locked || nickname.trim() === savedNickname}
          type="submit"
        >
          변경
        </button>
      </div>
      <p className="mt-2 text-[10px] font-bold">
        {locked && availableAt
          ? `${new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(availableAt))}부터 변경 가능`
          : '최대 10자 · 변경 후 7일 동안 다시 바꿀 수 없어요.'}
      </p>
      {message ? <p className="mt-1 text-xs font-black">{message}</p> : null}
    </motion.form>
  );
}
