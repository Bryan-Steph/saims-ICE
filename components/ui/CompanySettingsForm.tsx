'use client'

import { useState, useRef } from 'react'
import { createClient }     from '@/lib/supabase'

type Company = {
  id:              string
  name:            string
  industry:        string | null
  location:        string | null
  size:            string | null
  description:     string | null
  slots_available: number
  logo_url:        string | null
  gallery_urls:    string[] | null
  website:         string | null
}
interface Props { company: Company; userId: string; email: string }

const INDUSTRIES = [
  'Technology', 'Finance & Banking', 'Healthcare', 'Education & Training',
  'Manufacturing', 'Retail & E-commerce', 'Consulting', 'Marketing & Advertising',
  'Legal Services', 'Real Estate', 'Hospitality & Tourism', 'NGO / Non-Profit',
  'Government', 'Agriculture', 'Energy & Utilities', 'Transportation & Logistics',
  'Media & Entertainment', 'Cybersecurity', 'Telecommunications', 'Training', 'Other',
]
const SIZES = [
  '1–10 employees', '11–50 employees', '51–200 employees',
  '201–500 employees', '501–1,000 employees', '1,000+ employees',
]
const MAX_GALLERY = 8
const BUCKET      = 'company-media'

const CARD: React.CSSProperties = {
  background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)',
  borderRadius: 16, padding: '20px 24px', marginBottom: 12,
}
const INPUT: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  color: 'var(--color-tx)', borderRadius: 12, padding: '10px 16px',
  fontSize: 14, width: '100%', outline: 'none',
}

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

