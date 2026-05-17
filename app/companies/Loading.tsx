export default function CompaniesLoading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-bg)',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
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
        Loading companies…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}