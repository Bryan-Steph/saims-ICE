import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
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

  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const role = roleData?.role

    if (pathname.startsWith('/dashboard/student') && role !== 'student') {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
    }
    if (pathname.startsWith('/dashboard/company') && role !== 'company') {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
    }
    if (pathname.startsWith('/dashboard/supervisor') && role !== 'supervisor') {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
    }
  }

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
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
}