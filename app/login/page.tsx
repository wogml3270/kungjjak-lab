import Link from 'next/link';
import { SocialLoginButtons } from '@/components/auth/social-login-buttons';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-10">
      <section className="w-full rounded-3xl border-3 border-black bg-brand-mint p-6 shadow-neo-lg">
        <span aria-hidden className="text-6xl">
          🔐
        </span>
        <p className="mt-5 text-xs font-black tracking-[0.18em]">
          KUNGJJAK ACCOUNT
        </p>
        <h1 className="mt-2 text-3xl font-black">검사 기록을 보관해요</h1>
        <p className="mt-3 text-sm font-semibold leading-6">
          로그인하면 Solo 결과를 날짜별로 모아보고 성향 변화를 확인할 수 있어요.
        </p>
        <SocialLoginButtons />
        <Link
          className="mt-6 block text-center text-sm font-black underline underline-offset-4"
          href="/"
        >
          로그인 없이 둘러보기
        </Link>
      </section>
    </main>
  );
}
