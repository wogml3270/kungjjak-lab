import type { SoloProgressAnswer } from '@/lib/solo/progress';

export type SoloResult = {
  id: string;
  mbti: string;
  clarity: number;
  axisScores: Record<'EI' | 'SN' | 'TF' | 'JP', number>;
  answers: Record<string, SoloProgressAnswer>;
  completedAt: string;
};

export const SOLO_RESULT_PREFIX = 'kungjjak_solo_result:';

export function saveLocalSoloResult(result: SoloResult) {
  window.localStorage.setItem(`${SOLO_RESULT_PREFIX}${result.id}`, JSON.stringify(result));
}

export function readLocalSoloResult(id: string): SoloResult | null {
  try {
    const raw = window.localStorage.getItem(`${SOLO_RESULT_PREFIX}${id}`);
    return raw ? (JSON.parse(raw) as SoloResult) : null;
  } catch {
    return null;
  }
}
