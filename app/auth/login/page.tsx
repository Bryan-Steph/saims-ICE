'use client'

import { useState }      from 'react'
import { useRouter }     from 'next/navigation'
import Link              from 'next/link'
import { createClient }  from '@/lib/supabase'
import { Button }        from '@/components/ui/Button'
import { Input }         from '@/components/ui/Input'

export default function LoginPage() {
  const router    = useRouter()
  const supabase  = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleLogin() {
    if (!email.includes('@'))    { setError('Enter a valid email.'); return }
    if (password.length < 1)     { setError('Enter your password.'); return }

    setLoading(true)
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email:    email.toLowerCase().trim(),
        password,
      })
      if (signInError) throw signInError

      // Fetch role then redirect — proxy.ts will also enforce this
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Login failed.')

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      router.push(`/dashboard/${roleData?.role ?? 'student'}`)

    } catch (e: unknown) {
      setError(
        e instanceof Error && e.message.includes('Invalid login credentials')
          ? 'Incorrect email or password.'
          : e instanceof Error ? e.message : 'Login failed. Try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-center">
      <div className="auth-card">

        {/* Logo */}
        <div className="mb-8">
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-tx)' }}>
            Attach<span style={{ color: 'var(--color-accent)' }}>Hub</span>
          </span>
        </div>

        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
          Welcome back
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
          Sign in to your AttachHub account.
        </p>

        <div className="flex flex-col gap-4">
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />

          {/* Password with show/hide */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--color-tx)' }}>Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Your password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="field pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm px-4 py-3 rounded-lg" style={{ color: 'var(--color-danger)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
              {error}
            </p>
          )}

          <Button fullWidth loading={loading} onClick={handleLogin}>
            Sign in
          </Button>

          <p className="text-sm text-center" style={{ color: 'var(--color-muted)' }}>
            No account yet?{' '}
            <Link href="/auth/register" style={{ color: 'var(--color-accent)' }}>Create one →</Link>
          </p>
        </div>

      </div>
    </main>
  )
}