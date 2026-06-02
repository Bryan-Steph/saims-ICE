import { redirect }             from 'next/navigation'
import { createClient }         from '@/lib/supabase-server'
import { DashboardShell }       from '@/components/ui/DashboardShell'
import { CompanySettingsForm }  from '@/components/ui/CompanySettingsForm'

export default async function CompanySettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, industry, location, size, description, slots_available, logo_url, gallery_urls, website')
    .eq('user_id', user.id)
    .single()

  if (!company) redirect('/auth/login')

  return (
    <DashboardShell name={company.name} role="company">
      <CompanySettingsForm
        company={company}
        userId={user.id}
        email={user.email ?? ''}
      />
    </DashboardShell>
  )
}