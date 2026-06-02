'use client'

import { useState, useEffect }     from 'react'
import Link                        from 'next/link'
import { usePathname, useRouter }  from 'next/navigation'
import { createClient }            from '@/lib/supabase'
import { Spinner }                 from '@/components/ui/Spinner'
import { NotificationBadge }       from '@/components/ui/NotificationBadge'

type Role = 'student' | 'company' | 'supervisor' | 'admin'
interface Props { name: string; role: Role; children: React.ReactNode }

function I({ d }: { d: string }) {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

const BELL_D = 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0'
const SETTINGS_D = 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z'

const NAV: Record<Role, { href: string; label: string; d: string }[]> = {
  student: [
    { href: '/dashboard/student',               label: 'Dashboard',        d: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
    { href: '/dashboard/student/companies',     label: 'Browse Companies', d: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21' },
    { href: '/dashboard/student/applications',  label: 'Applications',     d: 'M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5' },
    { href: '/dashboard/student/reports',       label: 'Reports',          d: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
    { href: '/dashboard/student/notifications', label: 'Notifications',    d: BELL_D },
    { href: '/dashboard/student/settings',      label: 'Settings',         d: SETTINGS_D },
  ],
  company: [
    { href: '/dashboard/company',               label: 'Dashboard',    d: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
    { href: '/dashboard/company/applications',  label: 'Applications', d: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
    { href: '/dashboard/company/notifications', label: 'Notifications', d: BELL_D },
    { href: '/dashboard/company/settings',      label: 'Settings',     d: SETTINGS_D },
  ],
  supervisor: [
    { href: '/dashboard/supervisor',               label: 'Overview',      d: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
    { href: '/dashboard/supervisor/students',      label: 'My Students',   d: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
    { href: '/dashboard/supervisor/reports',       label: 'Reports',       d: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
    { href: '/dashboard/supervisor/notifications', label: 'Notifications', d: BELL_D },
    { href: '/dashboard/supervisor/settings',      label: 'Settings',      d: SETTINGS_D },
  ],
  admin: [
    { href: '/dashboard/admin',             label: 'Overview',    d: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
    { href: '/dashboard/admin/companies',   label: 'Companies',   d: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21' },
    { href: '/dashboard/admin/supervisors', label: 'Supervisors', d: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
  ],
}

// ─── Sidebar inner ──────────────────────────────────────────────────────────
function SidebarInner({
  name, role, avatarUrl, onNavClick, onSignOut, signingOut,
}: {
  name:      string
  role:      Role
  avatarUrl: string | null   // ← NEW
  onNavClick:  () => void
  onSignOut:   () => void
  signingOut:  boolean
}) {
  const pathname = usePathname()
  const initials = name.trim().split(/\s+/).filter(Boolean)
    .slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
  const navItems = NAV[role] ?? []

  function isActive(href: string) {
    if (href === `/dashboard/${role}`) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-[60px] shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(59,130,246,0.2)' }}>
          <svg className="w-3.5 h-3.5" style={{ color: '#3B82F6' }} fill="none"
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold leading-tight"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
            AttachHub
          </p>
          <p className="text-[10px]"
            style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
            Management Portal
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-3 flex-1 overflow-y-auto">
        {navItems.map(item => {
          const active  = isActive(item.href)
          const isNotif = item.label === 'Notifications'
          return (
            <Link key={item.href} href={item.href} onClick={onNavClick}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={{
                color:          active ? 'var(--color-tx)' : 'var(--color-muted)',
                background:     active ? 'rgba(59,130,246,0.12)' : 'transparent',
                borderLeft:     `2px solid ${active ? '#3B82F6' : 'transparent'}`,
                textDecoration: 'none',
              }}>
              <span style={{ color: active ? '#3B82F6' : 'var(--color-muted)' }}>
                <I d={item.d} />
              </span>
              <span className="flex-1">{item.label}</span>
              {isNotif && <NotificationBadge />}
            </Link>
          )
        })}
      </nav>

      {/* User card + sign out */}
      <div className="p-3 shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

        <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)' }}>

          {/* ── Avatar: photo if uploaded, else initials ── */}
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold"
            style={{ background: 'rgba(59,130,246,0.2)', color: '#3B82F6',
                     fontFamily: 'var(--font-heading)' }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials
            }
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate"
              style={{ color: 'var(--color-tx)' }}>{name}</p>
            <p className="text-[10px] capitalize"
              style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{role}</p>
          </div>
        </div>

        <button onClick={onSignOut} disabled={signingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
          style={{
            color:      signingOut ? 'var(--color-muted)' : '#EF4444',
            background: 'none', border: 'none',
            cursor:     signingOut ? 'not-allowed' : 'pointer',
            opacity:    signingOut ? 0.6 : 1,
          }}>
          {signingOut
            ? <Spinner size="sm" />
            : <I d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          }
          {signingOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>
    </div>
  )
}

// ─── Shell ──────────────────────────────────────────────────────────────────
export function DashboardShell({ name, role, children }: Props) {
  const router                       = useRouter()
  const [sideOpen,   setSideOpen]    = useState(false)
  const [signingOut, setSigningOut]  = useState(false)
  const [avatarUrl,  setAvatarUrl]   = useState<string | null>(null)  // ← NEW

  // ── Fetch avatar once on mount ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function loadAvatar() {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user || cancelled) return

      let url: string | null = null

      if (role === 'student') {
        const { data } = await sb
          .from('students').select('avatar_url').eq('user_id', user.id).single()
        url = data?.avatar_url ?? null

      } else if (role === 'company') {
        const { data } = await sb
          .from('companies').select('logo_url').eq('user_id', user.id).single()
        url = data?.logo_url ?? null

      } else if (role === 'supervisor') {
        const { data } = await sb
          .from('supervisors').select('avatar_url').eq('user_id', user.id).single()
        url = data?.avatar_url ?? null
      }

      if (!cancelled) setAvatarUrl(url)
    }
    loadAvatar()
    return () => { cancelled = true }
  }, [role])

  async function handleSignOut() {
    setSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/auth/login')
      router.refresh()
    } catch {
      setSigningOut(false)
    }
  }

  const sidebarProps = {
    name, role, avatarUrl,              // ← avatarUrl added
    onNavClick:  () => setSideOpen(false),
    onSignOut:   handleSignOut,
    signingOut,
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>

      {/* Mobile overlay */}
      <div className="fixed inset-0 z-40 lg:hidden"
        onClick={() => setSideOpen(false)}
        style={{
          background:     sideOpen ? 'rgba(0,0,0,0.65)' : 'transparent',
          backdropFilter: sideOpen ? 'blur(4px)'         : 'none',
          pointerEvents:  sideOpen ? 'auto'              : 'none',
          transition:     'background 280ms ease, backdrop-filter 280ms ease',
        }}
      />

      {/* Mobile sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-[260px] lg:hidden"
        style={{
          background:    '#0A1628',
          borderRight:   '1px solid rgba(255,255,255,0.07)',
          transform:     sideOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition:    'transform 300ms cubic-bezier(0.4,0,0.2,1)',
          pointerEvents: sideOpen ? 'auto' : 'none',
        }}>
        <SidebarInner {...sidebarProps} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[240px] shrink-0 sticky top-0 h-screen"
        style={{ background: '#0A1628', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <SidebarInner {...sidebarProps} />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-[56px] flex items-center justify-between px-4"
          style={{ background: '#0A1628', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Hamburger */}
          <button onClick={() => setSideOpen(o => !o)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-lg"
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer' }}
            aria-label="Toggle menu">
            <span style={{ display: 'block', height: '1.5px', width: '18px', borderRadius: 2, background: 'var(--color-muted)', transition: 'all 280ms ease', transform: sideOpen ? 'translateY(6.5px) rotate(45deg)' : 'none' }} />
            <span style={{ display: 'block', height: '1.5px', width: '18px', borderRadius: 2, background: 'var(--color-muted)', transition: 'all 280ms ease', opacity: sideOpen ? 0 : 1, transform: sideOpen ? 'scaleX(0)' : 'scaleX(1)' }} />
            <span style={{ display: 'block', height: '1.5px', width: '18px', borderRadius: 2, background: 'var(--color-muted)', transition: 'all 280ms ease', transform: sideOpen ? 'translateY(-6.5px) rotate(-45deg)' : 'none' }} />
          </button>

          {/* Logo */}
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1rem', color: 'var(--color-tx)' }}>
            Attach<span style={{ color: '#3B82F6' }}>Hub</span>
          </span>

          {/* Right: bell + avatar */}
          <div className="flex items-center gap-2.5">
            {/* Bell */}
            {/* Bell — hidden for admin (no notifications page) */}
            {role !== 'admin' && (
              <Link href={`/dashboard/${role}/notifications`}
                style={{ position: 'relative', lineHeight: 0, color: 'var(--color-muted)', textDecoration: 'none' }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={BELL_D} />
                </svg>
                <span style={{ position: 'absolute', top: -3, right: -4 }}>
                  <NotificationBadge />
                </span>
              </Link>
            )}

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(59,130,246,0.2)', color: '#3B82F6',
                       fontFamily: 'var(--font-heading)' }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
              }
            </div>
          </div>
        </header>

        <main className="flex-1 pt-[56px] lg:pt-0 overflow-y-auto">
          <div className="p-5 sm:p-7 max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}