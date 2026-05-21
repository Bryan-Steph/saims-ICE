'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export function FeedbackForm({ reportId }: { reportId: string }) {
  const [open,     setOpen]     = useState(false)
  const [feedback, setFeedback] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const router = useRouter()

  async function handleSubmit() {
    if (!feedback.trim()) {
      setError('Please write feedback before submitting.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: dbError } = await supabase
      .from('reports')
      .update({ feedback: feedback.trim(), status: 'reviewed' })
      .eq('id', reportId)

    setLoading(false)
    if (dbError) {
      setError('Failed to save. Please try again.')
      return
    }
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-80"
        style={{
          background: 'rgba(59,130,246,0.1)',
          color:      '#3B82F6',
          border:     '1px solid rgba(59,130,246,0.2)',
        }}
      >
        + Leave Feedback
      </button>
    )
  }

  return (
    <div className="mt-2">
      {error && (
        <p className="text-xs mb-2" style={{ color: '#EF4444' }}>{error}</p>
      )}
      <textarea
        rows={3}
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        placeholder="Write your feedback for this student's report…"
        className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-3"
        style={{
          background: '#0D1526',
          border:     '0.5px solid rgba(59,130,246,0.3)',
          color:      'var(--color-tx)',
        }}
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-5 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
          style={{ background: '#3B82F6', color: '#fff' }}
        >
          {loading ? 'Saving…' : 'Submit Feedback'}
        </button>
        <button
          onClick={() => { setOpen(false); setFeedback(''); setError('') }}
          className="px-5 py-2 rounded-lg text-xs"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-muted)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}