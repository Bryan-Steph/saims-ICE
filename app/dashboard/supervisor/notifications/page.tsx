import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase-server'
import { DashboardShell } from '@/components/ui/DashboardShell'

export default async function SupervisorNotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: supervisor } = await supabase
    .from('supervisors')
    .select('full_name')
    .eq('user_id', user.id)
    .single()

  if (!supervisor) redirect('/auth/register')

  return (
    <DashboardShell name={supervisor.full_name} role="supervisor">
      <div className="mb-8">
        <p className="text-[10px] font-semibold tracking-widest mb-1.5"
          style={{ color: '#3B82F6', fontFamily: 'var(--font-mono)' }}>
          NOTIFICATIONS
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
          Notifications
        </h1>
      </div>
      <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl"
        style={{ background: '#101A2E', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(59,130,246,0.1)' }}>
          <svg className="w-7 h-7" style={{ color: '#3B82F6' }} fill="none"
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-semibold mb-1"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
            No notifications yet
          </p>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            You will be notified when a students report needs your review.
          </p>
        </div>
      </div>
    </DashboardShell>
  )
}