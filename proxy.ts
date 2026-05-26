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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // ── Not logged in → send to login ──────────────────────────
  if (pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // ── Already logged in → don't show auth pages ──────────────
  if (pathname.startsWith('/auth') && user) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const role = roleData?.role
    if (role) {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
    }
    // If role lookup fails, let them stay on auth page
    return supabaseResponse
  }

  // ── Logged in on dashboard → ONLY redirect if wrong role ───
  // CRITICAL: if role lookup fails (null), DO NOT redirect — let page handle it
  if (pathname.startsWith('/dashboard') && user) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const role = roleData?.role

    // If we couldn't get the role, pass through — don't redirect
    if (!role) return supabaseResponse

    // Only redirect if they're on the WRONG role's dashboard
    const onStudent    = pathname.startsWith('/dashboard/student')
    const onCompany    = pathname.startsWith('/dashboard/company')
    const onSupervisor = pathname.startsWith('/dashboard/supervisor')

    if (onStudent && role !== 'student') {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
    }
    if (onCompany && role !== 'company') {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
    }
    if (onSupervisor && role !== 'supervisor') {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
}