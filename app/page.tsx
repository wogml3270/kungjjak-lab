import { ServiceCard } from '@/components/home/service-card';
import { SoloResumeCard } from '@/components/home/solo-resume-card';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { normalizeProfileImage } from '@/lib/profile-image';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const signedIn = Boolean(user && !user.is_anonymous);
  const profileImageCandidate = user?.user_metadata.avatar_url ?? user?.user_metadata.picture;
  const profileImage = normalizeProfileImage(profileImageCandidate);
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-12 pt-8">
      <nav className="mb-5 flex items-center justify-end gap-3">{!signedIn ? <span className="login-nudge relative rounded-xl border-2 border-black bg-brand-mint px-3 py-2 text-xs font-black shadow-[2px_2px_0_#000] after:absolute after:-right-2 after:top-3 after:size-3 after:rotate-45 after:border-r-2 after:border-t-2 after:border-black after:bg-brand-mint">로그인하면 결과를 모아볼 수 있어요</span> : null}<Link aria-label={signedIn ? '마이페이지' : '로그인'} className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-black bg-white shadow-neo" href={signedIn ? '/mypage' : '/login'} title={signedIn ? '마이페이지' : '로그인'}>{signedIn ? <img alt="내 프로필" className="size-full object-cover" src={profileImage} /> : <svg aria-hidden="true" className="size-7" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><g fill="currentColor"><path fillRule="evenodd" d="M22 8.293c0 3.476-2.83 6.294-6.32 6.294c-.636 0-2.086-.146-2.791-.732l-.882.878c-.519.517-.379.669-.148.919c.096.105.208.226.295.399c0 0 .735 1.024 0 2.049c-.441.585-1.676 1.404-3.086 0l-.294.292s.881 1.025.147 2.05c-.441.585-1.617 1.17-2.646.146l-1.028 1.024c-.706.703-1.568.293-1.91 0l-.883-.878c-.823-.82-.343-1.708 0-2.05l7.642-7.61s-.735-1.17-.735-2.78c0-3.476 2.83-6.294 6.32-6.294S22 4.818 22 8.293" clipRule="evenodd" opacity=".5" /><path d="M17.885 8.294a2.2 2.2 0 0 1-2.204 2.195a2.2 2.2 0 0 1-2.204-2.195a2.2 2.2 0 0 1 2.204-2.196a2.2 2.2 0 0 1 2.204 2.196" /></g></svg>}</Link></nav>
      <header className="relative overflow-hidden rounded-3xl border-3 border-black bg-brand-yellow p-6 shadow-neo-lg">
        <span className="absolute -right-3 -top-5 rotate-12 text-7xl" aria-hidden>
          🧪
        </span>
        <p className="relative text-sm font-black tracking-[0.18em]">KUNGJJAK LAB</p>
        <h1 className="relative mt-3 max-w-[270px] text-4xl font-black leading-tight tracking-[-0.04em]">
          우리 둘의 쿵짝,
          <br />몇 점일까?
        </h1>
        <p className="relative mt-4 max-w-[290px] text-sm font-bold leading-6">
          혼자 성향을 발견하고, 연인과 같은 질문에 답하며 서로를 더 알아가요.
        </p>
      </header>

      <SoloResumeCard />

      <section aria-labelledby="services-title" className="mt-9 space-y-6">
        <div className="flex items-end justify-between px-1">
          <div>
            <p className="text-xs font-black text-neutral-600">TODAY'S EXPERIMENT</p>
            <h2 className="mt-1 text-2xl font-black" id="services-title">
              어떤 실험을 해볼까요?
            </h2>
          </div>
          <span aria-hidden className="text-3xl">✨</span>
        </div>

        <ServiceCard
          badge="Solo"
          description="24개의 짧은 질문으로 나의 연애 MBTI와 행동 가이드를 확인해요."
          emoji="🔬"
          href="/solo"
          label="Solo MBTI 검사 시작하기 →"
          theme="pink"
          title="나부터 탐구하기"
        />
        <ServiceCard
          badge="둘이서 실시간"
          description="방을 만들고 연인을 초대해 두 사람의 쿵짝 스코어를 측정해요."
          emoji="🧬"
          href="/co-op"
          label="2인 멀티버스 방 만들기 →"
          theme="blue"
          title="우리 쿵짝 실험하기"
        />
        <ServiceCard
          badge="PHASE 2"
          description="커플 갈등을 유쾌한 판결문으로 풀어보는 연애 재판소를 준비 중이에요."
          emoji="⚖️"
          label="연애 재판소 · 오픈 예정"
          theme="mint"
          title="사랑의 판결 받기"
        />
      </section>

      <footer className="mt-10 border-t-2 border-black/20 px-2 pt-6 text-center text-xs font-bold text-neutral-600">
        <p>쿵짝랩 · 혼자서도, 둘이서도 착착 맞는 성향 탐구소</p>
        <p className="mt-3 text-black">Made by 박재희</p>
        <nav aria-label="개발자 링크" className="mt-2 flex justify-center gap-4">
          <a className="underline underline-offset-4" href="https://github.com/wogml3270/kungjjak-lab" rel="noreferrer" target="_blank">GitHub</a>
          <a className="underline underline-offset-4" href="https://j-fe-blog.vercel.app/" rel="noreferrer" target="_blank">Blog</a>
          <a className="underline underline-offset-4" href="mailto:wogml3270@gmail.com" rel="noreferrer" target="_blank">Email</a>
          <a className="underline underline-offset-4" href="https://wogml3270.notion.site/cf22a7bca5ec45a7815997c128d2e0ec" rel="noreferrer" target="_blank">Notion</a>
        </nav>
      </footer>
    </main>
  );
}
