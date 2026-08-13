'use client';
import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export function NicknameOnboarding({ suggestedName }: { suggestedName: string }) {
  const router = useRouter(); const [nickname, setNickname] = useState(suggestedName.slice(0, 10)); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setSaving(true); const response = await fetch('/api/profile/nickname', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nickname }) }); const data = await response.json(); if (!response.ok) { setError(data.error); setSaving(false); return; } router.refresh(); }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5"><motion.form animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm rounded-3xl border-3 border-black bg-brand-yellow p-6 shadow-neo-lg" initial={{ opacity: 0, scale: .9 }} onSubmit={submit}><span aria-hidden className="text-5xl">👋</span><h2 className="mt-3 text-2xl font-black">쿵짝랩에서 사용할 이름을 정해요</h2><p className="mt-2 text-sm font-bold leading-6">2인 실험과 기록에 표시돼요. 설정 후에는 7일에 한 번 바꿀 수 있어요.</p><input autoFocus className="mt-5 w-full rounded-xl border-3 border-black bg-white px-4 py-3 font-black shadow-neo" maxLength={10} onChange={(event) => setNickname(event.target.value)} placeholder="최대 10자" required value={nickname} />{error ? <p className="mt-2 text-sm font-black text-red-700">{error}</p> : null}<button className="neo-button mt-4 w-full bg-brand-mint" disabled={saving} type="submit">{saving ? '저장 중…' : '이 이름으로 시작하기'}</button></motion.form></div>;
}
