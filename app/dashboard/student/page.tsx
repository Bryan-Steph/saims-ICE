import { redirect }        from 'next/navigation'
import { createClient }    from '@/lib/supabase-server'
import { DashboardShell }  from '@/components/ui/DashboardShell'
import { Badge }           from '@/components/ui/Badge'

// ─── Stat card (local, server-rendered) ───────────────────────────────────

function StatCard({ label, value, sub, color }: {
  label: string; value: string | number; sub: string; color: string
}) {
  return (
    <div className="card card-p-md flex flex-col gap-3">
      <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
        {label}
      </p>
      <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color }}>
        {value}
      </p>
      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{sub}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('students')
    .select('first_name, last_name, reg_number, department, level, university')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  const fullName = `${profile.first_name} ${profile.last_name}`

  // Application counts — will be real data from Sprint 3
  const { count: totalApps }    = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('student_id', user.id)
  const { count: pendingApps }  = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('student_id', user.id).eq('status', 'pending')
  const { count: acceptedApps } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('student_id', user.id).eq('status', 'accepted')
  const { count: totalReports } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('student_id', user.id)

  return (
    <DashboardShell name={fullName} role="student">

      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            Welcome back, {profile.first_name} 👋
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{profile.department}</span>
            <span style={{ color: 'var(--color-border)' }}>·</span>
            <Badge status="neutral">{profile.level}</Badge>
            <Badge status="neutral">{profile.reg_number}</Badge>
          </div>
        </div>
        <a
          href="/companies"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          Browse Companies →
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Applications"  value={totalApps    ?? 0} sub="Total submitted"    color="var(--color-tx)"      />
        <StatCard label="Under Review"  value={pendingApps  ?? 0} sub="Awaiting response"  color="var(--color-warning)"  />
        <StatCard label="Accepted"      value={acceptedApps ?? 0} sub="Placements secured" color="var(--color-success)"  />
        <StatCard label="Reports"       value={totalReports ?? 0} sub="Weeks submitted"    color="var(--color-accent)"   />
      </div>

      {/* Getting started */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card card-p-md">
          <h2 className="font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            Get started
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}>
            Complete these steps to secure your attachment.
          </p>
          <ol className="flex flex-col gap-3">
            {[
              { step: '01', label: 'Browse available companies',   done: false, href: '/companies' },
              { step: '02', label: 'Apply for an internship slot', done: false, href: '/companies' },
              { step: '03', label: 'Await company acceptance',     done: false, href: '#' },
              { step: '04', label: 'Submit your first weekly report', done: false, href: '/dashboard/student/reports' },
            ].map(item => (
              <li key={item.step} className="flex items-center gap-3">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
                  style={{
                    fontFamily:  'var(--font-mono)',
                    background:  item.done ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                    color:       item.done ? 'var(--color-success)'  : 'var(--color-muted)',
                    border:      `1px solid ${item.done ? 'rgba(16,185,129,0.25)' : 'var(--color-border)'}`,
                  }}
                >
                  {item.done ? '✓' : item.step}
                </span>
                <a href={item.href} className="text-sm transition-colors hover:text-white" style={{ color: item.done ? 'var(--color-muted)' : 'var(--color-tx)', textDecoration: item.done ? 'line-through' : 'none' }}>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </div>

        <div className="card card-p-md flex flex-col items-center justify-center text-center gap-3" style={{ minHeight: '14rem' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
            <svg className="w-6 h-6" style={{ color: 'var(--color-accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <p className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>No applications yet</p>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Browse companies and apply for your first attachment slot.
          </p>
          <a
            href="/companies"
            className="mt-1 text-sm font-medium transition-colors"
            style={{ color: 'var(--color-accent)' }}
          >
            Browse companies →
          </a>
        </div>
      </div>

    </DashboardShell>
  )
}