function Spinner() {
  return (
    <div className="w-5 h-5 rounded-full border-2" style={{
      borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#fff',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}

export function CompanySettingsForm({ company, userId, email }: Props) {
  const logoRef    = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name:            company.name,
    industry:        company.industry    ?? '',
    location:        company.location    ?? '',
    size:            company.size        ?? '',
    description:     company.description ?? '',
    slots_available: company.slots_available ?? 0,
    website:         company.website     ?? '',
  })
  const [logoUrl,     setLogoUrl]     = useState<string | null>(company.logo_url)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [gallery,     setGallery]     = useState<string[]>(company.gallery_urls ?? [])

  const [upLogo,    setUpLogo]    = useState(false)
  const [upGallery, setUpGallery] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  function set(k: keyof typeof form, v: string | number) {
    setForm(p => ({ ...p, [k]: v })); setSaved(false)
  }

  /* ── Logo upload ── */
  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('Logo must be under 2 MB.'); return }
    new FileReader().onload = (ev) => setLogoPreview(ev.target?.result as string)
    const r = new FileReader(); r.onload = ev => setLogoPreview(ev.target?.result as string); r.readAsDataURL(file)
    setUpLogo(true); setError(null)
    try {
      const sb   = createClient()
      const path = `${userId}/logo`
      const { error: err } = await sb.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type })
      if (err) throw err
      const { data: { publicUrl } } = sb.storage.from(BUCKET).getPublicUrl(path)
      setLogoUrl(`${publicUrl}?t=${Date.now()}`)
    } catch { setError('Logo upload failed. Try again.'); setLogoPreview(null) }
    finally   { setUpLogo(false) }
  }

  /* ── Gallery upload ── */
  async function handleGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []); if (!files.length) return
    const slots = MAX_GALLERY - gallery.length
    if (slots <= 0) { setError(`Max ${MAX_GALLERY} images.`); return }
    const batch = files.slice(0, slots)
    if (batch.some(f => f.size > 5 * 1024 * 1024)) { setError('Each image must be under 5 MB.'); return }
    setUpGallery(true); setError(null)
    try {
      const sb = createClient(); const urls: string[] = []
      for (let i = 0; i < batch.length; i++) {
        const f    = batch[i]
        const path = `${userId}/gallery/${Date.now()}-${i}`
        const { error: err } = await sb.storage.from(BUCKET).upload(path, f, { upsert: false, contentType: f.type })
        if (err) throw err
        const { data: { publicUrl } } = sb.storage.from(BUCKET).getPublicUrl(path)
        urls.push(publicUrl)
      }
      setGallery(p => [...p, ...urls])
    } catch { setError('Gallery upload failed. Try again.') }
    finally  { setUpGallery(false); e.target.value = '' }
  }

  /* ── Save ── */
  async function handleSave() {
    if (!form.name.trim()) { setError('Company name is required.'); return }
    setSaving(true); setError(null)
    try {
      const sb = createClient()
      const { error: err } = await sb.from('companies').update({
        name:            form.name.trim(),
        industry:        form.industry    || null,
        location:        form.location    || null,
        size:            form.size        || null,
        description:     form.description || null,
        website:         form.website     || null,
        slots_available: Number(form.slots_available),
        logo_url:        logoUrl,
        gallery_urls:    gallery,
      }).eq('id', company.id)
      if (err) throw err
      setSaved(true)
      window.location.reload()
    } catch { setError('Failed to save. Please try again.') }
    finally  { setSaving(false) }
  }

  const displayLogo = logoPreview ?? logoUrl
  const initials    = form.name.trim().split(/\s+/).filter(Boolean)
    .slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
  const busy = saving || upLogo || upGallery

  return (
    <div>

      {/* ── Header ── */}
      <div className="mb-8">
        <p className="text-[10px] font-semibold tracking-widest mb-1.5"
          style={{ color: '#3B82F6', fontFamily: 'var(--font-mono)' }}>
          COMPANY SETTINGS
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
          Company Profile
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          Manage your brand, company details, and internship availability.
        </p>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
          {error}
        </div>
      )}

      {/* ═══ SECTION 1 — Brand Identity ═══ */}
      <div style={CARD}>
        <p className="text-sm font-semibold mb-0.5"
          style={{ color: 'var(--color-tx)', fontFamily: 'var(--font-heading)' }}>
          Brand Identity
        </p>
        <p className="text-xs mb-6" style={{ color: 'var(--color-muted)' }}>
          Your logo appears on your company card and in student search results.
        </p>

        {/* Logo */}
        <div className="flex items-start gap-5 flex-wrap mb-7">
          <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center"
            style={{
              background:  displayLogo ? 'rgba(255,255,255,0.03)' : 'rgba(59,130,246,0.1)',
              border:      displayLogo ? '1px solid rgba(255,255,255,0.08)' : '2px dashed rgba(59,130,246,0.3)',
              position: 'relative',
            }}>
            {displayLogo
              ? <img src={displayLogo} alt="Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
              : <span className="text-3xl font-bold"
                  style={{ color: '#3B82F6', fontFamily: 'var(--font-heading)' }}>{initials}</span>
            }
            {upLogo && (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.55)' }}>
                <Spinner />
              </div>
            )}
          </div>
          <div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            <button onClick={() => logoRef.current?.click()} disabled={upLogo}
              className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
              style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6',
                       border: '1px solid rgba(59,130,246,0.25)',
                       cursor: upLogo ? 'not-allowed' : 'pointer', display: 'block', marginBottom: 8 }}>
              {upLogo ? 'Uploading…' : displayLogo ? 'Change Logo' : 'Upload Logo'}
            </button>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>PNG, JPG, SVG · Max 2 MB</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>Square format recommended</p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 20 }} />

        {/* Gallery */}
        <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold"
              style={{ color: 'var(--color-tx)' }}>Company Gallery</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
              Show students your offices, team, and environment. Up to {MAX_GALLERY} photos.
            </p>
          </div>
          {gallery.length < MAX_GALLERY && (
            <>
              <input ref={galleryRef} type="file" accept="image/*" multiple
                className="hidden" onChange={handleGallery} />
              <button onClick={() => galleryRef.current?.click()} disabled={upGallery}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
                style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6',
                         border: '1px solid rgba(59,130,246,0.25)',
                         cursor: upGallery ? 'not-allowed' : 'pointer' }}>
                {upGallery ? 'Uploading…' : '+ Add Photos'}
              </button>
            </>
          )}
        </div>

        {gallery.length === 0 && !upGallery ? (
          <div className="flex items-center justify-center rounded-xl py-10"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)' }}>
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--color-muted)', opacity: 0.35 }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No photos yet</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-muted)', opacity: 0.5 }}>
                Click `Add Photos` to showcase your workplace
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {gallery.map((url, i) => (
              <div key={url + i} className="relative group rounded-xl overflow-hidden"
                style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.04)' }}>
                <img src={url} alt={`Photo ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.45)' }} />
                <button onClick={() => setGallery(p => p.filter((_, j) => j !== i))}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(239,68,68,0.95)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  ×
                </button>
              </div>
            ))}
            {upGallery && (
              <div className="rounded-xl flex items-center justify-center"
                style={{ aspectRatio: '1', background: 'rgba(59,130,246,0.05)',
                         border: '1px dashed rgba(59,130,246,0.25)' }}>
                <div className="w-5 h-5 rounded-full border-2"
                  style={{ borderColor: 'rgba(59,130,246,0.3)', borderTopColor: '#3B82F6',
                           animation: 'spin 0.7s linear infinite' }} />
              </div>
            )}
          </div>
        )}
        <p className="text-[10px] mt-2" style={{ color: 'var(--color-muted)', opacity: 0.6 }}>
          {gallery.length} / {MAX_GALLERY} photos · Hover to remove
        </p>
      </div>

      {/* ═══ SECTION 2 — Company Information ═══ */}
      <div style={CARD}>
        <p className="text-sm font-semibold mb-5"
          style={{ color: 'var(--color-tx)', fontFamily: 'var(--font-heading)' }}>
          Company Information
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="COMPANY NAME">
              <input type="text" value={form.name}
                onChange={e => set('name', e.target.value)} style={INPUT} />
            </Field>
          </div>
          <Field label="INDUSTRY">
            <select value={form.industry}
              onChange={e => set('industry', e.target.value)}
              style={{ ...INPUT, cursor: 'pointer' }}>
              <option value="">Select industry</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </Field>
          <Field label="COMPANY SIZE">
            <select value={form.size}
              onChange={e => set('size', e.target.value)}
              style={{ ...INPUT, cursor: 'pointer' }}>
              <option value="">Select size</option>
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="LOCATION / CITY">
            <input type="text" value={form.location}
              onChange={e => set('location', e.target.value)} style={INPUT} />
          </Field>
          <Field label="WEBSITE">
            <input type="url" value={form.website}
              onChange={e => set('website', e.target.value)}
              placeholder="https://yourcompany.com" style={INPUT} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="ABOUT THE COMPANY">
              <textarea value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={5}
                placeholder="Tell students about your culture, mission, and what interns will work on…"
                style={{ ...INPUT, resize: 'vertical', lineHeight: 1.6 }} />
            </Field>
          </div>
        </div>
      </div>

      {/* ═══ SECTION 3 — Internship Availability ═══ */}
      <div style={CARD}>
        <p className="text-sm font-semibold mb-0.5"
          style={{ color: 'var(--color-tx)', fontFamily: 'var(--font-heading)' }}>
          Internship Availability
        </p>
        <p className="text-xs mb-5" style={{ color: 'var(--color-muted)' }}>
          How many interns can you currently accommodate? Students see this on your profile.
        </p>
        <div className="flex items-end gap-5 flex-wrap">
          <div style={{ width: 160 }}>
            <Field label="SLOTS AVAILABLE">
              <input type="number" min={0} max={999}
                value={form.slots_available}
                onChange={e => set('slots_available', Math.max(0, parseInt(e.target.value, 10) || 0))}
                style={INPUT} />
            </Field>
          </div>
          <div className="pb-0.5">
            {form.slots_available === 0 ? (
              <span className="text-xs px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                         border: '1px solid rgba(239,68,68,0.2)', fontFamily: 'var(--font-mono)' }}>
                ✗ Not accepting interns
              </span>
            ) : (
              <span className="text-xs px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981',
                         border: '1px solid rgba(16,185,129,0.2)', fontFamily: 'var(--font-mono)' }}>
                ✓ Up to {form.slots_available} intern{form.slots_available !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        {form.slots_available === 0 && (
          <p className="text-xs mt-3" style={{ color: 'var(--color-muted)' }}>
            Setting slots to 0 hides your company from student searches.
          </p>
        )}
      </div>

      {/* ═══ SECTION 4 — Account ═══ */}
      <div style={CARD}>
        <p className="text-sm font-semibold mb-5"
          style={{ color: 'var(--color-tx)', fontFamily: 'var(--font-heading)' }}>
          Account
        </p>
        <Field label="EMAIL ADDRESS">
          <input type="text" value={email} readOnly
            style={{ ...INPUT, background: 'rgba(255,255,255,0.02)',
                     border: '1px solid rgba(255,255,255,0.04)',
                     color: 'var(--color-muted)', cursor: 'not-allowed' }} />
        </Field>
        <p className="text-xs mt-1.5" style={{ color: 'var(--color-muted)' }}>
          To change your email, use the forgot password flow.
        </p>
      </div>

      {/* ── Save ── */}
      <div className="flex items-center gap-4 mt-2">
        <button onClick={handleSave} disabled={busy}
          className="px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
          style={{ background: '#3B82F6', color: '#fff',
                   cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        {saved && !saving && (
          <span className="text-sm" style={{ color: '#10B981' }}>✓ Changes saved</span>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}