import { redirect }          from 'next/navigation'
import { createClient }      from '@/lib/supabase-server'
import { DashboardShell }    from '@/components/ui/DashboardShell'
import { NotificationFeed }  from '@/components/ui/NotificationFeed'

export default async function CompanyNotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('user_id', user.id)
    .single()
  if (!company) redirect('/auth/register')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, title, message, read, created_at')
    .eq('user_id', user.id)
    .order('read',       { ascending: true  })
    .order('created_at', { ascending: false })

  return (
    <DashboardShell name={company.name} role="company">
      <NotificationFeed notifications={notifications ?? []} />
    </DashboardShell>
  )
}