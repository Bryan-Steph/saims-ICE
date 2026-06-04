'use client'

import { useState }       from 'react'
import { useRouter }      from 'next/navigation'
import Link               from 'next/link'
import { createClient }   from '@/lib/supabase'
import { Button }         from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'

// ─── Types ────────────────────────────────────────────────────────────────

type Role = 'student' | 'company' | 'supervisor'
type Step = 1 | 2 | 3

interface Creds {
  email:    string
  password: string
  confirm:  string
}
interface StudentData  { firstName: string; lastName: string; regNumber: string; university: string; department: string; level: string }
interface CompanyData  { name: string; industry: string; location: string; size: string; description: string }
interface SupervisorData { title: string; fullName: string; institution: string; department: string; staffId: string }

// ─── Role card definitions ─────────────────────────────────────────────────

const ROLES: { id: Role; label: string; sub: string; color: string; icon: React.ReactNode }[] = [
  {
    id: 'student', label: 'Student',
    sub: 'Browse companies and apply for attachment slots',
    color: '#3B82F6',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    id: 'company', label: 'Company',
    sub: 'Post internship slots and manage incoming applications',
    color: '#10B981',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
  },
  {
    id: 'supervisor', label: 'Supervisor',
    sub: 'Monitor placed students and review their weekly reports',
    color: '#F59E0B',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75m0-3.75h3.75" />
      </svg>
    ),
  },
]

