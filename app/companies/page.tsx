'use client'

import { useState, useEffect, useMemo } from 'react'
import Link                             from 'next/link'
import { createClient }                 from '@/lib/supabase'
import { Navbar }                       from '@/components/ui/Navbar'
import { Footer }                       from '@/components/ui/Footer'

// ─── Industry config ─────────────────────────────────────────────────────────
const INDUSTRY_CONFIG: Record<string, { bg: string; text: string; tags: string[] }> = {
  Telecom:       { bg: 'rgba(59,130,246,0.15)',  text: '#3B82F6', tags: ['NETWORKING','MOBILE','5G']         },
  Software:      { bg: 'rgba(16,185,129,0.15)',  text: '#10B981', tags: ['SOFTWARE','WEB','MOBILE']          },
  'IT Services': { bg: 'rgba(139,92,246,0.15)',  text: '#8B5CF6', tags: ['IT','CLOUD','SUPPORT']             },
  Cybersecurity: { bg: 'rgba(245,158,11,0.15)',  text: '#F59E0B', tags: ['SECURITY','PENTEST','FORENSICS']   },
  Banking:       { bg: 'rgba(16,185,129,0.15)',  text: '#10B981', tags: ['FINANCE','RISK','COMPLIANCE']      },
  Engineering:   { bg: 'rgba(249,115,22,0.15)',  text: '#F97316', tags: ['CIVIL','MECHANICAL','DESIGN']      },
  Training:      { bg: 'rgba(236,72,153,0.15)',  text: '#EC4899', tags: ['EDUCATION','TECH','SKILLS']        },
  Other:         { bg: 'rgba(107,114,128,0.15)', text: '#6B7280', tags: ['GENERAL']                          },
}

const ALL_INDUSTRIES = ['All', 'Telecom', 'Software', 'IT Services', 'Cybersecurity', 'Banking', 'Engineering', 'Training']

type Company = {
  id:              string
  name:            string
  industry:        string
  location:        string
  description:     string
  slots_available: number
  avg_rating:      number
}

// ─── Company card ─────────────────────────────────────────────────────────────
function CompanyCard({ c }: { c: Company }) {
  const cfg = INDUSTRY_CONFIG[c.industry] ?? INDUSTRY_CONFIG['Other']
  const initials = c.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div
      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background:  '#101A2E',
        border:      '0.5px solid rgba(255,255,255,0.06)',
        boxShadow:   '0 4px 24px rgba(0,0,0,0.25)',
      }}
    >
      {/* Card top */}
      <Link href={`/companies/${c.id}`} className="flex flex-col gap-4 p-5 flex-1" style={{ textDecoration: 'none' }}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: cfg.bg, color: cfg.text, fontFamily: 'var(--font-heading)' }}
          >
            {initials}
          </div>
          {c.avg_rating > 0 && (
            <span
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full shrink-0"
              style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontFamily: 'var(--font-mono)' }}
            >
              ★ {Number(c.avg_rating).toFixed(1)}
            </span>
          )}
        </div>

        {/* Company info */}
        <div>
          <p
            className="font-bold text-lg mb-1 group-hover:text-blue-400 transition-colors leading-tight"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}
          >
            {c.name}
          </p>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
            {c.industry}
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {cfg.tags.map(tag => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded"
              style={{
                background:  'rgba(255,255,255,0.04)',
                color:       'rgba(139,164,200,0.7)',
                fontFamily:  'var(--font-mono)',
                border:      '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Description */}
        <p className="text-xs leading-relaxed line-clamp-2 flex-1" style={{ color: 'var(--color-muted)' }}>
          {c.description}
        </p>
      </Link>

      {/* Card footer */}
      <div
        className="flex items-center justify-between gap-3 px-5 py-3.5 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <span
          className="flex items-center gap-1.5 text-xs font-semibold"
          style={{
            color:      c.slots_available > 0 ? '#10B981' : 'var(--color-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: c.slots_available > 0 ? '#10B981' : 'rgba(255,255,255,0.15)' }}
          />
          {c.slots_available > 0 ? `${c.slots_available} Slots Available` : 'No Slots'}
        </span>

        <Link
          href={`/companies/${c.id}`}
          className="text-xs font-semibold px-4 py-1.5 rounded-full transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-blue)', color: '#fff' }}
        >
          Apply →
        </Link>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading,   setLoading]   = useState(true)
  const [query,     setQuery]     = useState('')
  const [industry,  setIndustry]  = useState('All')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('companies')
      .select('id, name, industry, location, description, slots_available, avg_rating')
      .order('avg_rating', { ascending: false })
      .then(({ data }) => {
        setCompanies((data ?? []) as Company[])
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    let rows = companies
    if (industry !== 'All') rows = rows.filter(c => c.industry === industry)
    if (query.trim()) {
      const q = query.toLowerCase()
      rows = rows.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      )
    }
    return rows
  }, [companies, query, industry])

  return (
    <>
      <Navbar />
      <main className="pt-[60px]">

        {/* Header */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <p
            className="text-xs font-semibold tracking-widest mb-3"
            style={{ color: 'var(--color-blue)', fontFamily: 'var(--font-mono)' }}
          >
            COMPANY DIRECTORY
          </p>
          <h1
            className="text-5xl font-extrabold mb-3"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}
          >
            Browse Companies
          </h1>
          <p style={{ color: 'var(--color-muted)' }}>
            Discover top organisations looking for your talent. Filter by industry and find your next opportunity.
          </p>
        </section>

        {/* Search + filters */}
        <div className="max-w-7xl mx-auto px-6 pb-8">
          {/* Search */}
          <div
            className="flex items-center gap-3 mb-5 px-4 py-3 rounded-xl border"
            style={{ background: '#101A2E', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <svg className="w-5 h-5 shrink-0" style={{ color: 'var(--color-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search companies, industries, or keywords…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--color-tx)' }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-xs px-2 py-0.5 rounded"
                style={{ color: 'var(--color-muted)' }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter pills + count */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {ALL_INDUSTRIES.map(ind => (
                <button
                  key={ind}
                  onClick={() => setIndustry(ind)}
                  className="text-xs px-4 py-2 rounded-full border font-medium transition-all"
                  style={{
                    background:  industry === ind ? 'var(--color-blue)' : 'rgba(16,26,46,0.8)',
                    color:       industry === ind ? '#fff' : 'var(--color-muted)',
                    borderColor: industry === ind ? 'var(--color-blue)' : 'rgba(255,255,255,0.08)',
                    cursor:      'pointer',
                  }}
                >
                  {ind}
                </button>
              ))}
            </div>
            <p
              className="text-xs shrink-0"
              style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
            >
              Showing <strong style={{ color: 'var(--color-tx)' }}>{filtered.length}</strong> of {companies.length} companies
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-7xl mx-auto px-6 pb-20">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl animate-pulse"
                  style={{ background: '#101A2E' }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-lg font-semibold mb-2" style={{ color: 'var(--color-tx)', fontFamily: 'var(--font-heading)' }}>
                No companies found
              </p>
              <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
                Try a different search term or filter.
              </p>
              <button
                onClick={() => { setQuery(''); setIndustry('All') }}
                className="text-sm px-5 py-2 rounded-full"
                style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--color-blue)' }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(c => <CompanyCard key={c.id} c={c} />)}
            </div>
          )}
        </div>

        <Footer />
      </main>
    </>
  )
}