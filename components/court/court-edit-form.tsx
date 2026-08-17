'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { CourtCase } from '@/lib/court/types';

export function CourtEditForm({
  courtCase,
  evidence,
}: {
  courtCase: CourtCase;
  evidence: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const values = {
      title: String(form.get('title')).trim(),
      summary: String(form.get('summary')).trim(),
      plaintiff_name: String(form.get('plaintiff_name')).trim(),
      defendant_name: String(form.get('defendant_name')).trim(),
      plaintiff_claim: String(form.get('plaintiff_claim')).trim(),
      defendant_claim: String(form.get('defendant_claim')).trim(),
      moderation_status: 'private',
      moderation_reason: null,
      updated_at: new Date().toISOString(),
    };
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('court_cases')
      .update(values)
      .eq('id', courtCase.id);
    if (updateError) {
      setError('사건 내용을 저장하지 못했어요.');
      setSaving(false);
      return;
    }
    await supabase.from('court_rounds').delete().eq('case_id', courtCase.id);
    const evidenceText = String(form.get('evidence') ?? '').trim();
    const rounds = [
      {
        case_id: courtCase.id,
        round_order: 1,
        round_type: 'briefing',
        title: '사건 브리핑',
        content: values.summary,
        emoji: '📢',
      },
      {
        case_id: courtCase.id,
        round_order: 2,
        round_type: 'plaintiff',
        title: `${values.plaintiff_name}의 진술`,
        content: values.plaintiff_claim,
        emoji: '🙋',
      },
      {
        case_id: courtCase.id,
        round_order: 3,
        round_type: 'defendant',
        title: `${values.defendant_name}의 반박`,
        content: values.defendant_claim,
        emoji: '🙆',
      },
      ...(evidenceText
        ? [
            {
              case_id: courtCase.id,
              round_order: 4,
              round_type: 'evidence',
              title: '추가 증거',
              content: evidenceText,
              emoji: '🔎',
              evidence_label: '작성자가 제출한 증거',
            },
          ]
        : []),
      {
        case_id: courtCase.id,
        round_order: 6,
        round_type: 'verdict',
        title: '최종 판결',
        content: '공개된 진술과 증거를 바탕으로 마지막 판단을 내려주세요.',
        emoji: '⚖️',
      },
    ];
    const { error: roundError } = await supabase
      .from('court_rounds')
      .insert(rounds);
    if (roundError) {
      setError('사건은 저장됐지만 라운드 재구성에 실패했어요.');
      setSaving(false);
      return;
    }
    router.push('/court/manage');
    router.refresh();
  }
  return (
    <form
      className="mt-6 rounded-3xl border-3 border-black bg-white p-6 shadow-neo-lg"
      onSubmit={submit}
    >
      <p className="text-xs font-black tracking-widest">EDIT CASE</p>
      <h1 className="mt-2 text-3xl font-black">사건 내용 수정</h1>
      <Field defaultValue={courtCase.title} label="사건 제목" name="title" />
      <Area defaultValue={courtCase.summary} label="사건 개요" name="summary" />
      <div className="grid grid-cols-2 gap-3">
        <Field
          defaultValue={courtCase.plaintiff_name}
          label="원고 이름"
          name="plaintiff_name"
          short
        />
        <Field
          defaultValue={courtCase.defendant_name}
          label="피고 이름"
          name="defendant_name"
          short
        />
      </div>
      <Area
        defaultValue={courtCase.plaintiff_claim}
        label="원고 주장"
        name="plaintiff_claim"
      />
      <Area
        defaultValue={courtCase.defendant_claim}
        label="피고 주장"
        name="defendant_claim"
      />
      <Area
        defaultValue={evidence}
        label="추가 증거 또는 정황 (선택)"
        name="evidence"
        required={false}
      />
      {error ? (
        <p className="mt-4 rounded-xl border-2 border-black bg-brand-pink p-3 text-sm font-black">
          {error}
        </p>
      ) : null}
      <button
        className="neo-button mt-6 w-full bg-brand-yellow"
        disabled={saving}
        type="submit"
      >
        {saving ? '저장 중…' : '수정 내용 저장'}
      </button>
    </form>
  );
}

function Field({
  defaultValue,
  label,
  name,
  short = false,
}: {
  defaultValue: string;
  label: string;
  name: string;
  short?: boolean;
}) {
  return (
    <label className="mt-5 block text-sm font-black">
      {label}
      <input
        className="mt-2 w-full rounded-xl border-3 border-black px-4 py-3 font-bold"
        defaultValue={defaultValue}
        maxLength={short ? 10 : 80}
        minLength={1}
        name={name}
        required
      />
    </label>
  );
}
function Area({
  defaultValue,
  label,
  name,
  required = true,
}: {
  defaultValue: string;
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <label className="mt-5 block text-sm font-black">
      {label}
      <textarea
        className="mt-2 min-h-28 w-full rounded-xl border-3 border-black px-4 py-3 font-bold"
        defaultValue={defaultValue}
        maxLength={1000}
        minLength={required ? 10 : 0}
        name={name}
        required={required}
      />
    </label>
  );
}
