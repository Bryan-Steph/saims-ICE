import { redirect } from 'next/navigation'
import Link         from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { DashboardShell } from '@/components/ui/DashboardShell'

type Company = {
  id:               string
  name:             string
  industry:         string
  location:         string
  size:             string | null
  description:      string | null
  slots_available:  number
  avg_rating:       number
}

const INDUSTRIES = [
  'All',
  'Telecom',
  'Cybersecurity',
  'Software',
  'IT Services',
  'Training',
  'Banking',
  'Engineering',
] as const

export default async function StudentCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; industry?: string }>
}) {
  const { q, industry: rawIndustry } = await searchParams

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: student } = await supabase
    .from('students')
    .select('first_name')
    .eq('user_id', user.id)
    .single()

  // Fetch all companies with available slots
 let query = supabase
    .from('companies')
    .select('id, name, industry, location, size, description, slots_available, avg_rating')
    .eq('verification_status', 'approved')
    .order('name', { ascending: true })

  if (rawIndustry && rawIndustry !== 'All') {
    query = query.eq('industry', rawIndustry)
  }

  const { data: rows } = await query
  let companies = (rows ?? []) as Company[]

  // Client-side text search after fetch (small dataset — fine for now)
  if (q && q.trim().length > 0) {
    const term = q.trim().toLowerCase()
    companies = companies.filter(
      c =>
        c.name.toLowerCase().includes(term) ||
        c.industry.toLowerCase().includes(term) ||
        c.location.toLowerCase().includes(term)
    )
  }

  const activeIndustry = INDUSTRIES.includes(rawIndustry as (typeof INDUSTRIES)[number])
    ? rawIndustry
    : 'All'

  const displayName = student?.first_name ?? 'Student'

  return (
    <DashboardShell name={displayName} role="student">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-semibold tracking-widest mb-1.5"
          style={{ color: '#3B82F6', fontFamily: 'var(--font-mono)' }}>
          BROWSE INTERNSHIPS
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
          Find a Company
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          {companies.length} compan{companies.length === 1 ? 'y' : 'ies'} available
        </p>
      </div>

      {/* Search + filter bar */}
      <form method="GET" className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search by name, industry, or location…"
          className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{
            background:  '#101A2E',
            border:      '0.5px solid rgba(255,255,255,0.1)',
            color:       'var(--color-tx)',
          }}
        />
        {/* Hidden input preserves industry filter on search submit */}
        {activeIndustry && activeIndustry !== 'All' && (
          <input type="hidden" name="industry" value={activeIndustry} />
        )}
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: '#3B82F6', color: '#fff' }}
        >
          Search
        </button>
      </form>

      {/* Industry filter pills */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {INDUSTRIES.map(ind => (
          <Link
            key={ind}
            href={`/dashboard/student/companies?${q ? `q=${encodeURIComponent(q)}&` : ''}industry=${encodeURIComponent(ind)}`}
            className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all"
            style={{
              background:     activeIndustry === ind ? '#3B82F6' : 'transparent',
              color:          activeIndustry === ind ? '#fff' : 'var(--color-muted)',
              borderColor:    activeIndustry === ind ? '#3B82F6' : 'rgba(255,255,255,0.1)',
              textDecoration: 'none',
            }}
          >
            {ind}
          </Link>
        ))}
      </div>

      {/* Company cards */}
      {companies.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl"
          style={{ background: '#101A2E', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
            No companies found
          </p>
          <Link
            href="/dashboard/student/companies"
            className="text-sm"
            style={{ color: '#3B82F6', textDecoration: 'none' }}
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map(company => {
            const avgRating = Number(company.avg_rating ?? 0)
            const hasSlots  = company.slots_available > 0

            return (
              <Link
                key={company.id}
                href={`/dashboard/student/companies/${company.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="h-full p-5 rounded-2xl flex flex-col gap-3 transition-all hover:border-blue-500/30"
                  style={{
                    background: '#101A2E',
                    border:     '0.5px solid rgba(255,255,255,0.06)',
                    cursor:     'pointer',
                  }}
                >
                  {/* Company name + badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6',
                               fontFamily: 'var(--font-heading)' }}>
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                      style={{
                        background: hasSlots ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                        color:      hasSlots ? '#10B981' : '#EF4444',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {hasSlots ? `${company.slots_available} slot${company.slots_available !== 1 ? 's' : ''}` : 'Full'}
                    </span>
                  </div>

                  {/* Name + details */}
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-1"
                      style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
                      {company.name}
                    </p>
                    <p className="text-xs"
                      style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                      {company.industry} · {company.location}
                    </p>
                    {company.description && (
                      <p className="text-xs mt-2 leading-relaxed line-clamp-2"
                        style={{ color: 'var(--color-muted)' }}>
                        {company.description}
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {avgRating > 0 ? `⭐ ${avgRating.toFixed(1)} / 5` : 'No reviews yet'}
                    </span>
                    <span className="text-xs font-medium" style={{ color: '#3B82F6' }}>
                      View →
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}