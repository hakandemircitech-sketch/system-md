import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#6366f1',
          borderRadius: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Blueprint grid dots — top row */}
        <div
          style={{
            position: 'absolute',
            top: 5,
            left: 6,
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.45)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 5,
            right: 6,
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.45)',
          }}
        />
        {/* MD text mark */}
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 13,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          MD
        </span>
        {/* Blueprint grid dots — bottom row */}
        <div
          style={{
            position: 'absolute',
            bottom: 5,
            left: 6,
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.45)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 5,
            right: 6,
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.45)',
          }}
        />
      </div>
    ),
    { ...size },
  )
}
