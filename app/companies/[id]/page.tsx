import Image              from 'next/image'
import { notFound }       from 'next/navigation'
import Link               from 'next/link'
import { createClient }   from '@/lib/supabase-server'
import { DashboardShell } from '@/components/ui/DashboardShell'
import { Badge }          from '@/components/ui/Badge'
import { ApplyButton }    from '@/components/ui/ApplyButton'

type Company = {
  id: string; name: string; industry: string; location: string
  size: string; description: string; slots_available: number; avg_rating: number
}
type Review = {
  id: string; rating: number; comment: string | null; created_at: string
  students: { first_name: string; last_name: string } | null
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

const SIZE_MAP: Record<string, string> = {
  small: '1–50 Employees', medium: '50–200 Employees', large: '200+ Employees',
}

export default async function DashboardCompanyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }   = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: studentRow } = await supabase
    .from('students').select('id, first_name, last_name').eq('user_id', user.id).single()
  if (!studentRow) return notFound()

  const displayName = `${studentRow.first_name} ${studentRow.last_name}`

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, industry, location, size, description, slots_available, avg_rating')
    .eq('id', id).single()
  if (!company) return notFound()

  const c = company as Company

  const { data: reviewRows } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, students(first_name, last_name)')
    .eq('company_id', id).order('created_at', { ascending: false }).limit(6)

  const reviews = (reviewRows ?? []) as unknown as Review[]

  const { data: existing } = await supabase
    .from('applications').select('id')
    .eq('student_id', studentRow.id).eq('company_id', id).maybeSingle()

  const hasApplied = !!existing
  const initials   = c.name.split(' ').slice(0,2).map((w:string) => w[0]).join('').toUpperCase()
  const heroImg    = HERO_IMAGES[c.industry] ?? HERO_IMAGES['Banking']

  return (
    <DashboardShell name={displayName} role="student">

      {/* Back */}
      <Link href="/dashboard/student/companies"
        className="inline-flex items-center gap-2 text-sm mb-6 hover:opacity-80 transition-opacity"
        style={{ color: 'var(--color-muted)' }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to companies
      </Link>

      {/* Hero image */}
      <div className="relative h-44 sm:h-56 rounded-2xl overflow-hidden mb-6">
        <Image src={heroImg} alt={c.name} fill className="object-cover"
          style={{ filter: 'brightness(0.3)' }} />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 30%, #060B16 100%)' }} />

        {/* Company name overlaid on hero */}
        <div className="absolute bottom-0 left-0 p-5 flex items-end gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-extrabold shrink-0 border"
            style={{ background: 'rgba(16,26,46,0.9)', color: 'var(--color-blue)',
                     fontFamily: 'var(--font-heading)', borderColor: 'rgba(255,255,255,0.1)' }}>
            {initials}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
              {c.name}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
              {c.location} · {SIZE_MAP[c.size] ?? c.size}
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'OPEN SLOTS', value: c.slots_available > 0 ? `${c.slots_available}` : '—', color: c.slots_available > 0 ? '#10B981' : 'var(--color-muted)' },
          { label: 'INDUSTRY',   value: c.industry,  color: 'var(--color-blue)' },
          { label: 'SIZE',       value: SIZE_MAP[c.size] ?? c.size, color: 'var(--color-tx)' },
          { label: 'RATING',     value: c.avg_rating > 0 ? `${Number(c.avg_rating).toFixed(1)} / 5` : 'N/A', color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4"
            style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
              {s.label}
            </p>
            <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main content + apply card */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left: About + reviews */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="rounded-2xl p-6"
            style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-xl font-bold mb-3"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
              About the Company
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              {c.description ?? 'No description provided.'}
            </p>
          </div>

          <div className="rounded-2xl p-6"
            style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
              Student Reviews
            </h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--color-muted)' }}>
                No reviews yet. Be the first after your attachment.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {reviews.map(r => (
                  <div key={r.id} className="p-4 rounded-xl border"
                    style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium" style={{ color: 'var(--color-tx)' }}>
                        {r.students ? `${r.students.first_name} ${r.students.last_name[0]}.` : 'Anonymous'}
                      </span>
                      <span className="text-xs" style={{ color: '#F59E0B', fontFamily: 'var(--font-mono)' }}>
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </span>
                    </div>
                    {r.comment && <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Apply card */}
        <div>
          <div className="rounded-2xl p-6 sticky top-6"
            style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-lg font-bold mb-1"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
              Application Status
            </h2>
            <p className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}>
              {c.slots_available > 0 ? 'Accepting applications for upcoming cohort.' : 'No slots available.'}
            </p>

            {[
              { label: 'FORMAT',   value: 'On-site / Hybrid' },
              { label: 'LOCATION', value: c.location },
              { label: 'INDUSTRY', value: c.industry },
            ].map(item => (
              <div key={item.label} className="flex gap-3 py-2.5 border-t"
                style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <p className="text-xs w-20 shrink-0 pt-0.5"
                  style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                  {item.label}
                </p>
                <p className="text-sm font-medium" style={{ color: 'var(--color-tx)' }}>{item.value}</p>
              </div>
            ))}

            <div className="mt-5">
              <ApplyButton
                companyId={c.id}
                companyName={c.name}
                hasSlots={c.slots_available > 0}
                isStudent={true}
                alreadyApplied={hasApplied}
                isLoggedIn={true}
              />
            </div>
          </div>
        </div>
      </div>

    </DashboardShell>
  )
}