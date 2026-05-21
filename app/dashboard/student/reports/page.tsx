import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { DashboardShell } from '@/components/ui/DashboardShell'
import { ReportForm } from '@/components/ui/ReportForm'

type Placement = {
  company_id: string
  companies: { name: string; industry: string } | null
}

type Report = {
  id:               string
  week_number:      number
  tasks_done:       string
  skills_developed: string
  challenges:       string
  feedback:         string | null
  status:           'submitted' | 'reviewed'
  submitted_at:     string
  supervisors:      { full_name: string; title: string } | null
}

export default async function StudentReportsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: student } = await supabase
    .from('students')
    .select('id, first_name')
    .eq('user_id', user.id)
    .single()

  if (!student) redirect('/auth/login')

  // Must have accepted placement to submit reports
  const { data: placementRow } = await supabase
    .from('applications')
    .select('company_id, companies ( name, industry )')
    .eq('student_id', student.id)
    .eq('status', 'accepted')
    .maybeSingle()

  const placement = placementRow as unknown as Placement | null

  // All supervisors for dropdown
  const { data: supervisorRows } = await supabase
    .from('supervisors')
    .select('id, full_name, title, department')
    .order('full_name')

  const supervisors = supervisorRows ?? []

  // Submitted reports
  const { data: reportRows } = await supabase
    .from('reports')
    .select(`
      id, week_number, tasks_done, skills_developed, challenges,
      feedback, status, submitted_at,
      supervisors ( full_name, title )
    `)
    .eq('student_id', student.id)
    .order('week_number', { ascending: false })

  const reports     = (reportRows ?? []) as unknown as Report[]
  const submittedWeeks = reports.map(r => r.week_number)

  return (
    <DashboardShell name={student.first_name} role="student">

      <div className="mb-6">
        <p className="text-[10px] font-semibold tracking-widest mb-1.5"
          style={{ color: '#3B82F6', fontFamily: 'var(--font-mono)' }}>
          WEEKLY REPORTS
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
          Attachment Reports
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          Submit your weekly progress reports for supervisor review
        </p>
      </div>

      {!placement ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl"
          style={{ background: '#101A2E', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(245,158,11,0.1)' }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24"
              stroke="#F59E0B" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <p className="font-semibold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
            No confirmed placement yet
          </p>
          <p className="text-sm text-center max-w-sm" style={{ color: 'var(--color-muted)' }}>
            You can only submit weekly reports once a company has accepted your application.
          </p>
        </div>
      ) : (
        <>
          {/* Placement banner */}
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl mb-6"
            style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <span className="text-xl">🏢</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#10B981' }}>
                {placement.companies?.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                {placement.companies?.industry} · Confirmed placement
              </p>
            </div>
          </div>

          <ReportForm
            studentId={student.id}
            companyId={placement.company_id}
            supervisors={supervisors}
            submittedWeeks={submittedWeeks}
          />

          {reports.length > 0 && (
            <div className="mt-4">
              <h2 className="text-lg font-bold mb-4"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
                Submitted Reports ({reports.length})
              </h2>
              <div className="flex flex-col gap-3">
                {reports.map(report => (
                  <div key={report.id} className="p-5 rounded-2xl"
                    style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                      <div>
                        <p className="font-semibold text-sm"
                          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
                          Week {report.week_number}
                        </p>
                        <p className="text-xs mt-0.5"
                          style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                          {report.supervisors
                            ? `${report.supervisors.title} ${report.supervisors.full_name}`
                            : 'No supervisor assigned'}
                          {' · '}
                          {new Date(report.submitted_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: report.status === 'reviewed'
                            ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                          color:      report.status === 'reviewed' ? '#10B981' : '#F59E0B',
                          fontFamily: 'var(--font-mono)',
                        }}>
                        {report.status === 'reviewed' ? '✓ Reviewed' : 'Awaiting Review'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
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

                    {report.feedback && (
                      <div className="mt-3 pt-3 px-4 py-3 rounded-xl"
                        style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
                        <p className="text-[10px] mb-1"
                          style={{ color: '#10B981', fontFamily: 'var(--font-mono)' }}>
                          SUPERVISOR FEEDBACK
                        </p>
                        <p className="text-xs leading-relaxed italic" style={{ color: 'var(--color-tx)' }}>
                          &ldquo;{report.feedback}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  )
}