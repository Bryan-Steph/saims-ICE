import { redirect } from 'next/navigation'
import Link          from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { DashboardShell } from '@/components/ui/DashboardShell'

type ReportRow = {
  student_id:   string
  week_number:  number
  status:       'submitted' | 'reviewed'
  submitted_at: string
  students: {
    first_name: string; last_name: string
    reg_number: string; department: string; university: string
  } | null
  companies: { name: string } | null
}

export default async function SupervisorStudentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: supervisor } = await supabase
    .from('supervisors')
    .select('id, title, full_name')
    .eq('user_id', user.id)
    .single()

  if (!supervisor) redirect('/auth/login')

  const { data: rows } = await supabase
    .from('reports')
    .select(`
      student_id, week_number, status, submitted_at,
      students ( first_name, last_name, reg_number, department, university ),
      companies ( name )
    `)
    .eq('supervisor_id', supervisor.id)
    .order('submitted_at', { ascending: false })

  const reports = (rows ?? []) as unknown as ReportRow[]

  // Build one row per student
  const map = new Map<string, {
    name: string; reg: string; dept: string; uni: string
    company: string; total: number; pending: number
  }>()

  for (const r of reports) {
    if (!r.students) continue
    if (!map.has(r.student_id)) {
      map.set(r.student_id, {
        name:    `${r.students.first_name} ${r.students.last_name}`,
        reg:     r.students.reg_number,
        dept:    r.students.department,
        uni:     r.students.university,
        company: r.companies?.name ?? 'Unassigned',
        total:   0,
        pending: 0,
      })
    }
    const s = map.get(r.student_id)!
    s.total++
    if (r.status === 'submitted') s.pending++
  }

  const students = Array.from(map.values())

  return (
    <DashboardShell name={supervisor.full_name} role="supervisor">

      <div className="mb-6">
        <p className="text-[10px] font-semibold tracking-widest mb-1.5"
          style={{ color: '#3B82F6', fontFamily: 'var(--font-mono)' }}>
          MY STUDENTS
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
          Student Placements
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          {students.length} student{students.length !== 1 ? 's' : ''} under your supervision
        </p>
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl"
          style={{ background: '#101A2E', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="font-semibold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
            No students yet
          </p>
          <p className="text-sm text-center max-w-sm" style={{ color: 'var(--color-muted)' }}>
            Students appear here after submitting their first weekly report with you as supervisor.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}>

          {/* Header row */}
          <div className="hidden sm:grid px-5 py-3 text-[10px] font-semibold"
            style={{
              gridTemplateColumns: '1fr 150px 150px 140px 120px',
              color:               'var(--color-muted)',
              fontFamily:          'var(--font-mono)',
              borderBottom:        '1px solid rgba(255,255,255,0.05)',
            }}>
            {['STUDENT', 'DEPARTMENT', 'COMPANY', 'COMPLIANCE', 'ACTION'].map(h => (
              <span key={h}>{h}</span>
            ))}
          </div>

          {/* Student rows */}
          {students.map((s, i) => (
            <div
              key={s.reg}
              className="flex flex-col sm:grid px-5 py-4 gap-3 sm:gap-0 sm:items-center"
              style={{
                gridTemplateColumns: '1fr 150px 150px 140px 120px',
                borderBottom: i < students.length - 1
                  ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              {/* Student */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6',
                           fontFamily: 'var(--font-heading)' }}>
                  {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-tx)' }}>
                    {s.name}
                  </p>
                  <p className="text-[10px]"
                    style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                    {s.reg}
                  </p>
                </div>
              </div>

              {/* Department */}
              <p className="text-xs sm:text-sm" style={{ color: 'var(--color-muted)' }}>
                {s.dept}
              </p>

              {/* Company */}
              <p className="text-xs sm:text-sm" style={{ color: 'var(--color-tx)' }}>
                {s.company}
              </p>

              {/* Compliance */}
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: s.pending > 0 ? '#F59E0B' : '#10B981' }} />
                <span className="text-xs"
                  style={{ color: s.pending > 0 ? '#F59E0B' : '#10B981' }}>
                  {s.pending > 0
                    ? `${s.pending} need${s.pending === 1 ? 's' : ''} review`
                    : `${s.total} reviewed`}
                </span>
              </div>

              {/* Action */}
              <Link
                href="/dashboard/supervisor/reports"
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80 self-start sm:self-auto"
                style={{
                  background:     'rgba(59,130,246,0.1)',
                  color:          '#3B82F6',
                  border:         '1px solid rgba(59,130,246,0.2)',
                  textDecoration: 'none',
                }}
              >
                View Reports
              </Link>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}