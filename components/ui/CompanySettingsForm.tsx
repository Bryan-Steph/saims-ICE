'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Company = {
  id:              string
  name:            string
  industry:        string
  location:        string
  size:            string | null
  description:     string | null
  slots_available: number
}

const INDUSTRIES = [
  'Telecom', 'Cybersecurity', 'Software', 'IT Services',
  'Training', 'Banking', 'Engineering', 'Healthcare',
  'Education', 'Finance', 'Other',
]
const SIZES = ['1–10', '11–50', '51–200', '201–500', '500+']

export function CompanySettingsForm({ company }: { company: Company }) {
  const router = useRouter()
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    name:            company.name,
    industry:        company.industry,
    location:        company.location,
    size:            company.size ?? '',
    description:     company.description ?? '',
    slots_available: company.slots_available,
  })

  function set(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setError('')
    setSuccess('')

    if (!form.name.trim() || !form.industry || !form.location.trim()) {
      setError('Name, industry and location are required.')
      return
    }
    if (form.slots_available < 0) {
      setError('Slots cannot be a negative number.')
      return
    }

    setSaving(true)
    const supabase = createClient()

    const { error: dbErr } = await supabase
      .from('companies')
      .update({
        name:            form.name.trim(),
        industry:        form.industry,
        location:        form.location.trim(),
        size:            form.size || null,
        description:     form.description.trim() || null,
        slots_available: form.slots_available,
      })
      .eq('id', company.id)

    setSaving(false)

    if (dbErr) {
      setError('Failed to save. Please try again.')
      return
    }

    setSuccess('Changes saved successfully.')
    router.refresh()
    setTimeout(() => setSuccess(''), 4000)
  }

  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>

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

      {/* Company info */}
      <div className="p-5 rounded-2xl"
        style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-sm font-bold mb-4"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
          Company Information
        </h2>

        <div className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="text-[10px] font-semibold mb-1.5 block"
              style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
              COMPANY NAME
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#0D1526', border: '0.5px solid rgba(255,255,255,0.1)',
                       color: 'var(--color-tx)' }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Industry */}
            <div>
              <label className="text-[10px] font-semibold mb-1.5 block"
                style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                INDUSTRY
              </label>
              <select
                value={form.industry}
                onChange={e => set('industry', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#0D1526', border: '0.5px solid rgba(255,255,255,0.1)',
                         color: 'var(--color-tx)' }}
              >
                {INDUSTRIES.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            {/* Size */}
            <div>
              <label className="text-[10px] font-semibold mb-1.5 block"
                style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                COMPANY SIZE
              </label>
              <select
                value={form.size}
                onChange={e => set('size', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#0D1526', border: '0.5px solid rgba(255,255,255,0.1)',
                         color: form.size ? 'var(--color-tx)' : 'var(--color-muted)' }}
              >
                <option value="">Select size</option>
                {SIZES.map(s => (
                  <option key={s} value={s}>{s} employees</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-[10px] font-semibold mb-1.5 block"
              style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
              LOCATION
            </label>
            <input
              type="text"
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="e.g. Bamenda, Cameroon"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#0D1526', border: '0.5px solid rgba(255,255,255,0.1)',
                       color: 'var(--color-tx)' }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-semibold mb-1.5 block"
              style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
              ABOUT THE COMPANY
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe what your company does and what interns can expect…"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ background: '#0D1526', border: '0.5px solid rgba(255,255,255,0.1)',
                       color: 'var(--color-tx)' }}
            />
          </div>
        </div>
      </div>

      {/* Slot management */}
      <div className="p-5 rounded-2xl"
        style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-sm font-bold mb-1"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
          Internship Slots
        </h2>
        <p className="text-xs mb-6" style={{ color: 'var(--color-muted)' }}>
          Set how many interns you can currently accommodate. This is displayed to students on your profile.
        </p>

        <div className="flex items-center justify-center gap-8">
          <button
            type="button"
            onClick={() => set('slots_available', Math.max(0, form.slots_available - 1))}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold transition-opacity hover:opacity-70"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                     border: '1px solid rgba(239,68,68,0.2)' }}
          >
            −
          </button>

          <div className="text-center">
            <p className="text-6xl font-extrabold"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)', lineHeight: 1 }}>
              {form.slots_available}
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
              slots available
            </p>
          </div>

          <button
            type="button"
            onClick={() => set('slots_available', form.slots_available + 1)}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold transition-opacity hover:opacity-70"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981',
                     border: '1px solid rgba(16,185,129,0.2)' }}
          >
            +
          </button>
        </div>
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="px-8 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 self-start"
        style={{ background: '#3B82F6', color: '#fff' }}
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}