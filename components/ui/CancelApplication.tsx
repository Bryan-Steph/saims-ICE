'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export function CancelApplication({ applicationId }: { applicationId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCancel() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('applications').delete().eq('id', applicationId)
    router.refresh()
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
        style={{
          background: 'rgba(239,68,68,0.08)',
          color:      '#EF4444',
          border:     '1px solid rgba(239,68,68,0.2)',
        }}
      >
        Withdraw
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
        Withdraw this application?
      </span>
      <button
        onClick={handleCancel}
        disabled={loading}
        className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-50"
        style={{ background: '#EF4444', color: '#fff' }}
      >
        {loading ? '…' : 'Yes, withdraw'}
      </button>
      <button
        onClick={() => setConfirm(false)}
        className="text-xs px-3 py-1.5 rounded-lg"
        style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-muted)' }}
      >
        Keep
      </button>
    </div>
  )
}