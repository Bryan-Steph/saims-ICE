import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') // Handles explicit redirections like password resets

  if (code) {
    const cookieStore = await cookies()
    
    // Explicitly use matching @supabase/ssr architecture to sync perfectly with proxy.ts
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Safe catch-all fallback for server-action component level mutation safety
            }
          },
        },
      }
    )

    // Exchange the verification code for an official user session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      if (next) return NextResponse.redirect(`${origin}${next}`)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.redirect(`${origin}/auth/login?error=no_user_found`)

      const meta = user.user_metadata

      // Fetch user role to ensure we aren't creating duplicates
      const { data: existingRole, error: roleFetchError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      // If user row doesn't exist yet, build out the profile
      if (!existingRole && meta?.role) {
        const role = meta.role

        // 1. Insert core user role record
        const { error: roleInsertError } = await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role })

        if (roleInsertError) {
          console.error('CRITICAL: Failed inserting user role ->', roleInsertError.message)
          return NextResponse.redirect(`${origin}/auth/register?error=role_creation_failed`)
        }

        // 2. Populate profiles dynamically using ultra-defensive field mapping
        if (role === 'student') {
          const { error: studentError } = await supabase
            .from('students')
            .update({
              first_name: meta.first_name || meta.firstName || '',
              last_name:  meta.last_name  || meta.lastName  || '',
              reg_number: meta.reg_number || meta.regNumber || '',
              university: meta.university || '',
              department: meta.department || '',
              level:      meta.level      || '',
            })
            .eq('user_id', user.id)

          if (studentError) {
            console.error('CRITICAL: Failed initializing student record ->', studentError.message)
            return NextResponse.redirect(`${origin}/auth/register?error=student_profile_failed`)
          }

        } else if (role === 'company') {
          const { error: companyError } = await supabase
            .from('companies')
            .update({
              name:        meta.name        || meta.companyName || '',
              industry:    meta.industry    || '',
              location:    meta.location    || '',
              size:        meta.size        || '',
              description: meta.description || '',
            })
            .eq('user_id', user.id)

          if (companyError) {
            console.error('CRITICAL: Failed initializing company record ->', companyError.message)
            return NextResponse.redirect(`${origin}/auth/register?error=company_profile_failed`)
          }

        } else if (role === 'supervisor') {
          const { error: supervisorError } = await supabase
            .from('supervisors')
            .update({
              full_name:   meta.full_name   || meta.fullName   || '',
              title:       meta.title       || '',
              institution: meta.institution || '',
              department:  meta.department  || '',
              staff_id:    meta.staff_id    || meta.staffId    || '',
            })
            .eq('user_id', user.id)

          if (supervisorError) {
            console.error('CRITICAL: Failed initializing supervisor record ->', supervisorError.message)
            return NextResponse.redirect(`${origin}/auth/register?error=supervisor_profile_failed`)
          }
        }
      }

      // Safe fallback calculations for standard redirection hops
      const finalRole = existingRole?.role || meta?.role
      
      if (finalRole === 'company' || finalRole === 'supervisor') {
        return NextResponse.redirect(`${origin}/verification-pending`)
      }
      if (finalRole) {
        return NextResponse.redirect(`${origin}/dashboard/${finalRole}`)
      }

      return NextResponse.redirect(`${origin}/auth/login`)
    } else {
      console.error('Auth Code Exchange Misfire ->', exchangeError.message)
    }
  }

  // Fallback anchor routing for dead, expired, or double-clicked link tokens
  return NextResponse.redirect(`${origin}/auth/login?error=link_expired`)
}