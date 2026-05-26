'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Student = {
  id:         string
  first_name: string
  last_name:  string
  university: string
  department: string
  level:      string
  reg_number: string
}

const LEVELS = ['100L', '200L', '300L', '400L', '500L', 'HND1', 'HND2']

export function StudentSettingsForm({ student }: { student: Student }) {
  const router = useRouter()
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    first_name: student.first_name,
    last_name:  student.last_name,
    university: student.university,
    department: student.department,
    level:      student.level,
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setError('')
    setSuccess('')

    if (!form.first_name.trim() || !form.last_name.trim() ||
        !form.university.trim() || !form.department.trim() || !form.level) {
      setError('All fields are required.')
      return
    }

    setSaving(true)
    const supabase = createClient()

    const { error: dbErr } = await supabase
      .from('students')
      .update({
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim(),
        university: form.university.trim(),
        department: form.department.trim(),
        level:      form.level,
      })
      .eq('id', student.id)

    setSaving(false)

    if (dbErr) {
      setError('Failed to save. Please try again.')
      return
    }

    setSuccess('Profile updated successfully.')
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
          Personal Information
        </h2>

        {/* Read-only reg number */}
        <div className="mb-4 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] mb-0.5"
            style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
            MATRICULE NUMBER (cannot be changed)
          </p>
          <p className="text-sm font-medium" style={{ color: 'var(--color-tx)' }}>
            {student.reg_number}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'first_name', label: 'FIRST NAME' },
              { key: 'last_name',  label: 'LAST NAME'  },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-[10px] font-semibold mb-1.5 block"
                  style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                  {label}
                </label>
                <input
                  type="text"
                  value={form[key as keyof typeof form]}
                  onChange={e => set(key, e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: '#0D1526', border: '0.5px solid rgba(255,255,255,0.1)',
                           color: 'var(--color-tx)' }}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-[10px] font-semibold mb-1.5 block"
              style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
              UNIVERSITY
            </label>
            <input
              type="text"
              value={form.university}
              onChange={e => set('university', e.target.value)}
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
                LEVEL
              </label>
              <select
                value={form.level}
                onChange={e => set('level', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#0D1526', border: '0.5px solid rgba(255,255,255,0.1)',
                         color: 'var(--color-tx)' }}
              >
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
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