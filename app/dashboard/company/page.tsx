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

export default async function CompanyDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('companies')
    .select('name, industry, location, size, slots_available, description')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  const { count: totalApps }   = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('company_id', user.id)
  const { count: pendingApps } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('company_id', user.id).eq('status', 'pending')
  const { count: accepted }    = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('company_id', user.id).eq('status', 'accepted')

  return (
    <DashboardShell name={profile.name} role="company">

      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            {profile.name}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge status="neutral">{profile.industry}</Badge>
            <Badge status="neutral">{profile.location}</Badge>
            <Badge status="neutral">{profile.size} employees</Badge>
          </div>
        </div>
        <a
          href="/dashboard/company/slots"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          Manage Slots →
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Open Slots"     value={profile.slots_available ?? 0} sub="Available for interns"  color="var(--color-success)"  />
        <StatCard label="Applications"   value={totalApps   ?? 0}             sub="Total received"         color="var(--color-tx)"       />
        <StatCard label="Pending Review" value={pendingApps ?? 0}             sub="Awaiting your response" color="var(--color-warning)"  />
        <StatCard label="Active Interns" value={accepted    ?? 0}             sub="Currently placed"       color="var(--color-accent)"   />
      </div>

      {/* Setup guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card card-p-md">
          <h2 className="font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Setup checklist</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}>
            Start receiving intern applications.
          </p>
          <ol className="flex flex-col gap-3">
            {[
              { step: '01', label: 'Profile created',              done: true },
              { step: '02', label: 'Add available internship slots', done: false },
              { step: '03', label: 'Review incoming applications',  done: false },
              { step: '04', label: 'Accept interns & track reports', done: false },
            ].map(item => (
              <li key={item.step} className="flex items-center gap-3">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    background: item.done ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                    color:      item.done ? 'var(--color-success)'  : 'var(--color-muted)',
                    border:     `1px solid ${item.done ? 'rgba(16,185,129,0.25)' : 'var(--color-border)'}`,
                  }}
                >
                  {item.done ? '✓' : item.step}
                </span>
                <span className="text-sm" style={{ color: item.done ? 'var(--color-muted)' : 'var(--color-tx)', textDecoration: item.done ? 'line-through' : 'none' }}>
                  {item.label}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="card card-p-md flex flex-col items-center justify-center text-center gap-3" style={{ minHeight: '14rem' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
            <svg className="w-6 h-6" style={{ color: 'var(--color-success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>No applications yet</p>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Add internship slots so students can start applying.
          </p>
          <a href="/dashboard/company/slots" className="mt-1 text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
            Add slots →
          </a>
        </div>
      </div>

    </DashboardShell>
  )
}