'use client';
import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { CourtTemplate } from '@/lib/court/types';

export function CourtCreateForm({
  nickname,
  template,
  userId,
}: {
  nickname: string;
  template: CourtTemplate | null;
  userId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const payload = {
      template_id: template?.id ?? null,
      creator_user_id: userId,
      source_type: template ? 'template' : 'custom',
      title: String(form.get('title')).trim(),
      summary: String(form.get('summary')).trim(),
      plaintiff_name: String(form.get('plaintiff_name')).trim(),
      defendant_name: String(form.get('defendant_name')).trim(),
      plaintiff_claim: String(form.get('plaintiff_claim')).trim(),
      defendant_claim: String(form.get('defendant_claim')).trim(),
      visibility: 'private',
      moderation_status: 'private',
    };
    const { data, error: insertError } = await createClient()
      .from('court_cases')
      .insert(payload)
      .select('invite_code')
      .single();
    if (insertError || !data) {
      console.error(insertError);
      setError('재판을 만들지 못했어요. 입력 내용을 확인해 주세요.');
      setLoading(false);
      return;
    }
    router.push(`/court/${data.invite_code}`);
  }
  return (
    <motion.form
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 rounded-3xl border-3 border-black bg-white p-6 shadow-neo-lg"
      initial={{ opacity: 0, y: 18 }}
      onSubmit={submit}
    >
      <p className="text-xs font-black tracking-widest">
        {template ? 'CURATED CASE' : 'CUSTOM CASE'}
      </p>
      <h1 className="mt-2 text-3xl font-black">
        {template ? `${template.emoji} 사건 준비하기` : '우리 사건 접수하기'}
      </h1>
      <p className="mt-2 text-sm font-bold text-neutral-600">
        처음에는 초대 링크를 받은 사람만 참여할 수 있어요.
      </p>
      <Field
        defaultValue={template?.title}
        label="사건 제목"
        maxLength={80}
        minLength={5}
        name="title"
      />
      <Area
        defaultValue={template?.summary}
        label="무슨 일이 있었나요?"
        maxLength={500}
        minLength={10}
        name="summary"
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          defaultValue={nickname}
          label="원고 이름"
          maxLength={10}
          minLength={1}
          name="plaintiff_name"
        />
        <Field label="피고 이름" maxLength={10} minLength={1} name="defendant_name" />
      </div>
      <Area
        defaultValue={template?.plaintiff_claim}
        label="원고 주장"
        maxLength={1000}
        minLength={10}
        name="plaintiff_claim"
      />
      <Area
        defaultValue={template?.defendant_claim}
        label="피고 주장"
        maxLength={1000}
        minLength={10}
        name="defendant_claim"
      />
      {error ? (
        <p className="mt-4 rounded-xl border-2 border-black bg-brand-pink p-3 text-sm font-black">
          {error}
        </p>
      ) : null}
      <button
        className="neo-button mt-6 w-full bg-brand-yellow disabled:opacity-50"
        disabled={loading}
        type="submit"
      >
        {loading ? '재판 접수 중…' : '재판방 만들기'}
      </button>
    </motion.form>
  );
}
function Field({
  defaultValue,
  label,
  maxLength,
  minLength,
  name,
}: {
  defaultValue?: string;
  label: string;
  maxLength: number;
  minLength: number;
  name: string;
}) {
  return (
    <label className="mt-5 block text-sm font-black">
      {label}
      <input
        className="mt-2 w-full rounded-xl border-3 border-black bg-white px-4 py-3 font-bold shadow-[2px_2px_0_#000]"
        defaultValue={defaultValue}
        maxLength={maxLength}
        minLength={minLength}
        name={name}
        required
      />
    </label>
  );
}
function Area({
  defaultValue,
  label,
  maxLength,
  minLength,
  name,
}: {
  defaultValue?: string;
  label: string;
  maxLength: number;
  minLength: number;
  name: string;
}) {
  return (
    <label className="mt-5 block text-sm font-black">
      {label}
      <textarea
        className="mt-2 min-h-28 w-full resize-y rounded-xl border-3 border-black bg-white px-4 py-3 font-bold shadow-[2px_2px_0_#000]"
        defaultValue={defaultValue}
        maxLength={maxLength}
        minLength={minLength}
        name={name}
        required
      />
    </label>
  );
}
