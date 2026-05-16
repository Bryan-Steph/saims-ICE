import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase-server'
import { DashboardShell } from '@/components/ui/DashboardShell'
import { Badge }          from '@/components/ui/Badge'

function StatCard({ label, value, sub, color }: {
  label: string; value: string | number; sub: string; color: string
}) {
  return (
    <div className="card card-p-md flex flex-col gap-3">
      <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{label}</p>
      <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color }}>{value}</p>
      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{sub}</p>
    </div>
  )
}

export default async function SupervisorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('supervisors')
    .select('title, full_name, institution, department, staff_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  const displayName = `${profile.title} ${profile.full_name}`

  const { count: totalStudents }  = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('supervisor_id', user.id)
  const { count: pendingReports } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('supervisor_id', user.id).eq('status', 'submitted')
  const { count: reviewedReports }= await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('supervisor_id', user.id).eq('status', 'reviewed')

  return (
    <DashboardShell name={displayName} role="supervisor">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
          Good day, {profile.title} {profile.full_name.split(' ')[0]} 👋
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge status="neutral">{profile.department}</Badge>
          <Badge status="neutral">{profile.institution}</Badge>
          <span className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
            ID: {profile.staff_id}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Reports"   value={totalStudents   ?? 0} sub="Across all students"   color="var(--color-tx)"      />
        <StatCard label="Pending Review"  value={pendingReports  ?? 0} sub="Awaiting your feedback" color="var(--color-warning)"  />
        <StatCard label="Reviewed"        value={reviewedReports ?? 0} sub="Feedback given"         color="var(--color-success)"  />
      </div>

      {/* Info + empty state */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card card-p-md">
          <h2 className="font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>How it works</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}>
            Your workflow as an attachment supervisor.
          </p>
          <ol className="flex flex-col gap-4">
            {[
              { step: '01', label: 'Students are assigned to you by the system', desc: 'You will see their placement details here.' },
              { step: '02', label: 'Students submit weekly reports',              desc: 'Each week they log tasks, skills, and challenges.' },
              { step: '03', label: 'You review and leave written feedback',       desc: 'Reports marked reviewed are visible to students.' },
            ].map(item => (
              <li key={item.step} className="flex gap-3">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5"
                  style={{ fontFamily: 'var(--font-mono)', background: 'rgba(245,158,11,0.1)', color: 'var(--color-warning)', border: '1px solid rgba(245,158,11,0.2)' }}
                >
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-tx)' }}>{item.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="card card-p-md flex flex-col items-center justify-center text-center gap-3" style={{ minHeight: '14rem' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
            <svg className="w-6 h-6" style={{ color: 'var(--color-warning)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <p className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>No students assigned yet</p>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Students will appear here once they are placed and assigned to you.
          </p>
        </div>
      </div>

    </DashboardShell>
  )
}