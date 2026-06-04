'use client'

import { useState, useRef } from 'react'
import { useRouter }         from 'next/navigation'
import { createClient }      from '@/lib/supabase'

type Student = {
  id:          string
  first_name:  string
  last_name:   string
  reg_number:  string
  department:  string
  university:  string
  level:       string
avatar_url?: string | null}

interface Props {
  student: Student
  userId:  string
  email:   string
}

const LEVELS = ['100L', '200L', '300L', '400L', '500L', 'HND 1', 'HND 2', 'Masters']

function Field({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold mb-1.5"
        style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border:     '1px solid rgba(255,255,255,0.08)',
  color:      'var(--color-tx)',
  borderRadius: 12,
  padding:    '10px 16px',
  fontSize:   14,
  width:      '100%',
  outline:    'none',
}

const CARD: React.CSSProperties = {
  background: '#101A2E',
  border:     '0.5px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
  padding:    '20px 24px',
  marginBottom: 12,
}

export function StudentSettingsForm({ student, userId, email }: Props) {
  const router         = useRouter()
  const fileRef        = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    first_name:  student.first_name,
    last_name:   student.last_name,
    reg_number:  student.reg_number,
    department:  student.department,
    university:  student.university,
    level:       student.level,
  })

const [avatarUrl,     setAvatarUrl]     = useState<string | null>(student.avatar_url ?? null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploading,     setUploading]     = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  function set(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('File must be under 2 MB.'); return }

    // Immediate local preview
    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    setError(null)
    try {
      const sb   = createClient()
      const path = `${userId}/avatar`            // fixed path → upsert replaces old photo

      const { error: upErr } = await sb.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr

      const { data: { publicUrl } } = sb.storage
        .from('avatars')
        .getPublicUrl(path)

      // Bust browser cache with a timestamp
      setAvatarUrl(`${publicUrl}?t=${Date.now()}`)
    } catch {
      setError('Photo upload failed. Please try again.')
      setAvatarPreview(null)
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First and last name are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const sb = createClient()
      const { error: updateErr } = await sb
        .from('students')
        .update({
          first_name: form.first_name.trim(),
          last_name:  form.last_name.trim(),
          reg_number: form.reg_number.trim(),
          department: form.department.trim(),
          university: form.university.trim(),
          level:      form.level,
          avatar_url: avatarUrl,
        })
        .eq('id', student.id)
      if (updateErr) throw updateErr
  setSaved(true)
window.location.reload()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const displayAvatar = avatarPreview ?? avatarUrl
  const initials      = `${form.first_name[0] ?? ''}${form.last_name[0] ?? ''}`.toUpperCase()

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-8">
        <p className="text-[10px] font-semibold tracking-widest mb-1.5"
          style={{ color: '#3B82F6', fontFamily: 'var(--font-mono)' }}>
          STUDENT SETTINGS
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
          Edit Profile
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          Update your personal information and profile photo.
        </p>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
          {error}
        </div>
      )}

      {/* ── Profile Photo ── */}
      <div style={CARD}>
        <p className="text-sm font-semibold mb-5"
          style={{ color: 'var(--color-tx)', fontFamily: 'var(--font-heading)' }}>
          Profile Photo
        </p>
        <div className="flex items-center gap-5 flex-wrap">
          {/* Avatar circle */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.2)', position: 'relative' }}>
            {displayAvatar ? (
              <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold"
                style={{ color: '#3B82F6', fontFamily: 'var(--font-heading)' }}>
                {initials}
              </span>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.55)' }}>
                <div className="w-6 h-6 rounded-full border-2"
                  style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff',
                           animation: 'spin 0.7s linear infinite' }} />
              </div>
            )}
          </div>

          {/* Upload controls */}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
              style={{
                background: 'rgba(59,130,246,0.1)', color: '#3B82F6',
                border: '1px solid rgba(59,130,246,0.25)',
                cursor: uploading ? 'not-allowed' : 'pointer',
                display: 'block', marginBottom: 8,
              }}>
              {uploading ? 'Uploading…' : displayAvatar ? 'Change Photo' : 'Upload Photo'}
            </button>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              JPG, PNG or WebP · Max 2 MB
            </p>
          </div>
        </div>
      </div>

      {/* ── Personal Information ── */}
      <div style={CARD}>
        <p className="text-sm font-semibold mb-5"
          style={{ color: 'var(--color-tx)', fontFamily: 'var(--font-heading)' }}>
          Personal Information
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="FIRST NAME">
            <input type="text" value={form.first_name}
              onChange={e => set('first_name', e.target.value)}
              style={INPUT_STYLE} />
          </Field>
          <Field label="LAST NAME">
            <input type="text" value={form.last_name}
              onChange={e => set('last_name', e.target.value)}
              style={INPUT_STYLE} />
          </Field>
          <Field label="REGISTRATION NUMBER">
            <input type="text" value={form.reg_number}
              onChange={e => set('reg_number', e.target.value)}
              style={INPUT_STYLE} />
          </Field>
          <Field label="LEVEL">
            <select value={form.level}
              onChange={e => set('level', e.target.value)}
              style={{ ...INPUT_STYLE, cursor: 'pointer' }}>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="DEPARTMENT">
            <input type="text" value={form.department}
              onChange={e => set('department', e.target.value)}
              style={INPUT_STYLE} />
          </Field>
          <Field label="UNIVERSITY / INSTITUTION">
            <input type="text" value={form.university}
              onChange={e => set('university', e.target.value)}
              style={INPUT_STYLE} />
          </Field>
        </div>
      </div>

      {/* ── Account (read-only) ── */}
      <div style={CARD}>
        <p className="text-sm font-semibold mb-5"
          style={{ color: 'var(--color-tx)', fontFamily: 'var(--font-heading)' }}>
          Account
        </p>
        <Field label="EMAIL ADDRESS">
          <input type="text" value={email} readOnly
            style={{ ...INPUT_STYLE, background: 'rgba(255,255,255,0.02)',
                     border: '1px solid rgba(255,255,255,0.05)',
                     color: 'var(--color-muted)', cursor: 'not-allowed' }} />
        </Field>
        <p className="text-xs mt-1.5" style={{ color: 'var(--color-muted)' }}>
          To change your email, use the forgot password flow.
        </p>
      </div>

      {/* ── Save ── */}
      <div className="flex items-center gap-4 mt-2">
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
          style={{
            background: '#3B82F6', color: '#fff',
            cursor: (saving || uploading) ? 'not-allowed' : 'pointer',
            opacity: (saving || uploading) ? 0.7 : 1,
          }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        {saved && !saving && (
          <span className="text-sm" style={{ color: '#10B981' }}>✓ Changes saved</span>
        )}
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}