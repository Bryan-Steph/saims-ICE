import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { DashboardShell } from '@/components/ui/DashboardShell'
import { SupervisorSettingsForm } from '@/components/ui/SupervisorSettingsForm'

export default async function SupervisorSettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: supervisor } = await supabase
    .from('supervisors')
    .select('id, title, full_name, institution, department, staff_id')
    .eq('user_id', user.id)
    .single()

  if (!supervisor) redirect('/auth/login')

  return (
    <DashboardShell name={supervisor.full_name} role="supervisor">
      <div className="mb-6">
        <p className="text-[10px] font-semibold tracking-widest mb-1.5"
          style={{ color: '#3B82F6', fontFamily: 'var(--font-mono)' }}>
          ACCOUNT SETTINGS
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
          Edit Profile
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          Update your details so students can find and select you correctly
        </p>
      </div>
      <SupervisorSettingsForm supervisor={supervisor} />
    </DashboardShell>
  )
}