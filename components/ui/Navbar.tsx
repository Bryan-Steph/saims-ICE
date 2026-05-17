'use client'

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient }        from '@/lib/supabase'

const NAV_LINKS = [
  { href: '/companies',      label: 'Find Internships' },
  { href: '/auth/register',  label: 'For Companies'    },
]

type AuthState = 'loading' | 'guest' | 'authed'

export function Navbar() {
  const pathname                    = usePathname()
  const [auth, setAuth]             = useState<AuthState>('loading')
  const [dashHref, setDashHref]     = useState('/dashboard/student')
  const [menuOpen, setMenuOpen]     = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { setAuth('guest'); return }
      const { data } = await supabase
        .from('user_roles').select('role').eq('user_id', session.user.id).single()
      if (data?.role) setDashHref(`/dashboard/${data.role}`)
      setAuth('authed')
    })
  }, [])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  const isActive = (href: string) =>
    pathname === href || (href === '/companies' && pathname.startsWith('/companies'))

  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-50"
        style={{
          background:    'rgba(6,11,22,0.85)',
          backdropFilter:'blur(20px)',
          borderBottom:  '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto px-5 h-[60px] flex items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0 select-none">
            <span className="text-xl font-extrabold tracking-tight"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
              Attach<span style={{ color: 'var(--color-accent)' }}>Hub</span>
            </span>
            
            <span className="inline-block w-2 h-2 rounded-full mb-3 ml-0.5"
              style={{ background: 'var(--color-blue)' }} />
          </Link>


          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href}
                className="px-4 py-2 rounded-lg text-sm transition-colors"
                style={{
                  color:      isActive(l.href) ? 'var(--color-blue)' : 'var(--color-muted)',
                  fontWeight: isActive(l.href) ? 600 : 400,
                }}>
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {auth === 'loading' && (
              <div className="h-8 w-36 rounded-full animate-pulse"
                style={{ background: 'rgba(255,255,255,0.05)' }} />
            )}
            {auth === 'guest' && (<>
              <Link href="/auth/login"
                className="text-sm px-5 py-2 rounded-full border transition-colors hover:border-white/20"
                style={{ color: 'var(--color-muted)', borderColor: 'rgba(255,255,255,0.1)' }}>
                Sign In
              </Link>
              <Link href="/auth/register"
                className="text-sm font-semibold px-5 py-2 rounded-full hover:opacity-90"
                style={{ background: 'var(--color-blue)', color: '#fff' }}>
                Get Started
              </Link>
            </>)}
            {auth === 'authed' && (
              <Link href={dashHref}
                className="text-sm font-semibold px-5 py-2 rounded-full hover:opacity-90"
                style={{ background: 'var(--color-blue)', color: '#fff' }}>
                My Dashboard →
              </Link>
            )}
          </div>

          {/* Hamburger */}
          <button className="md:hidden p-2 rounded-lg z-10 relative"
            style={{ color: 'var(--color-muted)' }}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu">
            <div className="w-5 flex flex-col gap-1.5 transition-all">
              <span className="block h-0.5 rounded-full transition-all duration-300"
                style={{
                  background:  'currentColor',
                  transformOrigin: 'center',
                  transform: menuOpen ? 'translateY(8px) rotate(45deg)' : 'none',
                }} />
              <span className="block h-0.5 rounded-full transition-all duration-300"
                style={{
                  background: 'currentColor',
                  opacity:    menuOpen ? 0 : 1,
                  transform:  menuOpen ? 'scaleX(0)' : 'scaleX(1)',
                }} />
              <span className="block h-0.5 rounded-full transition-all duration-300"
                style={{
                  background:      'currentColor',
                  transformOrigin: 'center',
                  transform: menuOpen ? 'translateY(-8px) rotate(-45deg)' : 'none',
                }} />
            </div>
          </button>
        </div>
      </header>

      {/* Mobile slide-in backdrop */}
      <div
        className="fixed inset-0 z-40 md:hidden transition-opacity duration-300"
        style={{
          background:    'rgba(0,0,0,0.6)',
          backdropFilter:'blur(4px)',
          opacity:        menuOpen ? 1 : 0,
          pointerEvents:  menuOpen ? 'all' : 'none',
        }}
        onClick={() => setMenuOpen(false)}
      />

      {/* Mobile slide-in panel from right */}
      <div
        className="fixed top-0 right-0 bottom-0 z-40 md:hidden w-72 flex flex-col"
        style={{
          background:  '#0D1829',
          borderLeft:  '1px solid rgba(255,255,255,0.06)',
          transform:    menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition:  'transform 320ms cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div className="flex items-center justify-between px-5 h-[60px] border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <span className="text-lg font-extrabold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
            Menu
          </span>
        </div>

        <nav className="flex flex-col gap-1 p-4 flex-1">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className="px-4 py-3 rounded-xl text-sm font-medium transition-colors"
              style={{
                color:      isActive(l.href) ? 'var(--color-blue)' : 'var(--color-muted)',
                background: isActive(l.href) ? 'rgba(59,130,246,0.08)' : 'transparent',
              }}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t flex flex-col gap-3"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {auth === 'guest' && (<>
            <Link href="/auth/login"
              className="text-sm text-center py-3 rounded-xl border font-medium"
              style={{ color: 'var(--color-muted)', borderColor: 'rgba(255,255,255,0.1)' }}>
              Sign In
            </Link>
            <Link href="/auth/register"
              className="text-sm font-bold text-center py-3 rounded-xl"
              style={{ background: 'var(--color-blue)', color: '#fff' }}>
              Get Started
            </Link>
          </>)}
          {auth === 'authed' && (
            <Link href={dashHref}
              className="text-sm font-bold text-center py-3 rounded-xl"
              style={{ background: 'var(--color-blue)', color: '#fff' }}>
              My Dashboard →
            </Link>
          )}
        </div>
      </div>
    </>
  )
}