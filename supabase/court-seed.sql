insert into public.court_templates (slug, category, title, summary, plaintiff_claim, defendant_claim, emoji, difficulty, is_featured) values
('reply-speed', '연락', '답장이 세 시간 늦으면 관심이 식은 걸까?', '연락 속도를 애정의 크기로 봐야 하는지를 두고 벌어진 사건입니다.', '바쁜 건 이해하지만 세 시간 동안 짧은 답장 하나도 없는 건 서운하다.', '일할 때는 휴대폰을 보지 않을 뿐이고 답장 속도가 애정과 같지는 않다.', '📱', '가볍게', true),
('anniversary', '기념일', '100일 기념일을 잊은 것은 유죄일까?', '한 사람은 특별한 날을 준비했지만 다른 사람은 날짜를 완전히 잊었습니다.', '기념일을 기억하는 건 상대를 소중히 여기는 최소한의 표현이다.', '매일 잘하는 것이 특정 날짜를 외우는 것보다 더 중요하다.', '🎂', '진지하게', true),
('friend-meeting', '질투', '이성 친구와 단둘이 식사해도 괜찮을까?', '오래된 이성 친구와의 단둘이 만남을 어디까지 허용할지 묻는 사건입니다.', '연인이 불편하다고 했는데도 단둘이 만나는 건 배려가 부족하다.', '오래된 친구 관계까지 연애 때문에 포기하라는 것은 과도한 통제다.', '👀', '뜨겁게', true),
('date-cost', '비용', '데이트 비용은 정확히 반반이어야 할까?', '소득 차이가 있는 두 사람이 데이트 비용 분담 기준을 두고 다툽니다.', '공평하려면 사용한 비용을 매번 정확히 절반씩 부담해야 한다.', '소득과 상황이 다른데 무조건 반반이 오히려 불공평할 수 있다.', '💳', '진지하게', false),
('game-schedule', '취미', '연인과의 약속보다 게임 일정이 먼저일까?', '미리 잡힌 게임 길드 일정과 갑작스러운 데이트 요청이 겹쳤습니다.', '게임보다 실제 연인과 보내는 시간을 우선해야 한다.', '먼저 약속한 사람들과의 일정도 똑같이 존중받아야 한다.', '🎮', '가볍게', true),
('sns-photo', 'SNS', '연애 사진을 SNS에 올리지 않으면 숨기는 걸까?', '한 사람은 공개 연애를 원하지만 다른 사람은 SNS에 사생활을 올리지 않습니다.', '사진 한 장도 올리지 않는 건 관계를 숨기려는 것처럼 느껴진다.', 'SNS 공개 여부는 애정이 아니라 개인의 사생활 방식이다.', '📸', '가볍게', false),
('travel-plan', '여행', '여행 계획은 꼼꼼하게 정해야 할까?', '분 단위 계획을 원하는 사람과 현지에서 정하자는 사람이 함께 여행을 준비합니다.', '숙소와 동선은 미리 정해야 시간과 돈을 낭비하지 않는다.', '계획에 묶이면 여행의 즉흥적인 재미가 사라진다.', '✈️', '가볍게', false),
('late-date', '약속', '데이트에 20분 늦는 것은 큰 잘못일까?', '반복되는 지각을 성격 차이로 이해할 수 있는지 판단하는 사건입니다.', '상습 지각은 내 시간을 존중하지 않는 행동이다.', '20분 정도는 상황에 따라 이해할 수 있고 만난 뒤가 더 중요하다.', '⏰', '진지하게', false),
('phone-check', '신뢰', '연인끼리 휴대폰을 보여줘야 할까?', '신뢰를 증명하기 위한 휴대폰 공개 요구가 정당한지 묻습니다.', '숨길 것이 없다면 서로 휴대폰을 보여주는 데 문제가 없어야 한다.', '연애 중에도 개인의 대화와 사생활은 보호받아야 한다.', '🔐', '뜨겁게', true),
('gift-reaction', '표현', '선물이 마음에 안 들어도 좋아해야 할까?', '정성껏 준비한 선물에 솔직한 반응을 보여도 되는지 다툽니다.', '상대의 정성을 생각해 먼저 기쁘게 반응하는 것이 예의다.', '가까운 사이일수록 취향을 솔직하게 말해야 다음 선물이 좋아진다.', '🎁', '가볍게', false),
('weekend-alone', '시간', '주말 하루는 혼자 보내겠다는 연인, 유죄일까?', '평일에 만나기 어려운 커플 중 한 사람이 주말의 개인 시간을 요구합니다.', '만날 수 있는 날이 주말뿐인데 혼자 쉬겠다는 건 서운하다.', '건강한 연애를 위해 혼자 회복하는 시간도 필요하다.', '🛋️', '진지하게', false),
('ex-photo', '과거', '전 연인 사진을 보관하는 것은 괜찮을까?', '휴대폰과 클라우드에 남아 있는 과거 연애 사진을 발견했습니다.', '현재 연인을 배려한다면 전 연인의 사진은 정리해야 한다.', '과거 기록을 보관하는 것과 미련이 남은 것은 다른 문제다.', '🖼️', '뜨겁게', false)
on conflict (slug) do update set category=excluded.category, title=excluded.title, summary=excluded.summary, plaintiff_claim=excluded.plaintiff_claim, defendant_claim=excluded.defendant_claim, emoji=excluded.emoji, difficulty=excluded.difficulty, is_featured=excluded.is_featured, is_active=true;

insert into public.court_rounds (template_id, round_order, round_type, title, content, emoji)
select id, 1, 'briefing', '사건 브리핑', summary, '📢' from public.court_templates
union all
select id, 2, 'plaintiff', '원고의 첫 진술', plaintiff_claim, '🙋' from public.court_templates
union all
select id, 3, 'defendant', '피고의 반박', defendant_claim, '🙆' from public.court_templates
union all
select id, 6, 'verdict', '최종 판결', '지금까지 공개된 진술과 증거를 바탕으로 마지막 판단을 내려주세요.', '⚖️' from public.court_templates;

insert into public.court_rounds (template_id, round_order, round_type, title, content, emoji, evidence_label)
select id, 4, 'evidence', '증거 1호 · 길드 공지', '길드 일정은 일주일 전에 확정됐고, 불참하면 함께 준비한 팀원 전원이 피해를 보는 상황이었습니다.', '🗓️', '일주일 전 확정된 약속'
from public.court_templates where slug = 'game-schedule'
union all
select id, 5, 'evidence', '증거 2호 · 데이트 요청', '데이트 요청은 사건 당일 오후에 갑자기 전달됐습니다. 다만 두 사람은 최근 2주 동안 제대로 만나지 못했습니다.', '💬', '당일 요청과 2주간의 공백'
from public.court_templates where slug = 'game-schedule';
