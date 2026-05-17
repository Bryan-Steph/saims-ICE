import { DashboardShell } from '@/components/ui/DashboardShell'

export default function StudentLoading() {
  return (
    <DashboardShell role="student" name="">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          gap: '16px',
        }}
      >
        {/* Spinner ring */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: '3px solid rgba(59,130,246,0.15)',
            borderTopColor: '#3B82F6',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p
          style={{
            color: 'var(--color-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            letterSpacing: '0.05em',
          }}
        >
          Loading…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </DashboardShell>
  )
}