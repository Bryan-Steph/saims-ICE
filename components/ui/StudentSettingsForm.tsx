'use client'

import { useState, useRef } from 'react'
import { createClient }     from '@/lib/supabase'

type Student = {
  id:          string
  first_name:  string
  last_name:   string
  reg_number:  string
  department:  string
  university:  string
  level:       string
  avatar_url?: string | null
}

interface Props {
  student:  Student
  userId?:  string   // optional — absent means read-only/supervisor view
  email?:   string   // optional — absent means email field is hidden
}

const LEVELS = ['100L', '200L', '300L', '400L', '500L', 'HND 1', 'HND 2', 'Masters']

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
  background:   'rgba(255,255,255,0.04)',
  border:       '1px solid rgba(255,255,255,0.08)',
  color:        'var(--color-tx)',
  borderRadius: 12,
  padding:      '10px 16px',
  fontSize:     14,
  width:        '100%',
  outline:      'none',
}

const INPUT_READONLY: React.CSSProperties = {
  ...INPUT_STYLE,
  background: 'rgba(255,255,255,0.02)',
  border:     '1px solid rgba(255,255,255,0.05)',
  color:      'var(--color-muted)',
  cursor:     'not-allowed',
}

const CARD: React.CSSProperties = {
  background:    '#101A2E',
  border:        '0.5px solid rgba(255,255,255,0.06)',
  borderRadius:  16,
  padding:       '20px 24px',
  marginBottom:  12,
}

export function StudentSettingsForm({ student, userId, email }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  // If userId is absent, this is a read-only view (e.g. supervisor)
  const isEditable = !!userId

  const [form, setForm] = useState({
    first_name: student.first_name,
    last_name:  student.last_name,
    reg_number: student.reg_number,
    department: student.department,
    university: student.university,
    level:      student.level,
  })

  const [avatarUrl,     setAvatarUrl]     = useState<string | null>(student.avatar_url ?? null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploading,     setUploading]     = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  function set(field: keyof typeof form, value: string) {
    if (!isEditable) return
    setForm(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!userId) return // guard — no upload in read-only mode
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('File must be under 2 MB.'); return }

    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    setError(null)
    try {
      const sb   = createClient()
      const path = `${userId}/avatar`

      const { error: upErr } = await sb.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr

      const { data: { publicUrl } } = sb.storage
        .from('avatars')
        .getPublicUrl(path)

      setAvatarUrl(`${publicUrl}?t=${Date.now()}`)
    } catch {
      setError('Photo upload failed. Please try again.')
      setAvatarPreview(null)
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!isEditable) return
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
          {isEditable ? 'STUDENT SETTINGS' : 'STUDENT PROFILE'}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
          {isEditable ? 'Edit Profile' : 'Student Profile'}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          {isEditable
            ? 'Update your personal information and profile photo.'
            : 'Student academic profile information.'}
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

          {/* Only show upload controls in edit mode */}
          {isEditable && (
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
          )}
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
              readOnly={!isEditable}
              style={isEditable ? INPUT_STYLE : INPUT_READONLY} />
          </Field>
          <Field label="LAST NAME">
            <input type="text" value={form.last_name}
              onChange={e => set('last_name', e.target.value)}
              readOnly={!isEditable}
              style={isEditable ? INPUT_STYLE : INPUT_READONLY} />
          </Field>
          <Field label="REGISTRATION NUMBER">
            <input type="text" value={form.reg_number}
              onChange={e => set('reg_number', e.target.value)}
              readOnly={!isEditable}
              style={isEditable ? INPUT_STYLE : INPUT_READONLY} />
          </Field>
          <Field label="LEVEL">
            {isEditable ? (
              <select value={form.level}
                onChange={e => set('level', e.target.value)}
                style={{ ...INPUT_STYLE, cursor: 'pointer' }}>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            ) : (
              <input type="text" value={form.level} readOnly style={INPUT_READONLY} />
            )}
          </Field>
          <Field label="DEPARTMENT">
            <input type="text" value={form.department}
              onChange={e => set('department', e.target.value)}
              readOnly={!isEditable}
              style={isEditable ? INPUT_STYLE : INPUT_READONLY} />
          </Field>
          <Field label="UNIVERSITY / INSTITUTION">
            <input type="text" value={form.university}
              onChange={e => set('university', e.target.value)}
              readOnly={!isEditable}
              style={isEditable ? INPUT_STYLE : INPUT_READONLY} />
          </Field>
        </div>
      </div>

      {/* ── Account — only shown in edit mode ── */}
      {isEditable && (
        <div style={CARD}>
          <p className="text-sm font-semibold mb-5"
            style={{ color: 'var(--color-tx)', fontFamily: 'var(--font-heading)' }}>
            Account
          </p>
          <Field label="EMAIL ADDRESS">
            <input type="text" value={email ?? ''} readOnly
              style={INPUT_READONLY} />
          </Field>
          <p className="text-xs mt-1.5" style={{ color: 'var(--color-muted)' }}>
            To change your email, use the forgot password flow.
          </p>
        </div>
      )}

      {/* ── Save — only in edit mode ── */}
      {isEditable && (
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
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}