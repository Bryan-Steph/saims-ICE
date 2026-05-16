import Link                   from 'next/link'
import Image                  from 'next/image'
import { notFound }           from 'next/navigation'
import { createClient }       from '@/lib/supabase-server'
import { Navbar }             from '@/components/ui/Navbar'
import { Footer }             from '@/components/ui/Footer'
import { Badge }              from '@/components/ui/Badge'

type Company = {
  id:              string
  name:            string
  industry:        string
  location:        string
  size:            string
  description:     string
  slots_available: number
  avg_rating:      number
}
type Review = {
  id:         string
  rating:     number
  comment:    string | null
  created_at: string
  students:   { first_name: string; last_name: string } | null
}

const HERO_IMAGES: Record<string, string> = {
  Telecom:       'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop',
  Software:      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop',
  'IT Services': 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop',
  Cybersecurity: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop',
  Banking:       'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop',
  Engineering:   'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop',
  Training:      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&auto=format&fit=crop',
}

const INDUSTRY_COLORS: Record<string, { bg: string; text: string }> = {
  Telecom:       { bg: 'rgba(59,130,246,0.15)',  text: '#3B82F6'  },
  Software:      { bg: 'rgba(16,185,129,0.15)',  text: '#10B981'  },
  Cybersecurity: { bg: 'rgba(245,158,11,0.15)',  text: '#F59E0B'  },
  'IT Services': { bg: 'rgba(139,92,246,0.15)',  text: '#8B5CF6'  },
  Training:      { bg: 'rgba(236,72,153,0.15)',  text: '#EC4899'  },
  Banking:       { bg: 'rgba(16,185,129,0.15)',  text: '#10B981'  },
  Engineering:   { bg: 'rgba(249,115,22,0.15)',  text: '#F97316'  },
}

