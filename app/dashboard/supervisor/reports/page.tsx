import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { DashboardShell } from '@/components/ui/DashboardShell'
import { FeedbackForm } from '@/components/ui/FeedbackForm'

type Report = {
  id:               string
  week_number:      number
  tasks_done:       string
  skills_developed: string
  challenges:       string
  feedback:         string | null
  status:           'submitted' | 'reviewed'
  submitted_at:     string
  students:         { first_name: string; last_name: string; reg_number: string; department: string } | null
  companies:        { name: string } | null
}

export default async function SupervisorReportsPage() {
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
      id, week_number, tasks_done, skills_developed, challenges,
      feedback, status, submitted_at,
      students ( first_name, last_name, reg_number, department ),
      companies ( name )
    `)
    .eq('supervisor_id', supervisor.id)
    .order('submitted_at', { ascending: false })

  const reports  = (rows ?? []) as unknown as Report[]
  const pending  = reports.filter(r => r.status === 'submitted').length

  return (
    <DashboardShell name={supervisor.full_name} role="supervisor">

      <div className="mb-6">
        <p className="text-[10px] font-semibold tracking-widest mb-1.5"
          style={{ color: '#3B82F6', fontFamily: 'var(--font-mono)' }}>
          STUDENT REPORTS
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
          All Reports
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          {reports.length} total · {pending} awaiting your feedback
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl"
          style={{ background: '#101A2E', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="font-semibold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
            No reports yet
          </p>
          <p className="text-sm text-center max-w-sm" style={{ color: 'var(--color-muted)' }}>
            Reports appear here when students submit them and assign you as their supervisor.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reports.map(report => {
            const student  = report.students
            const initials = student
              ? `${student.first_name[0]}${student.last_name[0]}`.toUpperCase()
              : '??'
            const date = new Date(report.submitted_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })

            return (
              <div key={report.id} className="p-5 rounded-2xl"
                style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6',
                             fontFamily: 'var(--font-heading)' }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-sm"
                          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
                          {student
                            ? `${student.first_name} ${student.last_name}`
                            : 'Unknown Student'}
                          <span className="ml-2 font-normal text-xs"
                            style={{ color: 'var(--color-muted)' }}>
                            — Week {report.week_number}
                          </span>
                        </p>
                        <p className="text-xs mt-0.5"
                          style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                          {student?.reg_number} · {student?.department}
                          {' · '}{report.companies?.name ?? '—'}
                          {' · '}{date}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                        style={{
                          background: report.status === 'reviewed'
                            ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                          color:      report.status === 'reviewed' ? '#10B981' : '#F59E0B',
                          fontFamily: 'var(--font-mono)',
                        }}>
                        {report.status === 'reviewed' ? '✓ Reviewed' : 'Needs Review'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Report content */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  {([
                    ['TASKS DONE',       report.tasks_done],
                    ['SKILLS DEVELOPED', report.skills_developed],
                    ['CHALLENGES FACED', report.challenges],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[10px] mb-1"
                        style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                        {label}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-tx)' }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Feedback or form */}
                {report.feedback ? (
                  <div className="p-4 rounded-xl"
                    style={{ background: 'rgba(16,185,129,0.07)',
                             border: '1px solid rgba(16,185,129,0.15)' }}>
                    <p className="text-[10px] mb-1"
                      style={{ color: '#10B981', fontFamily: 'var(--font-mono)' }}>
                      YOUR FEEDBACK
                    </p>
                    <p className="text-xs leading-relaxed italic" style={{ color: 'var(--color-tx)' }}>
                      &ldquo;{report.feedback}&rdquo;
                    </p>
                  </div>
                ) : (
                  <FeedbackForm reportId={report.id} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}