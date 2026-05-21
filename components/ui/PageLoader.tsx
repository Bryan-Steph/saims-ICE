'use client'

function SkeletonBlock({
  w = '100%',
  h = 16,
  radius = 8,
}: {
  w?: string | number
  h?: number
  radius?: number
}) {
  return (
    <div
      style={{
        width:        w,
        height:       h,
        borderRadius: radius,
        background:   'rgba(255,255,255,0.07)',
        animation:    'skel-pulse 1.6s ease-in-out infinite',
      }}
    />
  )
}

export function FullPageSpinner() {
  return (
    <div
      style={{
        minHeight:       '100vh',
        background:      '#060B16',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             16,
      }}
    >
      <style>{`
        @keyframes skel-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes skel-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
      `}</style>
      <div
        style={{
          width:       44,
          height:      44,
          border:      '3px solid rgba(59,130,246,0.2)',
          borderTop:   '3px solid #3B82F6',
          borderRadius:'50%',
          animation:   'skel-spin 0.75s linear infinite',
        }}
      />
      <p
        style={{
          color:      '#8BA4C8',
          fontSize:   13,
          fontFamily: 'var(--font-mono, monospace)',
          letterSpacing: '0.08em',
        }}
      >
        LOADING…
      </p>
    </div>
  )
}

export function DashboardSkeleton({
  role,
}: {
  role: 'student' | 'company' | 'supervisor'
}) {
  const navCount = { student: 5, company: 3, supervisor: 3 }[role]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060B16' }}>
      <style>{`
        @keyframes skel-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
      `}</style>

      {/* ── Sidebar skeleton ── */}
      <div
        style={{
          width:        220,
          flexShrink:   0,
          background:   '#0B1120',
          borderRight:  '1px solid rgba(255,255,255,0.05)',
          padding:      '24px 16px',
          display:      'flex',
          flexDirection:'column',
          gap:          6,
        }}
      >
        {/* Brand */}
        <div style={{ marginBottom: 28 }}>
          <SkeletonBlock w={110} h={18} />
          <div style={{ marginTop: 8 }}>
            <SkeletonBlock w={70} h={11} />
          </div>
        </div>

        {/* Nav links */}
        {Array.from({ length: navCount }).map((_, i) => (
          <div
            key={i}
            style={{ padding: '10px 12px', borderRadius: 10 }}
          >
            <SkeletonBlock h={13} />
          </div>
        ))}
      </div>

      {/* ── Main content skeleton ── */}
      <div style={{ flex: 1, padding: '40px 32px', maxWidth: 960 }}>

        {/* Page title */}
        <div style={{ marginBottom: 32 }}>
          <SkeletonBlock w={90}  h={9}  />
          <div style={{ marginTop: 10 }}><SkeletonBlock w={260} h={30} /></div>
          <div style={{ marginTop: 8  }}><SkeletonBlock w={180} h={13} /></div>
        </div>

        {/* Stat cards row */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap:                 12,
            marginBottom:        32,
          }}
        >
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              style={{
                background:   '#101A2E',
                borderRadius: 12,
                padding:      16,
                border:       '0.5px solid rgba(255,255,255,0.06)',
              }}
            >
              <SkeletonBlock w="70%" h={9} />
              <div style={{ marginTop: 14 }}>
                <SkeletonBlock w="50%" h={34} />
              </div>
            </div>
          ))}
        </div>

        {/* Content cards */}
        {[1, 2, 3].map(i => (
          <div
            key={i}
            style={{
              background:   '#101A2E',
              borderRadius: 16,
              padding:      20,
              marginBottom: 12,
              border:       '0.5px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div
                style={{
                  width:        44,
                  height:       44,
                  borderRadius: 10,
                  background:   'rgba(59,130,246,0.1)',
                  flexShrink:   0,
                  animation:    'skel-pulse 1.6s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  flex:          1,
                  display:       'flex',
                  flexDirection: 'column',
                  gap:           9,
                }}
              >
                <SkeletonBlock w="55%" h={13} />
                <SkeletonBlock w="35%" h={10} />
                <SkeletonBlock w="75%" h={10} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}