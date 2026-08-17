'use client';

import { ReactNode, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';

export function LoginRequiredLink({
  children,
  className,
  href,
  reason = '이 기능은 로그인 후 이용할 수 있어요.',
  signedIn,
  ...props
}: {
  children: ReactNode;
  className?: string;
  href: string;
  reason?: string;
  signedIn: boolean;
} & Omit<
  React.ComponentProps<typeof Link>,
  'children' | 'className' | 'href'
>) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', close);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', close);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (signedIn) {
    return (
      <Link className={className} href={href} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <>
      <button
        aria-label={props['aria-label']}
        className={className}
        onClick={() => setOpen(true)}
        title={props.title}
        type="button"
      >
        {children}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            animate={{ opacity: 1 }}
            aria-labelledby="login-required-title"
            aria-modal="true"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            role="dialog"
          >
            <motion.section
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-sm rounded-3xl border-3 border-black bg-brand-mint p-6 shadow-neo-lg"
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              onClick={(event) => event.stopPropagation()}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            >
              <div className="flex items-start justify-between gap-4">
                <span aria-hidden className="text-5xl">
                  🔑
                </span>
                <button
                  aria-label="로그인 안내 닫기"
                  className="flex size-10 items-center justify-center rounded-full border-2 border-black bg-white text-xl font-black shadow-[2px_2px_0_#000]"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  ×
                </button>
              </div>
              <p className="mt-5 text-xs font-black tracking-widest">
                MEMBERS ONLY
              </p>
              <h2
                className="mt-2 text-2xl font-black"
                id="login-required-title"
              >
                로그인하고 계속할까요?
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6">{reason}</p>
              <Link
                className="neo-button mt-6 flex w-full items-center justify-center bg-brand-yellow"
                href={`/login?next=${encodeURIComponent(href)}`}
              >
                카카오·Google로 로그인
              </Link>
              <button
                className="mt-4 w-full text-sm font-black underline underline-offset-4"
                onClick={() => setOpen(false)}
                type="button"
              >
                지금은 둘러볼게요
              </button>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
