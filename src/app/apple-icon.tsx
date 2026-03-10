import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#6366f1',
          borderRadius: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Blueprint grid dots */}
        {[
          { top: 28, left: 32 },
          { top: 28, right: 32 },
          { bottom: 28, left: 32 },
          { bottom: 28, right: 32 },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.4)',
              ...pos,
            }}
          />
        ))}
        {/* MD wordmark */}
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 72,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          MD
        </span>
      </div>
    ),
    { ...size },
  )
}