const SIZE_MAP: Record<string, string> = {
  small:  '1–50 Employees',
  medium: '50–200 Employees',
  large:  '200+ Employees',
}

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }   = await params
  const supabase = await createClient()

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, industry, location, size, description, slots_available, avg_rating')
    .eq('id', id)
    .single()

  if (!company) notFound()
  const c = company as Company

  const { data: reviewRows } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, students(first_name, last_name)')
    .eq('company_id', id)
    .order('created_at', { ascending: false })
    .limit(8)

  const reviews = (reviewRows ?? []) as unknown as Review[]

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  let isStudent  = false
  let hasApplied = false

  if (user) {
    const { data: roleData } = await supabase
      .from('user_roles').select('role').eq('user_id', user.id).single()
    isStudent = roleData?.role === 'student'

    if (isStudent) {
      const { data: studentRow } = await supabase
        .from('students').select('id').eq('user_id', user.id).single()
      if (studentRow) {
        const { data: existing } = await supabase
          .from('applications').select('id')
          .eq('student_id', studentRow.id).eq('company_id', id).maybeSingle()
        hasApplied = !!existing
      }
    }
  }

  const clr      = INDUSTRY_COLORS[c.industry] ?? { bg: 'rgba(59,130,246,0.15)', text: '#3B82F6' }
  const initials = c.name.split(' ').slice(0,2).map((w:string) => w[0]).join('').toUpperCase()
  const heroImg  = HERO_IMAGES[c.industry] ?? HERO_IMAGES['Banking']

  const INFO_STATS = [
    { label: 'OPEN SLOTS',  value: c.slots_available > 0 ? `${c.slots_available}` : '—', color: c.slots_available > 0 ? '#10B981' : 'var(--color-muted)' },
    { label: 'INDUSTRY',    value: c.industry,  color: clr.text },
    { label: 'LOCATION',    value: c.location,  color: 'var(--color-tx)' },
    { label: 'RATING',      value: c.avg_rating > 0 ? `${Number(c.avg_rating).toFixed(1)} / 5` : 'N/A', color: '#F59E0B' },
  ]

  return (
    <>
      <Navbar />
      <main className="pt-[60px]">

        {/* ── Hero image banner ── */}
        <div className="relative h-56 sm:h-72 overflow-hidden">
          <Image
            src={heroImg}
            alt={c.name}
            fill
            className="object-cover"
            style={{ filter: 'brightness(0.35)' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, transparent 40%, #060B16 100%)' }}
          />
        </div>

        {/* ── Company header (overlaps hero) ── */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="-mt-16 relative z-10 mb-8">
            {/* Back link */}
            <Link
              href="/companies"
              className="inline-flex items-center gap-2 text-sm mb-6 transition-opacity hover:opacity-80"
              style={{ color: 'var(--color-muted)' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to companies
            </Link>

            {/* Logo + name */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-extrabold shrink-0 border-2"
                style={{
                  background:   clr.bg,
                  color:        clr.text,
                  fontFamily:   'var(--font-heading)',
                  borderColor:  'rgba(255,255,255,0.1)',
                  boxShadow:    '0 8px 32px rgba(0,0,0,0.5)',
                }}
              >
                {initials}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge status={c.slots_available > 0 ? 'success' : 'neutral'}>
                    {c.slots_available > 0 ? `${c.slots_available} Slots Open` : 'No Slots'}
                  </Badge>
                  <Badge status="neutral">{c.industry}</Badge>
                </div>
                <h1
                  className="text-4xl font-extrabold"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}
                >
                  {c.name}
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                  {c.location} · {SIZE_MAP[c.size] ?? c.size}
                  {c.avg_rating > 0 && (
                    <span style={{ color: '#F59E0B' }}> · ★ {Number(c.avg_rating).toFixed(1)} / 5.0 Rating</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* ── Stats bar ── */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-px mb-8 rounded-2xl overflow-hidden border"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)' }}
          >
            {INFO_STATS.map(s => (
              <div
                key={s.label}
                className="flex flex-col gap-1 p-5"
                style={{ background: '#101A2E' }}
              >
                <p
                  className="text-xs tracking-widest"
                  style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
                >
                  {s.label}
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ fontFamily: 'var(--font-heading)', color: s.color }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* ── Main content + apply sidebar ── */}
          <div className="grid lg:grid-cols-3 gap-6 mb-16">

            {/* Left: About + reviews */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* About */}
              <div
                className="rounded-2xl p-6"
                style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}
              >
                <h2
                  className="text-2xl font-bold mb-4"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}
                >
                  About the Company
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                  {c.description ?? 'No description provided.'}
                </p>
              </div>

              {/* Reviews */}
              <div
                className="rounded-2xl p-6"
                style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}
              >
                <h2
                  className="text-xl font-bold mb-1"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}
                >
                  Student Reviews
                </h2>
                <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
                  Honest feedback from students who interned here.
                </p>

                {reviews.length === 0 ? (
                  <div
                    className="text-center py-10 rounded-xl border"
                    style={{ borderColor: 'rgba(255,255,255,0.05)', borderStyle: 'dashed' }}
                  >
                    <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                      No reviews yet. Be the first to leave one after your attachment.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {reviews.map(r => {
                      const name = r.students
                        ? `${r.students.first_name} ${r.students.last_name[0]}.`
                        : 'Anonymous'
                      return (
                        <div
                          key={r.id}
                          className="p-4 rounded-xl border"
                          style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--color-blue)', fontFamily: 'var(--font-heading)' }}
                              >
                                {name[0]}
                              </div>
                              <span className="text-sm font-medium" style={{ color: 'var(--color-tx)' }}>{name}</span>
                            </div>
                            <span className="text-xs" style={{ color: '#F59E0B', fontFamily: 'var(--font-mono)' }}>
                              {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                            </span>
                          </div>
                          {r.comment && (
                            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{r.comment}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Application status card */}
            <div className="flex flex-col gap-4">
              <div
                className="rounded-2xl p-6 sticky top-20"
                style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}
              >
                <h2
                  className="text-xl font-bold mb-1"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}
                >
                  Application Status
                </h2>
                <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
                  {c.slots_available > 0
                    ? 'Reviewing applications for upcoming cohort.'
                    : 'No slots are currently available.'}
                </p>

                {/* Quick info */}
                {[
                  { label: 'FORMAT',    value: 'On-site / Hybrid' },
                  { label: 'LOCATION',  value: c.location },
                  { label: 'INDUSTRY',  value: c.industry },
                ].map(item => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 py-3 border-t"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <p
                      className="text-xs w-20 shrink-0 pt-0.5"
                      style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
                    >
                      {item.label}
                    </p>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-tx)' }}>
                      {item.value}
                    </p>
                  </div>
                ))}

                <div className="mt-6">
                  {/* Not logged in */}
                  {!user && c.slots_available > 0 && (
                    <Link
                      href="/auth/register"
                      className="block w-full text-center text-sm font-bold py-3.5 rounded-xl transition-opacity hover:opacity-90"
                      style={{ background: 'var(--color-blue)', color: '#fff' }}
                    >
                      APPLY NOW →
                    </Link>
                  )}
                  {/* Student, not applied */}
                  {isStudent && !hasApplied && c.slots_available > 0 && (
                    <Link
                      href={`/dashboard/student?apply=${c.id}`}
                      className="block w-full text-center text-sm font-bold py-3.5 rounded-xl transition-opacity hover:opacity-90"
                      style={{ background: 'var(--color-blue)', color: '#fff' }}
                    >
                      APPLY NOW →
                    </Link>
                  )}
                  {/* Already applied */}
                  {isStudent && hasApplied && (
                    <div
                      className="w-full text-center text-sm font-semibold py-3.5 rounded-xl"
                      style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)', fontFamily: 'var(--font-mono)' }}
                    >
                      ✓ APPLICATION SUBMITTED
                    </div>
                  )}
                  {/* No slots */}
                  {c.slots_available === 0 && (
                    <div
                      className="w-full text-center text-sm py-3.5 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--color-muted)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      No slots available
                    </div>
                  )}

                  {!user && (
                    <p className="text-xs text-center mt-3" style={{ color: 'var(--color-muted)' }}>
                      Requires a registered student account.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </>
  )
}