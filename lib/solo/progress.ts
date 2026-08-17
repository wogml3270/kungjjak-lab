import type { LikertValue } from '@/components/LikertScale';

export type SoloProgressAnswer = {
  positiveTrait: 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';
  value: LikertValue;
};

export type SoloProgress = {
  answers: Record<string, SoloProgressAnswer>;
  currentIndex: number;
  questionIds: string[];
  updatedAt: string;
  version: 1;
};

export const SOLO_PROGRESS_KEY = 'kungjjak_solo_progress';

export function readSoloProgress(): SoloProgress | null {
  try {
    const raw = window.localStorage.getItem(SOLO_PROGRESS_KEY);
    if (!raw) return null;

    const progress = JSON.parse(raw) as Partial<SoloProgress>;
    const valid =
      progress.version === 1 &&
      Array.isArray(progress.questionIds) &&
      progress.questionIds.length === 24 &&
      typeof progress.currentIndex === 'number' &&
      progress.currentIndex >= 0 &&
      progress.currentIndex < 24 &&
      typeof progress.answers === 'object' &&
      progress.answers !== null;

    if (!valid) {
      clearSoloProgress();
      return null;
    }

    return progress as SoloProgress;
  } catch {
    clearSoloProgress();
    return null;
  }
}

export function saveSoloProgress(progress: Omit<SoloProgress, 'updatedAt' | 'version'>) {
  const value: SoloProgress = {
    ...progress,
    updatedAt: new Date().toISOString(),
    version: 1,
  };
  window.localStorage.setItem(SOLO_PROGRESS_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('solo-progress-changed'));
}

export function clearSoloProgress() {
  window.localStorage.removeItem(SOLO_PROGRESS_KEY);
  window.dispatchEvent(new CustomEvent('solo-progress-changed'));
}
