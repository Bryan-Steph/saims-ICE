import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // ── Dashboard protection ──────────────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))

    const { data: roleData } = await supabase
      .from('user_roles').select('role').eq('user_id', user.id).single()
    const role = roleData?.role

    if (role) {
      // Wrong-dashboard guard (blocks cross-role access)
      if (pathname.startsWith('/dashboard/student')    && role !== 'student')
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
      if (pathname.startsWith('/dashboard/company')    && role !== 'company')
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
      if (pathname.startsWith('/dashboard/supervisor') && role !== 'supervisor')
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
      if (pathname.startsWith('/dashboard/admin')      && role !== 'admin')
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))

      // Verification gate — unverified company/supervisor cannot enter dashboard
      if (role === 'company' || role === 'supervisor') {
        const table = role === 'company' ? 'companies' : 'supervisors'
        const { data: profileData } = await supabase
          .from(table)
          .select('verification_status')
          .eq('user_id', user.id)
          .single()
        if (profileData?.verification_status !== 'approved') {
          return NextResponse.redirect(new URL('/verification-pending', request.url))
        }
      }
    }
  }

  // ── Verification pending page ─────────────────────────────────────────────
  if (pathname === '/verification-pending') {
    if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))

    const { data: roleData } = await supabase
      .from('user_roles').select('role').eq('user_id', user.id).single()
    const role = roleData?.role

    if (role) {
      // Students and admins don't belong here
      if (role === 'student' || role === 'admin')
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))

      // Already approved — send to their dashboard
      if (role === 'company' || role === 'supervisor') {
        const table = role === 'company' ? 'companies' : 'supervisors'
        const { data: profileData } = await supabase
          .from(table)
          .select('verification_status')
          .eq('user_id', user.id)
          .single()
        if (profileData?.verification_status === 'approved')
          return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
      }
    }
  }

  // ── Auth pages — redirect logged-in users to their dashboard ─────────────
if (pathname.startsWith('/auth') && user) {
  if (pathname.startsWith('/auth/register'))       return supabaseResponse
  if (pathname.startsWith('/auth/reset-password')) return supabaseResponse
  const { data: roleData } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id).single()
    const role = roleData?.role
    if (role) return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*', '/verification-pending'],
}