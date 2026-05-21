import { redirect } from 'next/navigation'
import Link          from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { DashboardShell } from '@/components/ui/DashboardShell'

type ReportRow = {
  id:           string
  week_number:  number
  status:       'submitted' | 'reviewed'
  submitted_at: string
  students: { first_name: string; last_name: string; reg_number: string; department: string; university: string } | null
  companies: { name: string } | null
}

export default async function SupervisorDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: supervisor } = await supabase
    .from('supervisors')
    .select('id, title, full_name, institution, department')
    .eq('user_id', user.id)
    .single()

  if (!supervisor) redirect('/auth/login')

  const { data: rows } = await supabase
    .from('reports')
    .select(`
      id, week_number, status, submitted_at,
      students ( first_name, last_name, reg_number, department, university ),
      companies ( name )
    `)
    .eq('supervisor_id', supervisor.id)
    .order('submitted_at', { ascending: false })

  const reports = (rows ?? []) as unknown as ReportRow[]

  // Deduplicate into a student summary map
  const studentMap = new Map<string, {
    name: string; reg: string; dept: string; uni: string
    company: string; total: number; pending: number
  }>()

  for (const r of reports) {
    if (!r.students) continue
    const key = r.students.reg_number
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        name:    `${r.students.first_name} ${r.students.last_name}`,
        reg:     r.students.reg_number,
        dept:    r.students.department,
        uni:     r.students.university,
        company: r.companies?.name ?? '—',
        total:   0,
        pending: 0,
      })
    }
    const s = studentMap.get(key)!
    s.total++
    if (r.status === 'submitted') s.pending++
  }

  const students       = Array.from(studentMap.values())
  const pendingCount   = reports.filter(r => r.status === 'submitted').length

  return (
    <DashboardShell name={supervisor.full_name} role="supervisor">

      <div className="mb-8">
        <p className="text-[10px] font-semibold tracking-widest mb-1.5"
          style={{ color: '#3B82F6', fontFamily: 'var(--font-mono)' }}>
          SUPERVISOR PORTAL
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
          {supervisor.title} {supervisor.full_name}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          {supervisor.department} · {supervisor.institution}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {([
          ['STUDENTS',      students.length,  'var(--color-tx)'],
          ['TOTAL REPORTS', reports.length,   '#3B82F6'],
          ['NEEDS REVIEW',  pendingCount,     pendingCount > 0 ? '#F59E0B' : '#10B981'],
        ] as [string, number, string][]).map(([label, value, color]) => (
          <div key={label} className="rounded-xl p-4"
            style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] mb-2"
              style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
              {label}
            </p>
            <p className="text-3xl font-extrabold leading-none"
              style={{ fontFamily: 'var(--font-heading)', color }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Students list */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
          Your Students
        </h2>
        {reports.length > 0 && (
          <Link href="/dashboard/supervisor/reports"
            className="text-sm"
            style={{ color: '#3B82F6', textDecoration: 'none' }}>
            Review all reports →
          </Link>
        )}
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl"
          style={{ background: '#101A2E', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="font-semibold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
            No students yet
          </p>
          <p className="text-sm text-center max-w-sm" style={{ color: 'var(--color-muted)' }}>
            Students appear here once they submit a weekly report and select you as their supervisor.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {students.map(s => (
            <div key={s.reg} className="p-5 rounded-2xl"
              style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6',
                           fontFamily: 'var(--font-heading)' }}>
                  {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold text-sm"
                        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
                        {s.name}
                      </p>
                      <p className="text-xs mt-0.5"
                        style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                        {s.reg} · {s.dept} · {s.uni}
                      </p>
                    </div>
                    {s.pending > 0 && (
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                        style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B',
                                 fontFamily: 'var(--font-mono)' }}>
                        {s.pending} pending review
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-tx)' }}>
                      📍 {s.company}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {s.total} report{s.total !== 1 ? 's' : ''} submitted
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}