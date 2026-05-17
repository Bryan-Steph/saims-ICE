import { redirect } from 'next/navigation'
import Link         from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { DashboardShell } from '@/components/ui/DashboardShell'

type Application = {
  id:           string
  status:       'pending' | 'under_review' | 'accepted' | 'declined'
  applied_at:   string
  motivation:   string
  document_url: string | null
  companies: {
    name: string; industry: string; location: string
  } | null
}

const STATUS_CFG: Record<Application['status'], { label: string; bg: string; color: string; dot: string }> = {
  pending:      { label: 'Pending',      bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B', dot: '#F59E0B' },
  under_review: { label: 'Under Review', bg: 'rgba(59,130,246,0.12)',  color: '#3B82F6', dot: '#3B82F6' },
  accepted:     { label: 'Accepted',     bg: 'rgba(16,185,129,0.12)',  color: '#10B981', dot: '#10B981' },
  declined:     { label: 'Declined',     bg: 'rgba(239,68,68,0.12)',   color: '#EF4444', dot: '#EF4444' },
}

function extractRole(motivation: string): string {
  return motivation.match(/PREFERRED ROLE:\s*(.+)/)?.[1]?.trim() ?? 'Not specified'
}

export default async function StudentApplicationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: student } = await supabase
    .from('students')
    .select('id, first_name')
    .eq('user_id', user.id)
    .single()

  if (!student) redirect('/auth/login')

  const { data: rows } = await supabase
    .from('applications')
    .select(`
      id, status, applied_at, motivation, document_url,
      companies ( name, industry, location )
    `)
    .eq('student_id', student.id)
    .order('applied_at', { ascending: false })

  const applications = (rows ?? []) as unknown as Application[]

  const counts: Record<Application['status'], number> = {
    pending:      applications.filter(a => a.status === 'pending').length,
    under_review: applications.filter(a => a.status === 'under_review').length,
    accepted:     applications.filter(a => a.status === 'accepted').length,
    declined:     applications.filter(a => a.status === 'declined').length,
  }

  return (
    <DashboardShell name={student.first_name} role="student">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-semibold tracking-widest mb-1.5"
          style={{ color: '#3B82F6', fontFamily: 'var(--font-mono)' }}>
          MY APPLICATIONS
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
          All Applications
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          {applications.length} total application{applications.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Stats */}
      {applications.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {([
            ['PENDING',      counts.pending,      '#F59E0B'],
            ['UNDER REVIEW', counts.under_review, '#3B82F6'],
            ['ACCEPTED',     counts.accepted,     '#10B981'],
            ['DECLINED',     counts.declined,     '#EF4444'],
          ] as [string, number, string][]).map(([label, value, color]) => (
            <div key={label} className="rounded-xl p-4"
              style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] mb-1"
                style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                {label}
              </p>
              <p className="text-2xl font-extrabold"
                style={{ fontFamily: 'var(--font-heading)', color }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl"
          style={{ background: '#101A2E', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="font-semibold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
            No applications yet
          </p>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Browse companies and submit your first application.
          </p>
          <Link href="/dashboard/student/companies"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: '#3B82F6', color: '#fff', textDecoration: 'none' }}>
            Browse Companies
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map(app => {
            const cfg     = STATUS_CFG[app.status]
            const company = app.companies
            const role    = extractRole(app.motivation)
            const date    = new Date(app.applied_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })
            const initials = company ? company.name.slice(0, 2).toUpperCase() : '??'

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
                          {company?.name ?? 'Unknown Company'}
                        </p>
                        <p className="text-xs mt-0.5"
                          style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                          {company?.industry} · {company?.location}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0"
                        style={{ background: cfg.bg, color: cfg.color, fontFamily: 'var(--font-mono)' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                        {cfg.label}
                      </span>
                    </div>

                    <div className="mt-2">
                      <span className="text-xs px-2 py-0.5 rounded"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-tx)' }}>
                        Role: <strong>{role}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-3 flex-wrap">
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
                      {app.status === 'accepted' && (
                        <span className="text-xs font-semibold" style={{ color: '#10B981' }}>
                          🎉 Placement confirmed!
                        </span>
                      )}
                      {app.status === 'declined' && (
                        <span className="text-xs" style={{ color: '#EF4444' }}>
                          Not successful — keep applying.
                        </span>
                      )}
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