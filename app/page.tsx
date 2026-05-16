import Link                    from 'next/link'
import { createClient }        from '@/lib/supabase-server'
import { Navbar }              from '@/components/ui/Navbar'
import { Footer }              from '@/components/ui/Footer'
// import { Companies }          from '../companies/page'



const STEPS = [
  {
    n: '01',
    title: 'Create your account',
    desc:  'Register as a student in under two minutes. No paperwork, no queues.',
  },
  {
    n: '02',
    title: 'Browse & apply',
    desc:  'Explore verified companies in Bamenda and apply with a single click.',
  },
  {
    n: '03',
    title: 'Get placed & report',
    desc:  'Accept your offer, submit weekly reports, and receive supervisor feedback — all in one place.',
  },
]


const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    label: 'Company directory',
    desc: 'Browse real Bamenda companies accepting interns — with open slot counts.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
    label: 'Weekly reports',
    desc: 'Submit structured reports each week. Your supervisor sees them instantly.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    label: 'Supervisor tracking',
    desc: 'University supervisors monitor every placed student in real time.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.040.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    label: 'Company reviews',
    desc: 'Read and leave honest reviews so future students know what to expect.',
  },
]

type CompanyStat = { count: number }

export default async function HomePage() {
  const supabase = await createClient()
  const { count: companyCount } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })

  const stats = [
    { label: 'Companies listed',  value: companyCount ?? 0 },
    { label: 'Industries covered', value: 8 },
    { label: 'Students served',   value: '100+' },
  ]

  return (
    <>
      <Navbar />

      <main className="pt-14">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          {/* background glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(59,130,246,0.12), transparent)',
            }}
          />

          <div className="max-w-4xl mx-auto px-5 pt-28 pb-24 text-center relative">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs mb-8"
              style={{ borderColor: 'rgba(59,130,246,0.3)', color: 'var(--color-blue)', background: 'rgba(59,130,246,0.06)', fontFamily: 'var(--font-mono)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Built for Student and any one seeking attachment in Bamenda
            </div>

            <h1
              className="text-4xl sm:text-6xl font-extrabold leading-tight mb-6"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}
            >
              Find your industrial{' '}
              <span style={{ color: 'var(--color-blue)' }}>attachment</span>{' '}
              without the guesswork
            </h1>

            <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: 'var(--color-muted)' }}>
              AttachHub connects Bamenda students with verified companies offering internship slots —
              and gives supervisors a live view of every placement.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="w-full sm:w-auto text-sm font-semibold px-8 py-3 rounded-full transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-blue)', color: '#fff' }}
              >
                Get started free →
              </Link>
              <Link
                href="/companies"
                className="w-full sm:w-auto text-sm px-8 py-3 rounded-full border transition-colors hover:border-blue-500/40"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
              >
                Browse companies
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="border-y" style={{ borderColor: 'var(--color-border)' }}>
          <div className="max-w-6xl mx-auto px-5 py-10 grid grid-cols-3 divide-x" style={{ borderColor: 'var(--color-border)' }}>
            {stats.map(s => (
              <div key={s.label} className="text-center px-4">
                <p className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
                  {s.value}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="max-w-6xl mx-auto px-5 py-24">
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-blue)', fontFamily: 'var(--font-mono)' }}>
            How it works
          </p>
          <h2 className="text-3xl font-bold mb-12" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
            Three steps to your placement
          </h2>

          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map(s => (
              <div
                key={s.n}
                className="card card-p-md flex flex-col gap-4"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ fontFamily: 'var(--font-mono)', background: 'rgba(59,130,246,0.1)', color: 'var(--color-blue)', border: '1px solid rgba(59,130,246,0.2)' }}
                >
                  {s.n}
                </span>
                <div>
                  <p className="font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>{s.title}</p>
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="max-w-6xl mx-auto px-5 py-24">
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-blue)', fontFamily: 'var(--font-mono)' }}>
              Features
            </p>
            <h2 className="text-3xl font-bold mb-12" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
              Everything in one place
            </h2>

            <div className="grid sm:grid-cols-2 gap-5">
              {FEATURES.map(f => (
                <div key={f.label} className="card card-p-md flex gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--color-blue)' }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <p className="font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>{f.label}</p>
                    <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div
            className="max-w-6xl mx-auto px-5 py-24 text-center"
            style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(59,130,246,0.07), transparent)' }}
          >
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
              Ready to find your placement?
            </h2>
            <p className="mb-8" style={{ color: 'var(--color-muted)' }}>
              Join hundreds of COLTECH students already using AttachHub.
            </p>
            <Link
              href="/auth/register"
              className="inline-block text-sm font-semibold px-10 py-3 rounded-full transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-blue)', color: '#fff' }}
            >
              Create free account →
            </Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <Footer />

      </main>
    </>
  )
}