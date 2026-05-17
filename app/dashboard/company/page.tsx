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

function extractRole(motivation: string): string {
  return motivation.match(/PREFERRED ROLE:\s*(.+)/)?.[1]?.trim() ?? 'Not specified'
}

function extractCoverNote(motivation: string): string {
  return motivation.match(/COVER NOTE:\n([\s\S]+?)(?:\n\nAPPLICATION|$)/)?.[1]?.trim() ?? ''
}

export default async function CompanyDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, industry, location, size, description, slots_available, avg_rating')
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

const applications = (rows ?? []) as unknown as Application[]

  // Stats
  const total       = applications.length
  const pending     = applications.filter(a => a.status === 'pending').length
  const underReview = applications.filter(a => a.status === 'under_review').length
  const accepted    = applications.filter(a => a.status === 'accepted').length

  // Show up to 5 most urgent (pending first, then under_review)
  const priority = [
    ...applications.filter(a => a.status === 'pending'),
    ...applications.filter(a => a.status === 'under_review'),
  ].slice(0, 5)

  // Safe avg_rating — Supabase may return numeric as string in some versions
  const avgRating = Number(company.avg_rating ?? 0)

  return (
    <DashboardShell name={company.name} role="company">

      {/* ── Header ── */}
      <div className="mb-8">
        <p className="text-[10px] font-semibold tracking-widest mb-1.5"
          style={{ color: '#3B82F6', fontFamily: 'var(--font-mono)' }}>
          COMPANY PORTAL
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
          {company.name}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          {company.industry} · {company.location}
          {company.size ? ` · ${company.size}` : ''}
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {[
          { label: 'TOTAL APPLICATIONS', value: total,                   color: 'var(--color-tx)' },
          { label: 'PENDING',            value: pending,                 color: '#F59E0B'          },
          { label: 'UNDER REVIEW',       value: underReview,             color: '#3B82F6'          },
          { label: 'ACCEPTED',           value: accepted,                color: '#10B981'          },
          { label: 'SLOTS REMAINING',    value: company.slots_available, color: company.slots_available > 0 ? '#10B981' : '#EF4444' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4"
            style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] mb-2"
              style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
              {s.label}
            </p>
            <p className="text-3xl font-extrabold leading-none"
              style={{ fontFamily: 'var(--font-heading)', color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── No slots warning ── */}
      {company.slots_available === 0 && accepted > 0 && (
        <div className="flex items-start gap-3 px-5 py-4 rounded-2xl mb-6"
          style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <span className="text-lg leading-none">⚠</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#F59E0B' }}>
              No slots remaining
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
              You have filled all internship positions. Go to Settings to increase your slot count if needed.
            </p>
          </div>
        </div>
      )}

      {/* ── Priority actions ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
            {pending + underReview > 0 ? 'Needs Your Attention' : 'Applications'}
          </h2>
          {total > 5 && (
            <Link href="/dashboard/company/applications"
              className="text-sm"
              style={{ color: '#3B82F6', textDecoration: 'none' }}>
              View all {total} →
            </Link>
          )}
        </div>

        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl"
            style={{ background: '#101A2E', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(59,130,246,0.1)' }}>
              <svg className="w-7 h-7" style={{ color: '#3B82F6' }} fill="none"
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
              No applications yet
            </p>
            <p className="text-sm text-center max-w-xs" style={{ color: 'var(--color-muted)' }}>
              Students will be able to find and apply to your company from the Browse Companies page.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {(priority.length > 0 ? priority : applications.slice(0, 5)).map(app => {
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
                <div key={app.id} className="p-5 rounded-2xl"
                  style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-start gap-4">

                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6',
                               fontFamily: 'var(--font-heading)' }}>
                      {initials}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-semibold text-sm"
                            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
                            {student ? `${student.first_name} ${student.last_name}` : 'Unknown Student'}
                          </p>
                          <p className="text-xs mt-0.5"
                            style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                            {student?.reg_number} · {student?.department} · Level {student?.level}
                          </p>
                        </div>
                        {/* Status badge */}
                        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0"
                          style={{ background: cfg.bg, color: cfg.color, fontFamily: 'var(--font-mono)' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                          {cfg.label}
                        </span>
                      </div>

                      {/* Role + university */}
                      <div className="mt-2 flex items-center gap-3 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded"
                          style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-tx)' }}>
                          Applying for: <strong>{role}</strong>
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
                            <a href={app.document_url} target="_blank" rel="noopener noreferrer"
                              className="text-xs flex items-center gap-1 hover:opacity-80 transition-opacity"
                              style={{ color: '#3B82F6', textDecoration: 'none' }}>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                              </svg>
                              View Document
                            </a>
                          )}
                        </div>

                        {/* Action buttons */}
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

            {total > 5 && (
              <Link href="/dashboard/company/applications"
                className="text-center py-3.5 rounded-xl text-sm hover:opacity-80 transition-opacity"
                style={{
                  background:     'rgba(255,255,255,0.03)',
                  border:         '1px solid rgba(255,255,255,0.06)',
                  color:          '#3B82F6',
                  textDecoration: 'none',
                  display:        'block',
                }}>
                View all {total} applications →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Company profile summary ── */}
      <div className="p-5 rounded-2xl"
        style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
            Company Profile
          </h2>
          <Link href="/dashboard/company/settings"
            className="text-xs"
            style={{ color: '#3B82F6', textDecoration: 'none' }}>
            Edit →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {([
            ['Industry',       company.industry],
            ['Location',       company.location],
            ['Company Size',   company.size ?? '—'],
            ['Open Slots',     String(company.slots_available)],
            ['Average Rating', avgRating > 0 ? `${avgRating.toFixed(1)} / 5` : 'No reviews yet'],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label}>
              <p className="text-[10px] mb-0.5"
                style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                {label}
              </p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-tx)' }}>{value}</p>
            </div>
          ))}
        </div>
        {company.description && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[10px] mb-1"
              style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
              ABOUT
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              {company.description}
            </p>
          </div>
        )}
      </div>

    </DashboardShell>
  )
}