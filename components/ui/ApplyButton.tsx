'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter }                   from 'next/navigation'
import { createClient }                from '@/lib/supabase'
import { Spinner }                     from '@/components/ui/Spinner'

interface Props {
  companyId:      string
  companyName:    string
  hasSlots:       boolean
  isStudent:      boolean
  alreadyApplied: boolean
  isLoggedIn:     boolean
}

type StudentProfile = {
  id: string; first_name: string; last_name: string
  reg_number: string; department: string; university: string; level: string
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB

// Wraps a promise with a timeout
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s. Check your Supabase storage bucket exists and has the correct policies.`)), ms)
    ),
  ])
}

export function ApplyButton({
  companyId, companyName, hasSlots, isStudent, alreadyApplied, isLoggedIn,
}: Props) {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [open,       setOpen]      = useState(false)
  const [loading,    setLoading]   = useState(false)
  const [fetching,   setFetching]  = useState(false)
  const [error,      setError]     = useState<string | null>(null)
  const [applied,    setApplied]   = useState(alreadyApplied)
  const [profile,    setProfile]   = useState<StudentProfile | null>(null)
  const [submitStep, setSubmitStep] = useState<string | null>(null) // shows progress

  // Form state
  const [prefRole,  setPrefRole]  = useState('')
  const [startDate, setStartDate] = useState('')
  const [coverNote, setCoverNote] = useState('')
  const [file,      setFile]      = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [declared,  setDeclared]  = useState(false)

  useEffect(() => {
    if (!open || profile || !isStudent) return
    setFetching(true)
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setFetching(false); return }
      const { data } = await supabase
        .from('students')
        .select('id, first_name, last_name, reg_number, department, university, level')
        .eq('user_id', user.id)
        .single()
      if (data) setProfile(data as StudentProfile)
      setFetching(false)
    })
  }, [open, profile, isStudent])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null)
    const f = e.target.files?.[0] ?? null
    if (!f) { setFile(null); return }
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setFileError('Please upload a PDF or Word document (.pdf, .doc, .docx).')
      setFile(null); e.target.value = ''; return
    }
    if (f.size > MAX_BYTES) {
      setFileError(`File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum is 2 MB.`)
      setFile(null); e.target.value = ''; return
    }
    setFile(f)
  }

  function validate(): string | null {
    if (!prefRole.trim())  return 'Please enter the role or position you are applying for.'
    if (!startDate)        return 'Please select your available start date.'
    if (!file)             return 'Please upload your application document (PDF or Word, max 2 MB).'
    if (fileError)         return fileError
    if (!declared)         return 'Please tick the declaration checkbox to proceed.'
    return null
  }

  async function handleSubmit() {
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    if (!profile) { setError('Could not load your student profile. Close and reopen the form.'); return }

    setLoading(true)
    setError(null)
    setSubmitStep('Uploading document…')

    try {
      const supabase     = createClient()
      const ext          = file!.name.split('.').pop() ?? 'pdf'
      const safeFileName = `application.${ext}`
      const storagePath  = `${profile.id}/${companyId}/${Date.now()}-${safeFileName}`

      // 1. Upload with 20-second timeout
      const uploadPromise = supabase.storage
        .from('application-docs')
        .upload(storagePath, file!, { cacheControl: '3600', upsert: false })

      const { error: uploadErr } = await withTimeout(uploadPromise, 20000, 'Document upload')

      if (uploadErr) {
        // Give a clear, actionable message
        if (uploadErr.message?.includes('Bucket not found') || uploadErr.message?.includes('bucket')) {
          throw new Error('Storage bucket "application-docs" not found. Ask your administrator to create it in Supabase Storage.')
        }
        if (uploadErr.message?.includes('policy') || uploadErr.message?.includes('403')) {
          throw new Error('Upload permission denied. The storage bucket policy needs to allow authenticated uploads.')
        }
        throw new Error(`Upload failed: ${uploadErr.message}`)
      }

      const { data: { publicUrl } } = supabase.storage
        .from('application-docs')
        .getPublicUrl(storagePath)

      setSubmitStep('Submitting application…')

      // 2. Build motivation text
      const motivation = [
        `PREFERRED ROLE: ${prefRole.trim()}`,
        `AVAILABLE FROM: ${startDate}`,
        coverNote.trim() ? `COVER NOTE:\n${coverNote.trim()}` : '',
      ].filter(Boolean).join('\n\n')

      // 3. Insert application
      const { error: insertErr } = await supabase.from('applications').insert({
        student_id:   profile.id,
        company_id:   companyId,
        motivation,
        document_url: publicUrl,
        status:       'pending',
        applied_at:   new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      })

      if (insertErr) {
        if (insertErr.code === '23505') {
          throw new Error('You have already applied to this company.')
        }
        if (insertErr.message?.includes('document_url')) {
          throw new Error('Database schema is missing the document_url column. Run: ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS document_url TEXT;')
        }
        throw new Error(`Application save failed: ${insertErr.message}`)
      }

      // Success
      setApplied(true)
      setOpen(false)
      router.refresh()

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
      setSubmitStep(null)
    }
  }

  function closeModal() {
    if (loading) return
    setOpen(false)
    setError(null)
    setFileError(null)
  }

  // ── Variant renders ─────────────────────────────────────────────────────────

  if (applied) return (
    <div className="w-full text-center py-3.5 rounded-xl text-sm font-semibold"
      style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981',
               border: '1px solid rgba(16,185,129,0.25)', fontFamily: 'var(--font-mono)' }}>
      ✓ APPLICATION SUBMITTED
    </div>
  )

  if (!hasSlots) return (
    <div className="w-full text-center py-3.5 rounded-xl text-sm"
      style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--color-muted)',
               border: '1px solid rgba(255,255,255,0.06)' }}>
      No slots available
    </div>
  )

  if (!isLoggedIn) return (
    <a href="/auth/register"
      className="block w-full text-center py-3.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
      style={{ background: '#3B82F6', color: '#fff', textDecoration: 'none' }}>
      REGISTER TO APPLY →
    </a>
  )

  if (!isStudent) return (
    <div className="w-full text-center py-3.5 rounded-xl text-sm"
      style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--color-muted)',
               border: '1px solid rgba(255,255,255,0.06)' }}>
      Only students can apply
    </div>
  )

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="w-full py-3.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
        style={{ background: '#3B82F6', color: '#fff', border: 'none', cursor: 'pointer' }}>
        APPLY NOW →
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-50" onClick={closeModal}
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ overflowY: 'auto' }}>
            <div
              className="relative w-full max-w-xl my-8 rounded-2xl flex flex-col"
              style={{ background: '#101A2E', border: '1px solid rgba(255,255,255,0.09)',
                       boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* ── Header ── */}
              <div className="flex items-start justify-between gap-4 p-6"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <p className="text-[10px] font-semibold tracking-widest mb-1"
                    style={{ color: '#3B82F6', fontFamily: 'var(--font-mono)' }}>
                    INTERNSHIP APPLICATION
                  </p>
                  <h2 className="text-xl font-bold"
                    style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
                    Apply to {companyName}
                  </h2>
                </div>
                <button onClick={closeModal} disabled={loading}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                  style={{ color: 'var(--color-muted)', background: 'rgba(255,255,255,0.06)',
                           border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                  ✕
                </button>
              </div>

              {/* ── ERROR BANNER — at the top so it's always visible ── */}
              {error && (
                <div className="mx-6 mt-4 text-sm px-4 py-3 rounded-xl flex items-start gap-3"
                  style={{ color: '#FCA5A5', background: 'rgba(239,68,68,0.1)',
                           border: '1px solid rgba(239,68,68,0.2)' }}>
                  <span className="text-lg leading-none shrink-0">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              {/* ── Submit progress indicator ── */}
              {loading && submitStep && (
                <div className="mx-6 mt-4 flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)',
                           color: '#93C5FD' }}>
                  <Spinner size="sm" />
                  {submitStep}
                </div>
              )}

              {/* ── Body ── */}
              <div className="p-6 flex flex-col gap-6">

                {/* 1. Your details */}
                <div>
                  <p className="text-[10px] font-semibold tracking-widest mb-3"
                    style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                    YOUR DETAILS
                  </p>
                  {fetching ? (
                    <div className="flex items-center gap-2 py-2">
                      <Spinner size="sm" />
                      <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading profile…</span>
                    </div>
                  ) : profile ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      {([
                        ['Full Name',   `${profile.first_name} ${profile.last_name}`],
                        ['Reg. Number', profile.reg_number],
                        ['Department',  profile.department],
                        ['Level',       profile.level],
                      ] as [string, string][]).map(([label, value]) => (
                        <div key={label} className="px-3 py-2.5 rounded-lg"
                          style={{ background: 'rgba(255,255,255,0.03)',
                                   border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p className="text-[10px] mb-0.5"
                            style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                            {label}
                          </p>
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--color-tx)' }}>
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: '#F59E0B' }}>
                      Could not load your student profile. Make sure you completed registration.
                    </p>
                  )}
                </div>

                {/* 2. Application details */}
                <div>
                  <p className="text-[10px] font-semibold tracking-widest mb-3"
                    style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                    APPLICATION DETAILS
                  </p>
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium" style={{ color: 'var(--color-tx)' }}>
                          Preferred role <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <input type="text" className="field text-sm"
                          placeholder="e.g. Web Development Intern"
                          value={prefRole} onChange={e => setPrefRole(e.target.value)}
                          disabled={loading} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium" style={{ color: 'var(--color-tx)' }}>
                          Available from <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <input type="date" className="field text-sm"
                          value={startDate} onChange={e => setStartDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          disabled={loading} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium" style={{ color: 'var(--color-tx)' }}>
                        Brief cover note{' '}
                        <span className="text-xs font-normal" style={{ color: 'var(--color-muted)' }}>
                          (optional, max 300 chars)
                        </span>
                      </label>
                      <textarea rows={3} className="field text-sm"
                        placeholder="2–3 sentences about why you're a good fit."
                        value={coverNote}
                        onChange={e => { if (e.target.value.length <= 300) setCoverNote(e.target.value) }}
                        disabled={loading}
                        style={{ resize: 'none', lineHeight: 1.6 }} />
                      <p className="text-xs text-right"
                        style={{ color: coverNote.length > 280 ? '#F59E0B' : 'var(--color-muted)',
                                 fontFamily: 'var(--font-mono)' }}>
                        {coverNote.length} / 300
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Document upload */}
                <div>
                  <p className="text-[10px] font-semibold tracking-widest mb-3"
                    style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                    APPLICATION DOCUMENT <span style={{ color: '#EF4444' }}>*</span>
                  </p>

                  <input ref={fileRef} type="file" className="sr-only"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange} disabled={loading} />

                  <button type="button" onClick={() => fileRef.current?.click()}
                    disabled={loading}
                    className="w-full rounded-xl transition-all duration-150"
                    style={{
                      background:  file ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                      border: `2px dashed ${file ? 'rgba(16,185,129,0.4)' : fileError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.12)'}`,
                      padding: '1.25rem', cursor: loading ? 'not-allowed' : 'pointer',
                    }}>
                    {file ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(16,185,129,0.15)' }}>
                          <svg className="w-5 h-5" style={{ color: '#10B981' }} fill="none"
                            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#10B981' }}>
                            {file.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                            {(file.size / 1024).toFixed(0)} KB · {file.name.split('.').pop()?.toUpperCase()}
                            <span className="ml-2" style={{ color: '#10B981' }}>✓ Ready</span>
                          </p>
                        </div>
                        <span className="ml-auto text-xs shrink-0"
                          style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                          Click to change
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <svg className="w-8 h-8" style={{ color: 'var(--color-muted)' }} fill="none"
                          viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-tx)' }}>
                          Upload your application document
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          PDF, DOC, or DOCX · Max 2 MB
                        </p>
                      </div>
                    )}
                  </button>

                  {fileError && (
                    <p className="text-xs mt-2" style={{ color: '#EF4444' }}>{fileError}</p>
                  )}
                  <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
                    Upload a formal application letter or your CV. The company will receive a direct link to your document.
                  </p>
                </div>

                {/* 4. Declaration */}
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input type="checkbox" checked={declared}
                    onChange={e => setDeclared(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-blue-500 shrink-0"
                    disabled={loading} />
                  <span className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                    I confirm that all information is accurate, my document is authentic,
                    and I will obtain a university attachment letter before my start date.
                  </span>
                </label>
              </div>

              {/* ── Footer ── */}
              <div className="flex gap-3 p-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={closeModal} disabled={loading}
                  className="flex-1 py-3 rounded-xl text-sm border transition-colors"
                  style={{ color: 'var(--color-muted)', borderColor: 'rgba(255,255,255,0.1)',
                           background: 'transparent', cursor: loading ? 'not-allowed' : 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleSubmit}
                  disabled={loading || fetching || !!fileError || !profile}
                  className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-opacity"
                  style={{
                    background: '#3B82F6', color: '#fff', border: 'none',
                    cursor: (loading || fetching || !!fileError || !profile) ? 'not-allowed' : 'pointer',
                    opacity: (loading || fetching || !!fileError || !profile) ? 0.6 : 1,
                  }}>
                  {loading ? <><Spinner size="sm" />{submitStep ?? 'Submitting…'}</> : 'Submit Application →'}
                </button>
              </div>

            </div>
          </div>
        </>
      )}
    </>
  )
}