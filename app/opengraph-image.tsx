import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = '쿵짝랩 - 우리 둘의 쿵짝, 몇 점일까?';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const runtime = 'nodejs';

export default async function OpenGraphImage() {
  const font = await readFile(
    join(process.cwd(), 'node_modules/pretendard/dist/web/static/woff/Pretendard-Bold.woff'),
  );

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FFF8F0',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          width: 1080,
          height: 510,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '64px 76px',
          background: '#FFD966',
          border: '8px solid #000',
          borderRadius: 48,
          boxShadow: '18px 18px 0 #000',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', color: '#000' }}>
          <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 5 }}>KUNGJJAK LAB</div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 30,
              fontSize: 68,
              lineHeight: 1.15,
              fontWeight: 900,
            }}
          >
            <span>우리 둘의 쿵짝,</span>
            <span>몇 점일까?</span>
          </div>
          <div style={{ marginTop: 30, fontSize: 27, fontWeight: 700 }}>
            혼자서도, 둘이서도 착착 맞는 커플 성향 탐구소
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 260,
            height: 260,
            background: '#FF9EAA',
            border: '8px solid #000',
            borderRadius: 64,
            transform: 'rotate(4deg)',
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              width: 150,
              height: 174,
              background: '#FFF8F0',
              border: '8px solid #000',
              borderRadius: '28px 28px 70px 70px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -8,
                width: 82,
                height: 54,
                background: '#C1ECE4',
                border: '8px solid #000',
                borderRadius: 18,
              }}
            />
            <div
              style={{
                display: 'flex',
                width: '100%',
                height: 86,
                background: '#A0E9FF',
                borderTop: '8px solid #000',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 22,
                bottom: 24,
                width: 52,
                height: 52,
                background: '#FF9EAA',
                border: '7px solid #000',
                borderRadius: 26,
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 20,
                bottom: 46,
                width: 35,
                height: 35,
                background: '#FFD966',
                border: '6px solid #000',
                borderRadius: 18,
              }}
            />
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: 'Pretendard', data: font, style: 'normal', weight: 700 }],
    },
  );
}
