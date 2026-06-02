'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient }    from '@/lib/supabase'
import { DashboardShell }  from '@/components/ui/DashboardShell'
import { Spinner }         from '@/components/ui/Spinner'

type VerifStatus = 'pending' | 'approved' | 'rejected'

interface Company {
  id:                   string
  name:                 string
  industry:             string | null
  location:             string | null
  verification_status:  VerifStatus
  verification_doc_url: string | null
  verification_notes:   string | null
}

const STATUS_ORDER: Record<VerifStatus, number> = { pending: 0, approved: 1, rejected: 2 }

function StatusBadge({ status }: { status: VerifStatus }) {
  const map: Record<VerifStatus, { bg: string; color: string }> = {
    pending:  { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
    approved: { bg: 'rgba(16,185,129,0.15)', color: '#10B981' },
    rejected: { bg: 'rgba(239,68,68,0.15)',  color: '#EF4444' },
  }
  const { bg, color } = map[status]
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 6,
      fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.04em',
      textTransform: 'uppercase', background: bg, color,
      fontFamily: 'var(--font-mono)',
    }}>
      {status}
    </span>
  )
}

export default function AdminCompaniesPage() {
  const [companies,     setCompanies]    = useState<Company[]>([])
  const [signedUrls,    setSignedUrls]   = useState<Record<string, string>>({})
  const [loading,       setLoading]      = useState(true)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [rejectingId,   setRejectingId]  = useState<string | null>(null)
  const [rejectReason,  setRejectReason] = useState('')

  // 1. Core worker function (Does NOT call setLoading(true) synchronously)
  const loadData = useCallback(async () => {
    const sb = createClient()
    try {
      const { data, error } = await sb
        .from('companies')
        .select('id, name, industry, location, verification_status, verification_doc_url, verification_notes')

      if (error || !data) return

      const sorted = [...data].sort(
        (a, b) =>
          (STATUS_ORDER[a.verification_status as VerifStatus] ?? 3) -
          (STATUS_ORDER[b.verification_status as VerifStatus] ?? 3)
      )
      setCompanies(sorted)

      const urls: Record<string, string> = {}
      const docsToSign = sorted.filter(c => c.verification_doc_url)
      
      if (docsToSign.length > 0) {
        await Promise.all(
          docsToSign.map(async c => {
            const { data: urlData } = await sb.storage
              .from('verification-docs')
              .createSignedUrl(c.verification_doc_url!, 3600)
            if (urlData?.signedUrl) urls[c.id] = urlData.signedUrl
          })
        )
        setSignedUrls(urls)
      }
    } catch (err) {
      console.error("Data load error:", err)
    }
  }, [])

  // 2. Safe Mount Effect
  useEffect(() => {
    let isMounted = true

    async function initialize() {
      // Keep loading toggle cleanly wrapped inside the async execution flow
      setLoading(true)
      await loadData()
      if (isMounted) {
        setLoading(false)
      }
    }

    initialize()

    return () => {
      isMounted = false
    }
  }, [loadData])

  // 3. Action Handlers (Use silent background updates)
  async function handleApprove(id: string) {
    setActionLoading(p => ({ ...p, [id]: true }))
    const sb = createClient()
    
    await sb.from('companies')
      .update({ verification_status: 'approved', verification_notes: null })
      .eq('id', id)
      
    await loadData() 
    setActionLoading(p => ({ ...p, [id]: false }))
  }

  async function handleReject(id: string) {
    if (!rejectReason.trim()) return
    setActionLoading(p => ({ ...p, [id]: true }))
    const sb = createClient()
    
    await sb.from('companies')
      .update({ verification_status: 'rejected', verification_notes: rejectReason.trim() })
      .eq('id', id)
      
    setRejectingId(null)
    setRejectReason('')
    await loadData() 
    setActionLoading(p => ({ ...p, [id]: false }))
  }

  return (
    <DashboardShell name="Admin" role="admin">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#EEF4FF]"
                style={{ fontFamily: 'var(--font-heading)' }}>
              Company Verifications
            </h1>
            <p className="mt-1 text-sm text-[#8BA4C8]">
              Review and approve company registration documents
            </p>
          </div>
          {!loading && (
            <span className="text-sm text-[#8BA4C8]">{companies.length} total</span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <Spinner size="md" />
          </div>
        )}

        {/* Empty */}
        {!loading && companies.length === 0 && (
          <div className="rounded-xl border border-[#1E2D4A] bg-[#101A2E] p-10 text-center">
            <p className="text-[#8BA4C8]">No companies registered yet.</p>
          </div>
        )}

        {/* Company cards */}
        {!loading && companies.map(co => (
          <div key={co.id}
               className="rounded-xl border border-[#1E2D4A] bg-[#101A2E] p-5 space-y-4">

            <div className="flex flex-wrap items-start justify-between gap-4">
              {/* Info */}
              <div className="space-y-1 min-w-0">
                <StatusBadge status={co.verification_status} />
                <p className="text-base font-semibold text-[#EEF4FF] mt-1.5">
                  {co.name || '(unnamed)'}
                </p>
                <p className="text-sm text-[#8BA4C8]">
                  {co.industry || '—'} · {co.location || '—'}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {signedUrls[co.id] ? (
                  <a
                    href={signedUrls[co.id]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-[#1E2D4A] px-4 py-2 text-sm text-[#8BA4C8] transition-colors hover:border-[#3B82F6]/50 hover:text-[#3B82F6]"
                  >
                    View Doc ↗
                  </a>
                ) : co.verification_doc_url ? (
                  <span className="rounded-lg border border-[#1E2D4A] px-4 py-2 text-sm text-[#8BA4C8]/40 cursor-wait">
                    Loading…
                  </span>
                ) : (
                  <span className="rounded-lg border border-dashed border-[#1E2D4A] px-4 py-2 text-sm text-[#8BA4C8]/40">
                    No doc
                  </span>
                )}

                {co.verification_status !== 'approved' && (
                  <button
                    onClick={() => handleApprove(co.id)}
                    disabled={!!actionLoading[co.id]}
                    className="flex items-center gap-2 rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-2 text-sm font-medium text-[#10B981] transition-all hover:bg-[#10B981]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading[co.id] && <Spinner size="sm" />}
                    Approve
                  </button>
                )}

                {co.verification_status !== 'rejected' && (
                  <button
                    onClick={() => { setRejectingId(co.id); setRejectReason('') }}
                    disabled={!!actionLoading[co.id] || rejectingId === co.id}
                    className="flex items-center gap-2 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-2 text-sm font-medium text-[#EF4444] transition-all hover:bg-[#EF4444]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>

            {/* Stored rejection reason */}
            {co.verification_status === 'rejected' && co.verification_notes && (
              <div className="rounded-lg border border-[#EF4444]/20 bg-[#EF4444]/5 px-4 py-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#EF4444]">
                  Rejection Reason
                </p>
                <p className="text-sm text-[#EEF4FF]">{co.verification_notes}</p>
              </div>
            )}

            {/* Inline rejection form */}
            {rejectingId === co.id && (
              <div className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/5 p-4 space-y-3">
                <p className="text-sm font-medium text-[#EF4444]">
                  Rejection reason — this will be shown to the company
                </p>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. Submitted document is unclear. Please resubmit with a legible registration certificate."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-[#1E2D4A] bg-[#060B16] px-4 py-2.5 text-sm text-[#EEF4FF] placeholder:text-[#8BA4C8]/40 focus:outline-none focus:border-[#EF4444]/50"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setRejectingId(null); setRejectReason('') }}
                    className="rounded-lg border border-[#1E2D4A] px-4 py-2 text-sm text-[#8BA4C8] transition-colors hover:text-[#EEF4FF]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReject(co.id)}
                    disabled={!rejectReason.trim() || !!actionLoading[co.id]}
                    className="flex items-center gap-2 rounded-lg bg-[#EF4444] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {actionLoading[co.id] && <Spinner size="sm" />}
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}

          </div>
        ))}

      </div>
    </DashboardShell>
  )
}