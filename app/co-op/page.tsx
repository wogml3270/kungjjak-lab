import Link from 'next/link';

export default function CoOpPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-10">
      <section className="w-full rounded-3xl border-3 border-black bg-brand-blue p-6 shadow-neo-lg">
        <span aria-hidden className="text-5xl">🧬</span>
        <p className="mt-4 text-xs font-black tracking-widest">CO-OP MODE</p>
        <h1 className="mt-2 text-3xl font-black">우리 쿵짝 실험하기</h1>
        <p className="mt-3 font-semibold leading-7">다음 작업에서 방 생성과 초대 플로우가 연결됩니다.</p>
        <Link className="mt-6 inline-flex rounded-xl border-3 border-black bg-white px-4 py-3 font-black shadow-neo" href="/">
          ← 홈으로
        </Link>
      </section>
    </main>
  );
}
