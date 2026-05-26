export default function Loading() {
  return (
    <div style={{
      minHeight:      '100vh',
      background:     '#060B16',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
    }}>
      <style>{`@keyframes _sp { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width:          36,
        height:         36,
        borderRadius:   '50%',
        border:         '2.5px solid rgba(59,130,246,0.2)',
        borderTopColor: '#3B82F6',
        animation:      '_sp 0.7s linear infinite',
      }} />
    </div>
  )
}