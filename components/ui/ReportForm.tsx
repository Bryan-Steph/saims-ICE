'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Supervisor = {
  id:         string
  full_name:  string
  title:      string
  department: string
}

type FormState = {
  week_number:      string
  supervisor_id:    string
  tasks_done:       string
  skills_developed: string
  challenges:       string
}

export function ReportForm({
  studentId,
  companyId,
  supervisors,
  submittedWeeks,
}: {
  studentId:      string
  companyId:      string
  supervisors:    Supervisor[]
  submittedWeeks: number[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState<FormState>({
    week_number:      '',
    supervisor_id:    '',
    tasks_done:       '',
    skills_developed: '',
    challenges:       '',
  })

  function set(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    setError('')

    if (!form.week_number || !form.supervisor_id ||
        !form.tasks_done  || !form.skills_developed || !form.challenges) {
      setError('All fields are required.')
      return
    }

    const weekNum = parseInt(form.week_number, 10)
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 52) {
      setError('Week number must be between 1 and 52.')
      return
    }

    if (submittedWeeks.includes(weekNum)) {
      setError(`You already submitted a report for Week ${weekNum}.`)
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error: dbError } = await supabase.from('reports').insert({
      student_id:       studentId,
      company_id:       companyId,
      supervisor_id:    form.supervisor_id,
      week_number:      weekNum,
      tasks_done:       form.tasks_done.trim(),
      skills_developed: form.skills_developed.trim(),
      challenges:       form.challenges.trim(),
      status:           'submitted',
      submitted_at:     new Date().toISOString(),
    })

    setLoading(false)

    if (dbError) {
      setError('Failed to submit. Please try again.')
      return
    }

    setSuccess(true)
    setForm({ week_number: '', supervisor_id: '', tasks_done: '', skills_developed: '', challenges: '' })
    router.refresh()
    setTimeout(() => setSuccess(false), 4000)
  }

  return (
    <div className="p-5 rounded-2xl mb-6"
      style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
      <h2 className="text-base font-bold mb-4"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
        Submit Weekly Report
      </h2>

      {error && (
        <div className="px-4 py-3 rounded-xl mb-4 text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                   border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="px-4 py-3 rounded-xl mb-4 text-sm"
          style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981',
                   border: '1px solid rgba(16,185,129,0.2)' }}>
          ✓ Report submitted successfully!
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-[10px] font-semibold mb-1.5 block"
            style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
            WEEK NUMBER
          </label>
          <input
            type="number"
            min={1}
            max={52}
            value={form.week_number}
            onChange={e => set('week_number', e.target.value)}
            placeholder="e.g. 1"
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: '#0D1526',
              border:     '0.5px solid rgba(255,255,255,0.1)',
              color:      'var(--color-tx)',
            }}
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold mb-1.5 block"
            style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
            YOUR SUPERVISOR
          </label>
          <select
            value={form.supervisor_id}
            onChange={e => set('supervisor_id', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: '#0D1526',
              border:     '0.5px solid rgba(255,255,255,0.1)',
              color:      form.supervisor_id ? 'var(--color-tx)' : 'var(--color-muted)',
            }}
          >
            <option value="">Select supervisor…</option>
            {supervisors.map(s => (
              <option key={s.id} value={s.id}>
                {s.title} {s.full_name} — {s.department}
              </option>
            ))}
          </select>
          {supervisors.length === 0 && (
            <p className="text-xs mt-1.5" style={{ color: '#F59E0B' }}>
              No supervisors registered yet. Contact your department.
            </p>
          )}
        </div>
      </div>

      {([
        { key: 'tasks_done'       as const, label: 'TASKS DONE THIS WEEK',   placeholder: 'Describe the tasks and activities you completed this week…' },
        { key: 'skills_developed' as const, label: 'SKILLS DEVELOPED',        placeholder: 'What new skills or knowledge did you gain?' },
        { key: 'challenges'       as const, label: 'CHALLENGES FACED',        placeholder: 'Describe any difficulties or obstacles you encountered…' },
      ]).map(({ key, label, placeholder }) => (
        <div key={key} className="mb-4">
          <label className="text-[10px] font-semibold mb-1.5 block"
            style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
            {label}
          </label>
          <textarea
            rows={3}
            value={form[key]}
            onChange={e => set(key, e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{
              background: '#0D1526',
              border:     '0.5px solid rgba(255,255,255,0.1)',
              color:      'var(--color-tx)',
            }}
          />
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ background: '#3B82F6', color: '#fff' }}
      >
        {loading ? 'Submitting…' : 'Submit Report'}
      </button>
    </div>
  )
}