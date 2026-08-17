import type { Metadata } from 'next';
import { LegalPage } from '@/components/layout/legal-page';
export const metadata: Metadata = { title: '개인정보처리방침' };
export default function PrivacyPage() {
  return (
    <LegalPage title="개인정보처리방침">
      <section>
        <h2 className="text-lg font-black">1. 수집하는 정보</h2>
        <p>
          소셜 로그인 시 제공자가 허용한 이름, 이메일, 프로필 사진과 서비스 이용 과정에서 닉네임,
          검사 답변, 결과, 접속 기록을 처리합니다. 비로그인 2인 실험에서는 익명 식별자와 입력한 임시
          이름을 사용합니다.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black">2. 이용 목적</h2>
        <p>
          로그인, 검사 진행, 결과 분석·보관, 2인 실시간 실험, 서비스 안정성 개선을 위해 사용합니다.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black">3. 보관 및 삭제</h2>
        <p>
          회원 기록은 사용자가 삭제하거나 계정을 탈퇴할 때까지 보관합니다. 사용자가 결과 삭제 기능을
          이용하면 해당 기록 또는 자신의 목록 연결이 제거됩니다.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black">4. 외부 서비스</h2>
        <p>
          인증과 데이터 저장에는 Supabase, 서비스 호스팅에는 Vercel, 소셜 로그인에는 Google·Kakao를
          사용합니다.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black">5. 문의</h2>
        <p>개인정보 관련 문의: wogml3270@gmail.com</p>
      </section>
    </LegalPage>
  );
}
