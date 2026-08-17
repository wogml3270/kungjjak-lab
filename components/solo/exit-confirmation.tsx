'use client';

import { motion } from 'framer-motion';

type ExitConfirmationProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function ExitConfirmation({ onCancel, onConfirm }: ExitConfirmationProps) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      aria-labelledby="exit-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5"
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      role="dialog"
    >
      <motion.section
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl border-3 border-black bg-brand-bg p-6 shadow-neo-lg"
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
      >
        <span aria-hidden className="text-5xl">
          🧷
        </span>
        <h2 className="mt-4 text-2xl font-black" id="exit-dialog-title">
          검사를 중단할까요?
        </h2>
        <p className="mt-3 text-sm font-semibold leading-6">
          지금까지의 답변은 저장됩니다. 홈에서 언제든 이어서 진행할 수 있어요.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button className="neo-button bg-white" onClick={onCancel} type="button">
            계속 검사하기
          </button>
          <button className="neo-button bg-brand-yellow" onClick={onConfirm} type="button">
            나가기
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
}
