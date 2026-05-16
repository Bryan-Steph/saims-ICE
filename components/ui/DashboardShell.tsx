'use client'

import { useState }               from 'react'
import Link                       from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient }           from '@/lib/supabase'

type Role = 'student' | 'company' | 'supervisor'

interface NavItem { href: string; label: string; icon: React.ReactNode }

interface DashboardShellProps {
  name:     string
  role:     Role
  children: React.ReactNode
}

// ─── Inline icon helper ────────────────────────────────────────────────────

function SvgIcon({ d }: { d: string }) {
  return (
    <svg className="w-[1.1rem] h-[1.1rem] shrink-0" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

// ─── Navigation config ─────────────────────────────────────────────────────

const NAV: Record<Role, NavItem[]> = {
  student: [
    { href: '/dashboard/student',         label: 'Overview',         icon: <SvgIcon d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /> },
    { href: '/companies',                 label: 'Browse Companies', icon: <SvgIcon d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /> },
    { href: '/dashboard/student/reports', label: 'Weekly Reports',   icon: <SvgIcon d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /> },
  ],
  company: [
    { href: '/dashboard/company',              label: 'Overview',        icon: <SvgIcon d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /> },
    { href: '/dashboard/company/slots',        label: 'Internship Slots', icon: <SvgIcon d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /> },
    { href: '/dashboard/company/applications', label: 'Applications',    icon: <SvgIcon d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /> },
    { href: '/dashboard/company/reports',      label: 'Intern Reports',  icon: <SvgIcon d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /> },
  ],
  supervisor: [
    { href: '/dashboard/supervisor',          label: 'Overview',    icon: <SvgIcon d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /> },
    { href: '/dashboard/supervisor/students', label: 'My Students', icon: <SvgIcon d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /> },
    { href: '/dashboard/supervisor/reports',  label: 'Reports',    icon: <SvgIcon d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /> },
  ],
}

const ROLE_LABEL: Record<Role, string> = {
  student:    'Student',
  company:    'Company',
  supervisor: 'Supervisor',
}

// ─── Component ─────────────────────────────────────────────────────────────

export function DashboardShell({ name, role, children }: DashboardShellProps) {
  const pathname           = usePathname()
  const router             = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const navLinks = NAV[role]

  // ── Sidebar inner content (reused for desktop + mobile drawer) ──────────
  function SidebarContent() {
    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="px-5 h-14 flex items-center shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem' }}>
            Attach<span style={{ color: 'var(--color-accent)' }}>Hub</span>
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {navLinks.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
                style={{
                  background:   active ? 'rgba(59,130,246,0.1)' : 'transparent',
                  color:        active ? 'var(--color-accent)' : 'var(--color-muted)',
                  fontWeight:   active ? 600 : 400,
                  borderLeft:   active ? '2px solid var(--color-accent)' : '2px solid transparent',
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User + sign out */}
        <div className="px-3 py-4 shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-tx)' }}>{name}</p>
              <p className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{ROLE_LABEL[role]}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
            style={{ color: 'var(--color-muted)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-danger)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
          >
            <SvgIcon d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>

      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 w-60"
        style={{ background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile top bar ── */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 flex items-center justify-between px-4"
        style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
      >
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem' }}>
          Attach<span style={{ color: 'var(--color-accent)' }}>Hub</span>
        </span>
        <button
          onClick={() => setMobileOpen(v => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-tx)', padding: '0.25rem' }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <SvgIcon d="M6 18L18 6M6 6l12 12" />
          ) : (
            <SvgIcon d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          )}
        </button>
      </header>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 flex flex-col"
            style={{ background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}
          >
            <SidebarContent />
          </aside>
        </>
      )}

      {/* ── Main content ── */}
      <main className="lg:pl-60 pt-14 lg:pt-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </div>
      </main>

    </div>
  )
}