// ─── Main page ─────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step,    setStep]    = useState<Step>(1)
  const [role,    setRole]    = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const [creds, setCreds] = useState<Creds>({ email: '', password: '', confirm: '' })

  const [student, setStudent] = useState<StudentData>({
    firstName: '', lastName: '', regNumber: '',
    university: 'University of Bamenda', department: '', level: '',
  })
  const [company, setCompany] = useState<CompanyData>({
    name: '', industry: '', location: 'Bamenda, Cameroon', size: '', description: '',
  })
  const [supervisor, setSupervisor] = useState<SupervisorData>({
    title: '', fullName: '', institution: '', department: '', staffId: '',
  })

  // ── Helpers ──────────────────────────────────────────────────────────────

  function patchCreds(key: keyof Creds, val: string) {
    setCreds(prev => ({ ...prev, [key]: val }))
  }

  function validate(): string | null {
    if (!creds.email.includes('@'))          return 'Enter a valid email address.'
    if (creds.password.length < 8)           return 'Password must be at least 8 characters.'
    if (creds.password !== creds.confirm)    return 'Passwords do not match.'
    if (role === 'student') {
      if (!student.firstName.trim())         return 'First name is required.'
      if (!student.lastName.trim())          return 'Last name is required.'
      if (!student.regNumber.trim())         return 'Registration number is required.'
      if (!student.department.trim())        return 'Department is required.'
      if (!student.level)                    return 'Select your level.'
    }
    if (role === 'company') {
      if (!company.name.trim())              return 'Company name is required.'
      if (!company.industry)                 return 'Select an industry.'
      if (!company.size)                     return 'Select company size.'
      if (!company.description.trim())       return 'Description is required.'
    }
    if (role === 'supervisor') {
      if (!supervisor.fullName.trim())       return 'Full name is required.'
      if (!supervisor.institution.trim())    return 'Institution is required.'
      if (!supervisor.department.trim())     return 'Department is required.'
      if (!supervisor.staffId.trim())        return 'Staff ID is required.'
    }
    return null
  }

  async function handleSubmit() {
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    setError(null)

    try {
      const origin = window.location.origin

      // Build the profile payload mapped exactly to DB columns
      const profilePayload =
        role === 'student'
          ? {
              first_name: student.firstName.trim(),
              last_name:  student.lastName.trim(),
              reg_number: student.regNumber.trim(),
              university: student.university.trim(),
              department: student.department.trim(),
              level:      student.level,
            }
          : role === 'company'
          ? {
              name:        company.name.trim(),
              industry:    company.industry,
              location:    company.location.trim(),
              size:        company.size,
              description: company.description.trim(),
            }
          : role === 'supervisor'
          ? {
              title:       supervisor.title,
              full_name:   supervisor.fullName.trim(),
              institution: supervisor.institution.trim(),
              department:  supervisor.department.trim(),
              staff_id:    supervisor.staffId.trim(),
            }
          : {}

      // Sign up and embed user profile data in metadata for the /auth/callback handler
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: creds.email.toLowerCase().trim(),
        password: creds.password,
        options: {
          data: { role, ...profilePayload },
          emailRedirectTo: `${origin}/auth/callback`,
        },
      })
      if (signUpError) throw signUpError

      // Note: user_roles insert and profiles update removed.
      // This is now handled in /auth/callback upon verifying the email.

      // Proceed to the check email success screen
      setStep(3)

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="page-center">
      <div className="auth-card w-full" style={{ maxWidth: step === 1 ? '42rem' : '30rem' }}>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs mb-6" style={{ color: 'var(--color-muted)' }}>
          ← Back to home
        </Link>

        {/* Logo */}
        <div className="mb-8 flex items-center justify-between">
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-tx)' }}>
            Attach<span style={{ color: 'var(--color-accent)' }}>Hub</span>
          </span>
          <Link href="/auth/login" className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Sign in instead →
          </Link>
        </div>

        {/* ── Step 1: Role Selection ─────────────────────────────── */}
        {step === 1 && (
          <div>
            <p className="text-xs font-mono mb-2" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
              STEP 1 OF 2
            </p>
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              Who are you?
            </h1>
            <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
              Select your role to get the right experience.
            </p>

            <div className="grid gap-3 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))' }}>
              {ROLES.map(r => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className="text-left rounded-xl p-5 transition-all duration-150"
                  style={{
                    background:   role === r.id ? `${r.color}18` : 'var(--color-surface)',
                    border:       `1px solid ${role === r.id ? r.color : 'var(--color-border)'}`,
                    boxShadow:    role === r.id ? `0 0 0 1px ${r.color}30` : 'none',
                    cursor:       'pointer',
                  }}
                >
                  <span style={{ color: r.color, display: 'block', marginBottom: '0.75rem' }}>
                    {r.icon}
                  </span>
                  <p className="font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem' }}>
                    {r.label}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                    {r.sub}
                  </p>
                </button>
              ))}
            </div>

            <Button
              fullWidth
              disabled={!role}
              onClick={() => setStep(2)}
            >
              Continue →
            </Button>
          </div>
        )}

        {/* ── Step 2: Profile Form ───────────────────────────────── */}
        {step === 2 && (
          <div>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-sm mb-6 transition-colors"
              style={{ color: 'var(--color-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              ← Back
            </button>

            <p className="text-xs mb-2" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
              STEP 2 OF 2
            </p>
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              Your details
            </h1>
            <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
              {role === 'student'    && 'Tell us about your academic profile.'}
              {role === 'company'    && 'Tell us about your organisation.'}
              {role === 'supervisor' && 'Tell us about your position.'}
            </p>

            <div className="flex flex-col gap-4">

              {/* ── Student fields ── */}
              {role === 'student' && <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="First name"   placeholder="e.g. Marie"   value={student.firstName}   onChange={e => setStudent(p => ({ ...p, firstName: e.target.value }))} />
                  <Input label="Last name"    placeholder="e.g. Nkemdirim" value={student.lastName}  onChange={e => setStudent(p => ({ ...p, lastName:  e.target.value }))} />
                </div>
                <Input label="Registration number" placeholder="e.g. UBa/COT/21/0042" value={student.regNumber}  onChange={e => setStudent(p => ({ ...p, regNumber:  e.target.value }))} />
                <Input label="University" value={student.university} onChange={e => setStudent(p => ({ ...p, university: e.target.value }))} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Department" placeholder="e.g. Computer Engineering" value={student.department} onChange={e => setStudent(p => ({ ...p, department: e.target.value }))} />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" style={{ color: 'var(--color-tx)' }}>Level</label>
                    <select className="field" value={student.level} onChange={e => setStudent(p => ({ ...p, level: e.target.value }))}>
                      <option value="" disabled>Select level</option>
                      {['100L','200L','300L','400L','HND1','HND2'].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </>}

              {/* ── Company fields ── */}
              {role === 'company' && <>
                <Input label="Company name" placeholder="e.g. TRAITZ Tech" value={company.name} onChange={e => setCompany(p => ({ ...p, name: e.target.value }))} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" style={{ color: 'var(--color-tx)' }}>Industry</label>
                    <select className="field" value={company.industry} onChange={e => setCompany(p => ({ ...p, industry: e.target.value }))}>
                      <option value="" disabled>Select industry</option>
                      {['Telecom','Software','IT Services','Cybersecurity','Banking','Engineering','Training','Other'].map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" style={{ color: 'var(--color-tx)' }}>Company size</label>
                    <select className="field" value={company.size} onChange={e => setCompany(p => ({ ...p, size: e.target.value }))}>
                      <option value="" disabled>Select size</option>
                      {['1–10','11–50','51–200','201–500','500+'].map(s => <option key={s} value={s}>{s} employees</option>)}
                    </select>
                  </div>
                </div>
                <Input label="Location" value={company.location} onChange={e => setCompany(p => ({ ...p, location: e.target.value }))} />
                <Textarea label="Company description" placeholder="What does your company do? What will interns work on?" value={company.description} onChange={e => setCompany(p => ({ ...p, description: e.target.value }))} />
              </>}

              {/* ── Supervisor fields ── */}
              {role === 'supervisor' && <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" style={{ color: 'var(--color-tx)' }}>Title</label>
                    <select className="field" value={supervisor.title} onChange={e => setSupervisor(p => ({ ...p, title: e.target.value }))}>
                      <option value="" disabled>Select title</option>
                      {['Mr.','Mrs.','Ms.','Dr.','Prof.'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <Input label="Full name" placeholder="e.g. Ngwa Emmanuel" value={supervisor.fullName} onChange={e => setSupervisor(p => ({ ...p, fullName: e.target.value }))} />
                </div>
                <Input label="Institution" placeholder="e.g. University of Bamenda" value={supervisor.institution} onChange={e => setSupervisor(p => ({ ...p, institution: e.target.value }))} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Department" placeholder="e.g. Computer Engineering" value={supervisor.department} onChange={e => setSupervisor(p => ({ ...p, department: e.target.value }))} />
                  <Input label="Staff ID" placeholder="e.g. UB/STAFF/0042" value={supervisor.staffId} onChange={e => setSupervisor(p => ({ ...p, staffId: e.target.value }))} />
                </div>
              </>}

              {/* ── Credentials (all roles) ── */}
              <div
                className="pt-4 mt-2 flex flex-col gap-4"
                style={{ borderTop: '1px solid var(--color-border)' }}
              >
                <p className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                  ACCOUNT CREDENTIALS
                </p>
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  value={creds.email}
                  onChange={e => patchCreds('email', e.target.value)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={creds.password}
                    onChange={e => patchCreds('password', e.target.value)}
                  />
                  <Input
                    label="Confirm password"
                    type="password"
                    placeholder="Repeat password"
                    value={creds.confirm}
                    onChange={e => patchCreds('confirm', e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm px-4 py-3 rounded-lg" style={{ color: 'var(--color-danger)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  {error}
                </p>
              )}

              <Button fullWidth loading={loading} onClick={handleSubmit}>
                Create account
              </Button>

              <p className="text-xs text-center" style={{ color: 'var(--color-muted)' }}>
                Already have an account?{' '}
                <Link href="/auth/login" style={{ color: 'var(--color-accent)' }}>Sign in</Link>
              </p>
            </div>
          </div>
        )}

        {/* ── Step 3: Success / Check Email ──────────────────────── */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', margin: '0 auto 1.25rem',
              background: 'rgba(59,130,246,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="26" height="26" fill="none" viewBox="0 0 24 24"
                stroke="#3B82F6" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>

            <h2 style={{
              fontFamily: 'var(--font-heading)', fontSize: '1.25rem',
              fontWeight: 700, color: '#EEF4FF', marginBottom: '0.5rem',
            }}>
              Check your inbox
            </h2>

            <p style={{ color: '#8BA4C8', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>
              We sent a verification link to
            </p>
            <p style={{ color: '#EEF4FF', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>
              {creds.email}
            </p>
            <p style={{ color: '#8BA4C8', fontSize: '0.8rem', lineHeight: 1.6 }}>
              Click the link in that email to activate your account.
              {(role === 'company' || role === 'supervisor') && (
                <> You`ll then be asked to upload your verification document.</>
              )}
            </p>
          </div>
        )}

      </div>
    </main>
  )
}