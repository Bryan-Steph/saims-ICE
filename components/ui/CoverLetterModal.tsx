'use client'

import { useState } from 'react'

interface Props {
  motivation: string
  studentName: string
}

export default function CoverLetterModal({ motivation, studentName }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <p
        style={{
          fontSize: '12px',
          color: 'var(--color-muted)',
          fontStyle: 'italic',
          lineHeight: '1.6',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        &ldquo;{motivation}&rdquo;
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          marginTop: '6px',
          fontSize: '11px',
          color: '#3B82F6',
          fontFamily: 'var(--font-mono)',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        Read full letter →
      </button>

      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(6,11,22,0.88)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              background: '#101A2E',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div>
                <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--color-tx)', fontSize: '15px' }}>
                  Cover Letter
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px' }}>
                  from {studentName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-muted)',
                  fontSize: '22px',
                  lineHeight: 1,
                  cursor: 'pointer',
                  padding: '0 2px',
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            {/* Body — scrollable */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <p
                style={{
                  fontSize: '14px',
                  lineHeight: '1.85',
                  color: 'var(--color-tx)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {motivation}
              </p>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '12px 24px',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--color-tx)',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}