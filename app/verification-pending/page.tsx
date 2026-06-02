'use client'

import { useEffect, useState } from 'react'
import { useRouter }           from 'next/navigation'
import { createClient }        from '@/lib/supabase'
import { Spinner }             from '@/components/ui/Spinner'

type VStatus = 'pending' | 'rejected'
type UserRole = 'company' | 'supervisor'

interface Profile {
  verification_status:  VStatus
  verification_doc_url: string | null
  verification_notes:   string | null
}

export default function VerificationPendingPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [role,        setRole]        = useState<UserRole | null>(null)
  const [profile,     setProfile]     = useState<Profile | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [uploading,   setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [justUploaded, setJustUploaded] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: roleData } = await supabase
        .from('user_roles').select('role').eq('user_id', user.id).single()
      const r = roleData?.role as UserRole
      setRole(r)

      const table = r === 'company' ? 'companies' : 'supervisors'
      const { data } = await supabase
        .from(table)
        .select('verification_status, verification_doc_url, verification_notes')
        .eq('user_id', user.id)
        .single()

      setProfile(data)
      setPageLoading(false)
    }
    load()
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !role) return

    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      setUploadError('Please upload a PDF, JPG, or PNG file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be under 5MB.')
      return
    }

    setUploading(true)
    setUploadError(null)
    setJustUploaded(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Session expired — please sign in again.')

      const ext      = file.name.split('.').pop()
      const filePath = `${user.id}/${Date.now()}.${ext}`

      const { error: storageErr } = await supabase.storage
        .from('verification-docs')
        .upload(filePath, file, { upsert: true })
      if (storageErr) throw storageErr

      const table = role === 'company' ? 'companies' : 'supervisors'
      const { error: updateErr } = await supabase
        .from(table)
        .update({
          verification_doc_url: filePath,
          verification_status:  'pending', // rejected → pending on re-upload
        })
        .eq('user_id', user.id)
      if (updateErr) throw updateErr

      setProfile(prev => prev
        ? { ...prev, verification_doc_url: filePath, verification_status: 'pending' }
        : prev
      )
      setJustUploaded(true)

    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#060B16',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="md" />
      </div>
    )
  }

  const isRejected = profile?.verification_status === 'rejected'
  const hasDoc     = !!profile?.verification_doc_url
  const docName    = profile?.verification_doc_url?.split('/').pop() ?? null

  const docLabel = role === 'company'
    ? 'Business registration certificate or official company document'
    : 'Staff attestation letter or employment confirmation from your institution'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main style={{
      minHeight: '100vh', background: '#060B16',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
    }}>
      <div style={{
        width: '100%', maxWidth: '28rem',
        background: '#101A2E',
        border: '1px solid rgba(59,130,246,0.12)',
        borderRadius: '1rem',
        padding: '2.5rem',
      }}>

        {/* Logo */}
        <div style={{ marginBottom: '2rem' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800,
                         fontSize: '1.25rem', color: '#EEF4FF' }}>
            Attach<span style={{ color: '#3B82F6' }}>Hub</span>
          </span>
        </div>

        {/* Status icon */}
        <div style={{
          width: '3.5rem', height: '3.5rem', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.25rem',
          background: isRejected ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
          border: `1px solid ${isRejected ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
        }}>
          {isRejected ? (
            <svg style={{ width: '1.5rem', height: '1.5rem', color: '#EF4444' }}
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg style={{ width: '1.5rem', height: '1.5rem', color: '#F59E0B' }}
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
          )}
        </div>

        {/* Heading */}
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800,
                     fontSize: '1.5rem', color: '#EEF4FF', marginBottom: '0.5rem' }}>
          {isRejected ? 'Verification Unsuccessful' : 'Pending Verification'}
        </h1>

        {/* Rejection note */}
        {isRejected && profile?.verification_notes && (
          <div style={{
            marginBottom: '1.25rem', padding: '0.875rem 1rem',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem',
          }}>
            <p style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
                        color: '#EF4444', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>
              ADMIN NOTE
            </p>
            <p style={{ fontSize: '0.875rem', color: '#EEF4FF' }}>
              {profile.verification_notes}
            </p>
          </div>
        )}

        {/* Subtext */}
        <p style={{ fontSize: '0.875rem', color: '#8BA4C8',
                    lineHeight: '1.6', marginBottom: '1.75rem' }}>
          {isRejected
            ? 'Review the note above and upload a corrected document.'
            : hasDoc && !justUploaded
            ? 'Your document is submitted. You\'ll be notified once it\'s reviewed.'
            : `Upload a document to confirm your ${role === 'company' ? 'company' : 'position'}.`}
        </p>

        {/* Submitted doc indicator */}
        {(hasDoc || justUploaded) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            padding: '0.75rem 1rem', marginBottom: '1.25rem',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)', borderRadius: '0.5rem',
          }}>
            <svg style={{ width: '1.1rem', height: '1.1rem', color: '#10B981', flexShrink: 0 }}
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span style={{ fontSize: '0.8125rem', color: '#EEF4FF',
                           wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
              {justUploaded ? 'Uploaded — awaiting admin review' : docName}
            </span>
          </div>
        )}

        {/* Upload area */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#8BA4C8',
                      marginBottom: '0.625rem', lineHeight: '1.5' }}>
            {docLabel} · PDF, JPG, or PNG · max 5MB
          </p>
          <label style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'rgba(59,130,246,0.06)',
            border: '1px dashed rgba(59,130,246,0.3)',
            borderRadius: '0.5rem',
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}>
            {uploading
              ? <Spinner size="sm" />
              : (
                <svg style={{ width: '1.125rem', height: '1.125rem', color: '#3B82F6' }}
                     fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              )
            }
            <span style={{ fontSize: '0.875rem', color: '#3B82F6', fontWeight: 500 }}>
              {uploading ? 'Uploading…' : hasDoc ? 'Replace document' : 'Upload document'}
            </span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>

          {uploadError && (
            <p style={{ fontSize: '0.8125rem', color: '#EF4444', marginTop: '0.5rem' }}>
              {uploadError}
            </p>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', padding: '0.625rem',
            background: 'transparent',
            border: '1px solid rgba(139,164,200,0.12)',
            borderRadius: '0.5rem',
            color: '#8BA4C8', fontSize: '0.875rem', cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>
    </main>
  )
}