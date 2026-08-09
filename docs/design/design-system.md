# 쿵짝랩 디자인 시스템

## 1. Design Concept: Neubrutalism & 3D Kitsch
- **스타일:** 3px 두꺼운 검은 테두리(`border-3 border-black`) + 볼드 그림자(`shadow-neo`) + 파스텔톤 배경
- **3D 포인트:** 3Dicons.co 오픈소스 3D 그래픽 오브젝트 적극 활용

## 2. Typography
- **메인 폰트:** `LINE Seed KR` (오픈소스 라이선스)
- **선정 사유:** 곡률이 적용되어 동글동글하면서도 볼드 헤드라인에서 뛰어난 키치함 제공

## 3. Tailwind Color Palette (`tailwind.config.js`)

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#FF9EAA',   // 연애 재판소 / F 성향
          blue: '#A0E9FF',   // T 성향 / 이성적 판단
          yellow: '#FFD966', // P 성향 / 포인트 버튼
          mint: '#C1ECE4',   // J 성향 / 대기실
          bg: '#FFF8F0',     // 전체 웜톤 배경
        }
      },
      boxShadow: {
        'neo': '4px 4px 0px 0px #000000',
        'neo-lg': '6px 6px 0px 0px #000000',
      },
      borderWidth: {
        '3': '3px',
      }
    }
  }
}
