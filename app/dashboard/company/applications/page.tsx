import { redirect }           from 'next/navigation'
import Link                   from 'next/link'
import { createClient }       from '@/lib/supabase-server'
import { DashboardShell }     from '@/components/ui/DashboardShell'
import { ApplicationActions } from '@/components/ui/ApplicationActions'

type Application = {
  id:           string
  status:       'pending' | 'under_review' | 'accepted' | 'declined'
  applied_at:   string
  motivation:   string
  document_url: string | null
  students: {
    first_name: string; last_name: string; reg_number: string
    department: string; university: string; level: string
  } | null
}

const STATUS_CFG = {
  pending:      { label: 'Pending',      bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B', dot: '#F59E0B'  },
  under_review: { label: 'Under Review', bg: 'rgba(59,130,246,0.12)',  color: '#3B82F6', dot: '#3B82F6'  },
  accepted:     { label: 'Accepted',     bg: 'rgba(16,185,129,0.12)',  color: '#10B981', dot: '#10B981'  },
  declined:     { label: 'Declined',     bg: 'rgba(239,68,68,0.12)',   color: '#EF4444', dot: '#EF4444'  },
}

// ✅ FIX: parentheses around typeof are required for correct type extraction
const FILTERS = ['All', 'Pending', 'Under Review', 'Accepted', 'Declined'] as const
type Filter = (typeof FILTERS)[number]

function extractRole(motivation: string): string {
  return motivation.match(/PREFERRED ROLE:\s*(.+)/)?.[1]?.trim() ?? 'Not specified'
}

function extractCoverNote(motivation: string): string {
  return motivation.match(/COVER NOTE:\n([\s\S]+?)(?:\n\nAPPLICATION|$)/)?.[1]?.trim() ?? ''
}

function filterApps(apps: Application[], filter: Filter): Application[] {
  if (filter === 'All') return apps
  const statusMap: Record<Exclude<Filter, 'All'>, Application['status']> = {
    'Pending':      'pending',
    'Under Review': 'under_review',
    'Accepted':     'accepted',
    'Declined':     'declined',
  }
  return apps.filter(a => a.status === statusMap[filter])
}

export default async function CompanyApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter: rawFilter } = await searchParams

  // ✅ FIX: cast the array to readonly string[] for .includes(), then cast the result
  // rawFilter is string | undefined — never cast undefined directly to Filter
  const activeFilter: Filter = (FILTERS as readonly string[]).includes(rawFilter ?? '')
    ? (rawFilter as Filter)
    : 'All'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, industry, slots_available')
    .eq('user_id', user.id)
    .single()

  if (!company) redirect('/auth/login')

  const { data: rows } = await supabase
    .from('applications')
    .select(`
      id, status, applied_at, motivation, document_url,
      students ( first_name, last_name, reg_number, department, university, level )
    `)
    .eq('company_id', company.id)
    .order('applied_at', { ascending: false })

const all = (rows ?? []) as unknown as Application[]
  const apps = filterApps(all, activeFilter)

  // ✅ FIX: explicit Record<Filter, number> so counts[f] is type-safe
  const counts: Record<Filter, number> = {
    All:            all.length,
    Pending:        all.filter(a => a.status === 'pending').length,
    'Under Review': all.filter(a => a.status === 'under_review').length,
    Accepted:       all.filter(a => a.status === 'accepted').length,
    Declined:       all.filter(a => a.status === 'declined').length,
  }

  return (
    <DashboardShell name={company.name} role="company">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-semibold tracking-widest mb-1.5"
          style={{ color: '#3B82F6', fontFamily: 'var(--font-mono)' }}>
          APPLICATIONS MANAGEMENT
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
          All Applications
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          {all.length} total · {company.slots_available} slot{company.slots_available !== 1 ? 's' : ''} remaining
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {FILTERS.map(f => (
          <Link
            key={f}
            href={`/dashboard/company/applications?filter=${encodeURIComponent(f)}`}
            className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all"
            style={{
              background:     activeFilter === f ? '#3B82F6' : 'transparent',
              color:          activeFilter === f ? '#fff' : 'var(--color-muted)',
              borderColor:    activeFilter === f ? '#3B82F6' : 'rgba(255,255,255,0.1)',
              textDecoration: 'none',
            }}
          >
            {f}
            <span className="ml-1.5 text-[10px] opacity-70">
              ({counts[f]})
            </span>
          </Link>
        ))}
      </div>

      {/* List */}
      {apps.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl"
          style={{ background: '#101A2E', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
            No {activeFilter === 'All' ? '' : activeFilter.toLowerCase()} applications
          </p>
          {activeFilter !== 'All' && (
            <Link
              href="/dashboard/company/applications"
              className="text-sm"
              style={{ color: '#3B82F6', textDecoration: 'none' }}
            >
              View all applications
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {apps.map(app => {
            const cfg      = STATUS_CFG[app.status]
            const student  = app.students
            const role     = extractRole(app.motivation)
            const note     = extractCoverNote(app.motivation)
            const initials = student
              ? `${student.first_name[0]}${student.last_name[0]}`.toUpperCase()
              : '??'
            const date = new Date(app.applied_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })

            return (
              <div
                key={app.id}
                className="p-5 rounded-2xl"
                style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6', fontFamily: 'var(--font-heading)' }}
                  >
                    {initials}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-sm"
                          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
                          {student ? `${student.first_name} ${student.last_name}` : 'Unknown'}
                        </p>
                        <p className="text-xs mt-0.5"
                          style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                          {student?.reg_number} · {student?.department} · Level {student?.level}
                        </p>
                      </div>
                      {/* Status badge */}
                      <span
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0"
                        style={{ background: cfg.bg, color: cfg.color, fontFamily: 'var(--font-mono)' }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Role + university */}
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-tx)' }}>
                        Role: <strong>{role}</strong>
                      </span>
                      {student?.university && (
                        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          {student.university}
                        </span>
                      )}
                    </div>

                    {/* Cover note */}
                    {note && (
                      <p className="text-xs mt-2 italic leading-relaxed line-clamp-2"
                        style={{ color: 'var(--color-muted)' }}>
                        &ldquo;{note}&rdquo;
                      </p>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          Applied {date}
                        </span>
                        {app.document_url && (
                          <a
                            href={app.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs flex items-center gap-1 hover:opacity-80 transition-opacity"
                            style={{ color: '#3B82F6', textDecoration: 'none' }}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24"
                              stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                            View Document
                          </a>
                        )}
                      </div>
                      <ApplicationActions
                        applicationId={app.id}
                        companyId={company.id}
                        currentStatus={app.status}
                        slotsAvailable={company.slots_available}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}