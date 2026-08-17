# 쿵짝랩 v1

> 혼자서도, 둘이서도 착착 맞는 성향 탐구소

쿵짝랩은 나의 MBTI 성향을 살펴보고, 두 사람이 같은 질문에 실시간으로 답하며 서로의 공감대와 차이를 발견하는 모바일 퍼스트 웹 서비스입니다.

현재 프로젝트는 **v1 (Phase 1)** 기능 개발을 마친 중간 기준 버전입니다. **v2부터는 Phase 2 콘텐츠인 ‘사랑의 판결 받기’**를 개발합니다.

## v1 주요 기능

### Solo MBTI

- 52문항 풀에서 성향별로 균형 있게 추출한 24문항 제공
- `매우 그렇다`부터 `매우 그렇지 않다`까지 5점 척도 사용
- 검사 도중 자동 저장, 새로고침 후 이어하기, 중단 확인 지원
- MBTI와 네 가지 성향 비율, 성향 표현 스타일 결과 제공
- 로그인 사용자의 결과를 마이페이지에 보관하고 드로어로 조회·삭제

### 2인 멀티버스

- 호스트가 4자리 방 코드와 초대 링크를 생성해 한 명의 게스트 초대
- 카카오톡 공유, Web Share API, 링크 복사 지원
- 두 사람이 동일한 24문항에 실시간으로 답변
- 상대방의 실제 선택값은 숨기고 답변 완료 여부만 공개
- 양쪽 답변이 모두 저장되면 다음 문항으로 자동 진행
- 응답 차이로 쿵짝 점수, 성향 밸런스, 공감 통계, 대화 포인트 계산
- 결과에서 프로필 사진과 호스트·게스트 역할 표시
- 완료 기록을 양쪽 사용자의 마이페이지에 보관

### 계정과 마이페이지

- Google·Kakao 소셜 로그인 및 비로그인 익명 참여 지원
- 최초 로그인 시 서비스 닉네임 설정
- 닉네임은 최대 10자이며 변경 후 7일간 재변경 제한
- 프로필, 가입일, 최근 로그인, Solo·2인 플레이 기록 제공
- 개인정보처리방침과 이용약관을 포함한 공통 푸터 제공

## v2 — 사랑의 판결 받기

두 사람의 갈등이나 고민을 여러 사람과 함께 유쾌하게 풀어보는 콘텐츠입니다.

- 운영자가 준비한 사건 12종 또는 사용자가 직접 작성한 사건으로 재판 생성
- 초대 링크를 통한 다수 배심원 투표와 선택 의견 수집
- 사건 작성자만 중간 집계를 보고 투표를 종료하는 비공개 재판
- 사용자 사건은 관리자 승인 후에만 공개 가능한 검수 구조
- 관리자 전용 승인·반려·숨김 처리 화면과 처리 이력 저장
- 추후 공개 재판소, 신고, 최종 판결문과 합의 가이드 확장

## 기술 스택

| 영역    | 기술                                   |
| ------- | -------------------------------------- |
| Web     | Next.js App Router, React, TypeScript  |
| UI      | Tailwind CSS, Framer Motion            |
| Backend | Supabase Postgres, Auth, Realtime, RLS |
| Deploy  | Vercel, GitHub Actions                 |

## 로컬 실행

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Supabase 초기 구성은 `supabase/schema.sql`, `supabase/seed.sql` 순서로 적용합니다. 운영 중인 DB에는 전체 스키마를 다시 실행하지 않고 `supabase/migrations/`의 증분 SQL만 적용합니다.

## 환경 변수

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY`는 서버 전용이며 클라이언트에 노출하면 안 됩니다.

## 문서

- [제품 요구사항 v2](docs/product/product-requirements-v2.pdf)
- [2인 실험 시퀀스](docs/architecture/co-op-sequence.png)
- [디자인 시스템](docs/design/design-system.md)
- [날짜별 작업 일지](docs/작업일지/)

## 만든 사람

박재희 · [GitHub](https://github.com/wogml3270/) · [Blog](https://j-fe-blog.vercel.app/)
