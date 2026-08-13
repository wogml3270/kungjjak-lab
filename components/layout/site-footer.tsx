import Link from 'next/link';

export function SiteFooter() {
  return <footer className="mx-auto mt-10 max-w-md border-t-2 border-black/20 px-7 pb-10 pt-6 text-center text-xs font-bold text-neutral-600">
    <p>쿵짝랩 · 혼자서도, 둘이서도 착착 맞는 성향 탐구소</p>
    <p className="mt-3 text-black">Made by 박재희</p>
    <nav aria-label="개발자 링크" className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2">
      <a className="underline underline-offset-4" href="https://github.com/wogml3270/kungjjak-lab" rel="noreferrer" target="_blank">GitHub</a>
      <a className="underline underline-offset-4" href="https://j-fe-blog.vercel.app/" rel="noreferrer" target="_blank">Blog</a>
      <a className="underline underline-offset-4" href="https://wogml3270.notion.site/cf22a7bca5ec45a7815997c128d2e0ec" rel="noreferrer" target="_blank">Notion</a>
      <a className="underline underline-offset-4" href="mailto:wogml3270@gmail.com">Email</a>
    </nav>
    <nav aria-label="정책 링크" className="mt-3 flex justify-center gap-4">
      <Link className="underline underline-offset-4" href="/privacy">개인정보처리방침</Link>
      <Link className="underline underline-offset-4" href="/terms">이용약관</Link>
    </nav>
  </footer>;
}
