'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Supervisor = {
  id:          string
  title:       string
  full_name:   string
  institution: string
  department:  string
  staff_id:    string
}

const TITLES = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.']

export function SupervisorSettingsForm({ supervisor }: { supervisor: Supervisor }) {
  const router = useRouter()
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    title:       supervisor.title,
    full_name:   supervisor.full_name,
    institution: supervisor.institution,
    department:  supervisor.department,
    staff_id:    supervisor.staff_id,
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setError('')
    setSuccess('')

    if (!form.full_name.trim() || !form.institution.trim() ||
        !form.department.trim() || !form.staff_id.trim()) {
      setError('All fields are required.')
      return
    }

    setSaving(true)
    const supabase = createClient()

    const { error: dbErr } = await supabase
      .from('supervisors')
      .update({
        title:       form.title,
        full_name:   form.full_name.trim(),
        institution: form.institution.trim(),
        department:  form.department.trim(),
        staff_id:    form.staff_id.trim(),
      })
      .eq('id', supervisor.id)

    setSaving(false)

    if (dbErr) {
      setError('Failed to save. Please try again.')
      return
    }

    setSuccess('Profile updated.')
    router.refresh()
    setTimeout(() => setSuccess(''), 4000)
  }

  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                   border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981',
                   border: '1px solid rgba(16,185,129,0.2)' }}>
          ✓ {success}
        </div>
      )}

      <div className="p-5 rounded-2xl"
        style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-sm font-bold mb-4"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
          Supervisor Profile
        </h2>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-[120px_1fr] gap-4">
            <div>
              <label className="text-[10px] font-semibold mb-1.5 block"
                style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                TITLE
              </label>
              <select
                value={form.title}
                onChange={e => set('title', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#0D1526', border: '0.5px solid rgba(255,255,255,0.1)',
                         color: 'var(--color-tx)' }}
              >
                {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1.5 block"
                style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                FULL NAME
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => set('full_name', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#0D1526', border: '0.5px solid rgba(255,255,255,0.1)',
                         color: 'var(--color-tx)' }}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold mb-1.5 block"
              style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
              INSTITUTION
            </label>
            <input
              type="text"
              value={form.institution}
              onChange={e => set('institution', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#0D1526', border: '0.5px solid rgba(255,255,255,0.1)',
                       color: 'var(--color-tx)' }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-semibold mb-1.5 block"
                style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                DEPARTMENT
              </label>
              <input
                type="text"
                value={form.department}
                onChange={e => set('department', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#0D1526', border: '0.5px solid rgba(255,255,255,0.1)',
                         color: 'var(--color-tx)' }}
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1.5 block"
                style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                STAFF ID
              </label>
              <input
                type="text"
                value={form.staff_id}
                onChange={e => set('staff_id', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#0D1526', border: '0.5px solid rgba(255,255,255,0.1)',
                         color: 'var(--color-tx)' }}
              />
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="px-8 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 self-start"
        style={{ background: '#3B82F6', color: '#fff' }}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}