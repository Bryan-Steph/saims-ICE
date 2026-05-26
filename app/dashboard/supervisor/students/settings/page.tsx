import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { DashboardShell } from '@/components/ui/DashboardShell'
import { StudentSettingsForm } from '@/components/ui/StudentSettingsForm'

export default async function StudentSettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: student } = await supabase
    .from('students')
    .select('id, first_name, last_name, university, department, level, reg_number')
    .eq('user_id', user.id)
    .single()

  if (!student) redirect('/auth/login')

  return (
    <DashboardShell name={student.first_name} role="student">
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
          Keep your information up to date so companies and supervisors see accurate details
        </p>
      </div>
      <StudentSettingsForm student={student} />
    </DashboardShell>
  )
}