'use client'

import { useState }   from 'react'
import { useRouter }  from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Spinner }    from '@/components/ui/Spinner'

interface Props {
  applicationId:  string
  companyId:      string
  currentStatus:  'pending' | 'under_review' | 'accepted' | 'declined'
  slotsAvailable: number
}

type Action = 'under_review' | 'accepted' | 'declined'

export function ApplicationActions({
  applicationId, companyId, currentStatus, slotsAvailable,
}: Props) {
  const router          = useRouter()
  const [busy, setBusy] = useState<Action | null>(null)
  const [err,  setErr]  = useState<string | null>(null)

  async function act(next: Action) {
    if (next === 'accepted' && slotsAvailable <= 0) {
      setErr('No open slots remaining. Edit your company profile to add more.')
      return
    }
    setBusy(next)
    setErr(null)

    try {
      const supabase = createClient()

      const { error: appErr } = await supabase
        .from('applications')
        .update({ status: next, updated_at: new Date().toISOString() })
        .eq('id', applicationId)

      if (appErr) throw appErr

      // Decrement slots when accepting
      if (next === 'accepted') {
        const { error: slotErr } = await supabase
          .from('companies')
          .update({ slots_available: Math.max(0, slotsAvailable - 1) })
          .eq('id', companyId)
        if (slotErr) throw slotErr
      }

      router.refresh()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Action failed. Try again.')
    } finally {
      setBusy(null)
    }
  }

  // Terminal states — no more actions
  if (currentStatus === 'accepted') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
      style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', fontFamily: 'var(--font-mono)' }}>
      ✓ Accepted
    </span>
  )
  if (currentStatus === 'declined') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
      style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontFamily: 'var(--font-mono)' }}>
      ✕ Declined
    </span>
  )

  return (
    <div className="flex flex-col gap-2">
      {err && (
        <p className="text-xs px-1" style={{ color: '#EF4444' }}>{err}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {currentStatus === 'pending' && (
          <button onClick={() => act('under_review')} disabled={!!busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6',
                     border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
                     opacity: busy === 'under_review' ? 0.6 : 1 }}>
            {busy === 'under_review' ? <Spinner size="xs" /> : '◎ Review'}
          </button>
        )}
        <button onClick={() => act('accepted')}
          disabled={!!busy || slotsAvailable <= 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981',
                   border: 'none', cursor: (busy || slotsAvailable <= 0) ? 'not-allowed' : 'pointer',
                   opacity: (busy === 'accepted' || slotsAvailable <= 0) ? 0.6 : 1 }}>
          {busy === 'accepted' ? <Spinner size="xs" /> : '✓ Accept'}
        </button>
        <button onClick={() => act('declined')} disabled={!!busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444',
                   border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
                   opacity: busy === 'declined' ? 0.6 : 1 }}>
          {busy === 'declined' ? <Spinner size="xs" /> : '✕ Decline'}
        </button>
      </div>
    </div>
  )
}