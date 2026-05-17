import { redirect }       from 'next/navigation'
import Link               from 'next/link'
import { createClient }   from '@/lib/supabase-server'
import { DashboardShell } from '@/components/ui/DashboardShell'

type Application = {
  id:         string
  status:     'pending' | 'under_review' | 'accepted' | 'declined'
  applied_at: string
  motivation: string
  document_url: string | null
  companies: { name: string; industry: string; location: string } | null
}

const STATUS_CONFIG = {
  pending:      { label: 'Pending',      bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B', dot: '#F59E0B' },
  under_review: { label: 'Under Review', bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', dot: '#3B82F6' },
  accepted:     { label: 'Accepted',     bg: 'rgba(16,185,129,0.12)', color: '#10B981', dot: '#10B981' },
  declined:     { label: 'Declined',     bg: 'rgba(239,68,68,0.12)',  color: '#EF4444', dot: '#EF4444' },
}

export default async function StudentDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch student profile
  const { data: student } = await supabase
    .from('students')
    .select('id, first_name, last_name, reg_number, department, university, level')
    .eq('user_id', user.id)
    .single()

  if (!student) redirect('/auth/login')

  // Fetch all applications with company info
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id, status, applied_at, motivation, document_url,
      companies ( name, industry, location )
    `)
    .eq('student_id', student.id)
    .order('applied_at', { ascending: false })

// New fixed line
const apps = (applications ?? []) as unknown as Application[]

  // Stats
  const total      = apps.length
  const pending    = apps.filter(a => a.status === 'pending').length
  const accepted   = apps.filter(a => a.status === 'accepted').length
  const underReview = apps.filter(a => a.status === 'under_review').length

  const displayName = `${student.first_name} ${student.last_name}`
  const initials    = `${student.first_name[0]}${student.last_name[0]}`.toUpperCase()

  return (
    <DashboardShell name={displayName} role="student">

      {/* ── Welcome header ── */}
      <div className="mb-8">
        <p className="text-[10px] font-semibold tracking-widest mb-1.5"
          style={{ color: '#3B82F6', fontFamily: 'var(--font-mono)' }}>
          STUDENT PORTAL
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
          Welcome back, {student.first_name}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          {student.department} · {student.university} · Level {student.level}
        </p>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'TOTAL APPLIED',  value: total,       color: 'var(--color-tx)', sub: 'companies'  },
          { label: 'PENDING',        value: pending,     color: '#F59E0B',          sub: 'awaiting reply' },
          { label: 'UNDER REVIEW',   value: underReview, color: '#3B82F6',          sub: 'being reviewed' },
          { label: 'ACCEPTED',       value: accepted,    color: '#10B981',          sub: 'placements'    },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4"
            style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] mb-2"
              style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
              {s.label}
            </p>
            <p className="text-3xl font-extrabold leading-none mb-1"
              style={{ fontFamily: 'var(--font-heading)', color: s.color }}>
              {s.value}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Browse CTA (only if no accepted placement yet) ── */}
      {accepted === 0 && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl mb-8"
          style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-tx)' }}>
              Find your placement
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
              Browse companies currently accepting interns and submit your application.
            </p>
          </div>
          <Link href="/dashboard/student/companies"
            className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: '#3B82F6', color: '#fff', textDecoration: 'none',
                     whiteSpace: 'nowrap' }}>
            Browse →
          </Link>
        </div>
      )}

      {/* ── Applications list ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
            My Applications
          </h2>
          {total > 0 && (
            <Link href="/dashboard/student/applications"
              className="text-sm"
              style={{ color: '#3B82F6', textDecoration: 'none' }}>
              View all →
            </Link>
          )}
        </div>

        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl"
            style={{ background: '#101A2E', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(59,130,246,0.1)' }}>
              <svg className="w-7 h-7" style={{ color: '#3B82F6' }} fill="none"
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold mb-1"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
                No applications yet
              </p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Start by browsing companies and submitting your first application.
              </p>
            </div>
            <Link href="/dashboard/student/companies"
              className="px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
              style={{ background: '#3B82F6', color: '#fff', textDecoration: 'none' }}>
              Browse Companies →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {apps.slice(0, 5).map(app => {
              const cfg      = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending
              const company  = app.companies
              const initials = company
                ? company.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                : '??'
              const appliedDate = new Date(app.applied_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              })

              return (
                <div key={app.id}
                  className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl"
                  style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}>

                  {/* Company initials avatar */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6',
                             fontFamily: 'var(--font-heading)' }}>
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-sm"
                          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
                          {company?.name ?? 'Unknown Company'}
                        </p>
                        <p className="text-xs mt-0.5"
                          style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                          {company?.industry} · {company?.location}
                        </p>
                      </div>
                      {/* Status badge */}
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0"
                        style={{ background: cfg.bg, color: cfg.color, fontFamily: 'var(--font-mono)' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                        {cfg.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        Applied {appliedDate}
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

                    {/* Accepted message */}
                    {app.status === 'accepted' && (
                      <div className="mt-3 px-3 py-2 rounded-lg text-xs"
                        style={{ background: 'rgba(16,185,129,0.08)',
                                 border: '1px solid rgba(16,185,129,0.15)',
                                 color: '#10B981' }}>
                        🎉 Congratulations! You have been accepted. Contact the company to confirm your start date.
                      </div>
                    )}
                    {app.status === 'declined' && (
                      <div className="mt-3 px-3 py-2 rounded-lg text-xs"
                        style={{ background: 'rgba(239,68,68,0.06)',
                                 border: '1px solid rgba(239,68,68,0.12)',
                                 color: '#FCA5A5' }}>
                        This application was not successful. Keep applying — there are other opportunities.
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {apps.length > 5 && (
              <Link href="/dashboard/student/applications"
                className="text-center py-3 rounded-xl text-sm hover:opacity-80 transition-opacity"
                style={{ background: 'rgba(255,255,255,0.03)',
                         border: '1px solid rgba(255,255,255,0.06)',
                         color: '#3B82F6', textDecoration: 'none' }}>
                View all {apps.length} applications →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Profile summary card ── */}
      <div className="mt-8 p-5 rounded-2xl"
        style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
            Your Profile
          </h2>
          <Link href="/dashboard/student/settings"
            className="text-xs"
            style={{ color: '#3B82F6', textDecoration: 'none' }}>
            Edit →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            ['Reg. Number',  student.reg_number],
            ['Department',   student.department],
            ['University',   student.university],
            ['Level',        student.level],
            ['Email',        user.email ?? '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-[10px] mb-0.5"
                style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                {label}
              </p>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-tx)' }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

    </DashboardShell>
  )
}