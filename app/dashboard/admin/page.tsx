import { createClient } from '@/lib/supabase-server'
import { redirect }     from 'next/navigation'
import { DashboardShell } from '@/components/ui/DashboardShell'
import Link             from 'next/link'

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: roleData } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id).single()

  if (!roleData || roleData.role !== 'admin') {
    redirect(`/dashboard/${roleData?.role ?? 'student'}`)
  }

  const [
    { count: pendingCo },
    { count: pendingSup },
    { count: approvedCo },
    { count: approvedSup },
    { count: rejectedCo },
    { count: rejectedSup },
    { count: totalCo },
    { count: totalSup },
    { count: totalSt },
  ] = await Promise.all([
    supabase.from('companies').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabase.from('supervisors').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabase.from('companies').select('*', { count: 'exact', head: true }).eq('verification_status', 'approved'),
    supabase.from('supervisors').select('*', { count: 'exact', head: true }).eq('verification_status', 'approved'),
    supabase.from('companies').select('*', { count: 'exact', head: true }).eq('verification_status', 'rejected'),
    supabase.from('supervisors').select('*', { count: 'exact', head: true }).eq('verification_status', 'rejected'),
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('supervisors').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }),
  ])

  const pendingTotal = (pendingCo ?? 0) + (pendingSup ?? 0)

  return (
    <DashboardShell name={user.email ?? 'Admin'} role="admin">
      <div className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#EEF4FF]"
              style={{ fontFamily: 'var(--font-heading)' }}>
            Admin Overview
          </h1>
          <p className="mt-1 text-sm text-[#8BA4C8]">
            Platform management · {user.email}
          </p>
        </div>

        {/* Attention banner */}
        {pendingTotal > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-5 py-3">
            <span className="text-[#F59E0B]">⚠</span>
            <p className="text-sm font-medium text-[#F59E0B]">
              {pendingTotal} verification{pendingTotal !== 1 ? 's' : ''} awaiting your review
            </p>
          </div>
        )}

        {/* Verification Queue */}
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#8BA4C8]">
            Verification Queue
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <Link href="/dashboard/admin/companies"
                  className="group block rounded-xl border border-[#1E2D4A] bg-[#101A2E] p-5 transition-all hover:border-[#F59E0B]/40 hover:bg-[#0F1929]">
              <p className="text-4xl font-bold text-[#F59E0B]"
                 style={{ fontFamily: 'var(--font-heading)' }}>
                {pendingCo ?? 0}
              </p>
              <p className="mt-1 font-medium text-[#EEF4FF]">Pending Companies</p>
              <p className="mt-1.5 text-xs text-[#8BA4C8] transition-colors group-hover:text-[#F59E0B]">
                {approvedCo ?? 0} approved · {rejectedCo ?? 0} rejected · Review →
              </p>
            </Link>

            <Link href="/dashboard/admin/supervisors"
                  className="group block rounded-xl border border-[#1E2D4A] bg-[#101A2E] p-5 transition-all hover:border-[#F59E0B]/40 hover:bg-[#0F1929]">
              <p className="text-4xl font-bold text-[#F59E0B]"
                 style={{ fontFamily: 'var(--font-heading)' }}>
                {pendingSup ?? 0}
              </p>
              <p className="mt-1 font-medium text-[#EEF4FF]">Pending Supervisors</p>
              <p className="mt-1.5 text-xs text-[#8BA4C8] transition-colors group-hover:text-[#F59E0B]">
                {approvedSup ?? 0} approved · {rejectedSup ?? 0} rejected · Review →
              </p>
            </Link>

          </div>
        </section>

        {/* Platform Stats */}
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#8BA4C8]">
            Platform Stats
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

            <div className="rounded-xl border border-[#1E2D4A] bg-[#101A2E] p-5">
              <p className="text-4xl font-bold text-[#3B82F6]"
                 style={{ fontFamily: 'var(--font-heading)' }}>
                {totalSt ?? 0}
              </p>
              <p className="mt-1 font-medium text-[#EEF4FF]">Students</p>
            </div>

            <div className="rounded-xl border border-[#1E2D4A] bg-[#101A2E] p-5">
              <p className="text-4xl font-bold text-[#10B981]"
                 style={{ fontFamily: 'var(--font-heading)' }}>
                {totalCo ?? 0}
              </p>
              <p className="mt-1 font-medium text-[#EEF4FF]">Companies</p>
            </div>

            <div className="rounded-xl border border-[#1E2D4A] bg-[#101A2E] p-5">
              <p className="text-4xl font-bold text-[#10B981]"
                 style={{ fontFamily: 'var(--font-heading)' }}>
                {totalSup ?? 0}
              </p>
              <p className="mt-1 font-medium text-[#EEF4FF]">Supervisors</p>
            </div>

          </div>
        </section>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/admin/companies"
                className="rounded-lg bg-[#3B82F6] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]">
            Manage Companies →
          </Link>
          <Link href="/dashboard/admin/supervisors"
                className="rounded-lg border border-[#1E2D4A] bg-[#101A2E] px-5 py-2.5 text-sm font-medium text-[#EEF4FF] transition-colors hover:bg-[#162038]">
            Manage Supervisors →
          </Link>
        </div>

      </div>
    </DashboardShell>
  )
}