import { redirect }            from 'next/navigation'
import { createClient }        from '@/lib/supabase-server'
import { DashboardShell }      from '@/components/ui/DashboardShell'
import { StudentSettingsForm } from '@/components/ui/StudentSettingsForm'

export default async function StudentSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: student } = await supabase
    .from('students')
    .select('id, first_name, last_name, reg_number, department, university, level, avatar_url')
    .eq('user_id', user.id)
    .single()
  if (!student) redirect('/auth/register')

  return (
    <DashboardShell name={`${student.first_name} ${student.last_name}`} role="student">
      <StudentSettingsForm
        student={student}
        userId={user.id}
        email={user.email ?? ''}
      />
    </DashboardShell>
  )
}