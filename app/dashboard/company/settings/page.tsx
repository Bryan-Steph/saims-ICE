import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { DashboardShell } from '@/components/ui/DashboardShell'
import { CompanySettingsForm } from '@/components/ui/CompanySettingsForm'

export default async function CompanySettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, industry, location, size, description, slots_available')
    .eq('user_id', user.id)
    .single()

  if (!company) redirect('/auth/login')

  return (
    <DashboardShell name={company.name} role="company">
      <div className="mb-6">
        <p className="text-[10px] font-semibold tracking-widest mb-1.5"
          style={{ color: '#3B82F6', fontFamily: 'var(--font-mono)' }}>
          COMPANY SETTINGS
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
          Edit Profile
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          Update your company information and manage internship slot availability
        </p>
      </div>

      <CompanySettingsForm company={company} />
    </DashboardShell>
  )
}