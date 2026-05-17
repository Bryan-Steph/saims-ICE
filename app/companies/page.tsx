'use client'

import { useState, useEffect, useMemo } from 'react'
import Link                             from 'next/link'
import { createClient }                 from '@/lib/supabase'
import { DashboardShell }               from '@/components/ui/DashboardShell'

const INDUSTRIES = ['All','Telecom','Software','IT Services','Cybersecurity','Banking','Engineering','Training']

const INDUSTRY_CFG: Record<string, { bg: string; text: string; tags: string[] }> = {
  Telecom:       { bg:'rgba(59,130,246,0.15)',  text:'#3B82F6', tags:['NETWORKING','MOBILE','5G'] },
  Software:      { bg:'rgba(16,185,129,0.15)',  text:'#10B981', tags:['SOFTWARE','WEB','MOBILE'] },
  'IT Services': { bg:'rgba(139,92,246,0.15)',  text:'#8B5CF6', tags:['IT','CLOUD','SUPPORT'] },
  Cybersecurity: { bg:'rgba(245,158,11,0.15)',  text:'#F59E0B', tags:['SECURITY','PENTEST','FORENSICS'] },
  Banking:       { bg:'rgba(16,185,129,0.15)',  text:'#10B981', tags:['FINANCE','RISK','COMPLIANCE'] },
  Engineering:   { bg:'rgba(249,115,22,0.15)',  text:'#F97316', tags:['CIVIL','MECHANICAL','DESIGN'] },
  Training:      { bg:'rgba(236,72,153,0.15)',  text:'#EC4899', tags:['EDUCATION','TECH','SKILLS'] },
}

type Company = {
  id: string; name: string; industry: string; location: string
  description: string; slots_available: number; avg_rating: number
}

export default function StudentCompaniesPage() {
  const [userName,   setUserName]   = useState('Student')
  const [companies,  setCompanies]  = useState<Company[]>([])
  const [loading,    setLoading]    = useState(true)
  const [query,      setQuery]      = useState('')
  const [industry,   setIndustry]   = useState('All')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: s } = await supabase
        .from('students').select('first_name, last_name').eq('user_id', user.id).single()
      if (s) setUserName(`${s.first_name} ${s.last_name}`)
    })
    supabase.from('companies')
      .select('id, name, industry, location, description, slots_available, avg_rating')
      .order('avg_rating', { ascending: false })
      .then(({ data }) => { setCompanies((data ?? []) as Company[]); setLoading(false) })
  }, [])

  const filtered = useMemo(() => {
    let rows = companies
    if (industry !== 'All') rows = rows.filter(c => c.industry === industry)
    if (query.trim()) {
      const q = query.toLowerCase()
      rows = rows.filter(c =>
        c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      )
    }
    return rows
  }, [companies, query, industry])

  return (
    <DashboardShell name={userName} role="student">

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest mb-2"
          style={{ color: 'var(--color-blue)', fontFamily: 'var(--font-mono)' }}>
          FIND YOUR PLACEMENT
        </p>
        <h1 className="text-3xl font-bold mb-1"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
          Browse Companies
        </h1>
        <p style={{ color: 'var(--color-muted)' }}>
          Discover organisations accepting interns. Click a company to view details and apply.
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl border"
        style={{ background: 'rgba(16,26,46,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--color-muted)' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input type="text" placeholder="Search companies, industries, or keywords…"
          value={query} onChange={e => setQuery(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'var(--color-tx)' }} />
        {query && (
          <button onClick={() => setQuery('')} className="text-xs" style={{ color: 'var(--color-muted)' }}>✕</button>
        )}
      </div>

      {/* Filters + count */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {INDUSTRIES.map(ind => (
            <button key={ind} onClick={() => setIndustry(ind)}
              className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all"
              style={{
                background:  industry === ind ? 'var(--color-blue)' : 'rgba(16,26,46,0.8)',
                color:       industry === ind ? '#fff' : 'var(--color-muted)',
                borderColor: industry === ind ? 'var(--color-blue)' : 'rgba(255,255,255,0.08)',
                cursor:      'pointer',
              }}>
              {ind}
            </button>
          ))}
        </div>
        <p className="text-xs shrink-0" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
          {filtered.length} of {companies.length} companies
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-2xl animate-pulse" style={{ background: '#101A2E' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-semibold mb-2" style={{ color: 'var(--color-tx)', fontFamily: 'var(--font-heading)' }}>
            No companies found
          </p>
          <button onClick={() => { setQuery(''); setIndustry('All') }}
            className="text-sm mt-3 px-5 py-2 rounded-full"
            style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--color-blue)', cursor: 'pointer' }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => {
            const cfg = INDUSTRY_CFG[c.industry] ?? { bg: 'rgba(59,130,246,0.15)', text: '#3B82F6', tags: ['GENERAL'] }
            const initials = c.name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()
            return (
              <Link key={c.id} href={`/dashboard/student/companies/${c.id}`}
                className="group flex flex-col rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
                style={{ background: '#101A2E', border: '0.5px solid rgba(255,255,255,0.06)',
                         boxShadow: '0 4px 20px rgba(0,0,0,0.2)', textDecoration: 'none' }}>
                <div className="flex flex-col gap-3 p-5 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: cfg.bg, color: cfg.text, fontFamily: 'var(--font-heading)' }}>
                      {initials}
                    </div>
                    {c.avg_rating > 0 && (
                      <span className="text-xs px-2 py-1 rounded-full"
                        style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontFamily: 'var(--font-mono)' }}>
                        ★ {Number(c.avg_rating).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-base mb-0.5 group-hover:text-blue-400 transition-colors"
                      style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
                      {c.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                      {c.industry} · {c.location}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cfg.tags.map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(139,164,200,0.7)',
                                 border: '1px solid rgba(255,255,255,0.07)', fontFamily: 'var(--font-mono)' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between px-5 py-3 border-t"
                  style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <span className="flex items-center gap-1.5 text-xs font-semibold"
                    style={{ color: c.slots_available > 0 ? '#10B981' : 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                    <span className="w-1.5 h-1.5 rounded-full"
                      style={{ background: c.slots_available > 0 ? '#10B981' : 'rgba(255,255,255,0.15)' }} />
                    {c.slots_available > 0 ? `${c.slots_available} Slots Open` : 'No Slots'}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-blue)' }}>
                    View & Apply →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}