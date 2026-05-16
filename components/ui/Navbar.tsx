'use client'

import Link               from 'next/link'
import { usePathname }    from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient }   from '@/lib/supabase'

const NAV_LINKS = [
  { href: '/companies', label: 'Find Internships' },
  { href: '/#for-companies', label: 'For Companies' },
  { href: '/#university', label: 'University' },
  { href: '/#resources', label: 'Resources' },
]

type AuthState = 'loading' | 'guest' | 'authed'

export function Navbar() {
  const pathname = usePathname()
  const [auth, setAuth]       = useState<AuthState>('loading')
  const [dashHref, setDashHref] = useState('/dashboard/student')
  const [open, setOpen]       = useState(false)

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

  const active = (href: string) =>
    pathname === href || (href.startsWith('/companies') && pathname.startsWith('/companies'))

  return (
    <header
      className="fixed top-0 inset-x-0 z-50"
      style={{
        background:    'rgba(6,11,22,0.85)',
        backdropFilter:'blur(20px)',
        borderBottom:  '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0 select-none">
          <span
            className="text-xl font-extrabold tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}
          >
            AttachHub
          </span>
          <span
            className="inline-block w-2 h-2 rounded-full mb-3 ml-0.5"
            style={{ background: 'var(--color-blue)' }}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1">
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="px-4 py-2 rounded-lg text-sm transition-colors"
              style={{
                color:      active(l.href) ? 'var(--color-blue)' : 'var(--color-muted)',
                fontWeight: active(l.href) ? 600 : 400,
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Auth actions — desktop */}
        <div className="hidden lg:flex items-center gap-3">
          {auth === 'loading' && (
            <div className="h-8 w-36 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
          )}
          {auth === 'guest' && (
            <>
              <Link
                href="/auth/login"
                className="text-sm px-5 py-2 rounded-full border transition-colors hover:border-white/20"
                style={{ color: 'var(--color-muted)', borderColor: 'rgba(255,255,255,0.1)' }}
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="text-sm font-semibold px-5 py-2 rounded-full transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-blue)', color: '#fff' }}
              >
                Get Started
              </Link>
            </>
          )}
          {auth === 'authed' && (
            <Link
              href={dashHref}
              className="text-sm font-semibold px-5 py-2 rounded-full transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-blue)', color: '#fff' }}
            >
              My Dashboard →
            </Link>
          )}
        </div>

        {/* Hamburger — mobile */}
        <button
          className="lg:hidden p-2 rounded-lg"
          style={{ color: 'var(--color-muted)' }}
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="lg:hidden px-6 py-5 flex flex-col gap-2 border-t"
          style={{ background: '#060B16', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-sm py-2 rounded-lg px-3"
              style={{
                color:      active(l.href) ? 'var(--color-blue)' : 'var(--color-muted)',
                background: active(l.href) ? 'rgba(59,130,246,0.08)' : 'transparent',
              }}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 border-t mt-2 flex flex-col gap-2.5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {auth === 'guest' && <>
              <Link href="/auth/login" onClick={() => setOpen(false)} className="text-sm text-center py-2.5 rounded-full border" style={{ color: 'var(--color-muted)', borderColor: 'rgba(255,255,255,0.1)' }}>Sign In</Link>
              <Link href="/auth/register" onClick={() => setOpen(false)} className="text-sm font-semibold text-center py-2.5 rounded-full" style={{ background: 'var(--color-blue)', color: '#fff' }}>Get Started</Link>
            </>}
            {auth === 'authed' && (
              <Link href={dashHref} onClick={() => setOpen(false)} className="text-sm font-semibold text-center py-2.5 rounded-full" style={{ background: 'var(--color-blue)', color: '#fff' }}>My Dashboard →</Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}