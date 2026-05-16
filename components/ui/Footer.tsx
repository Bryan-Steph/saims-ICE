import Link from 'next/link'

const COLS = [
  {
    heading: 'PRODUCT',
    links: ['Features', 'Pricing', 'Integrations', 'Changelog'],
  },
  {
    heading: 'COMPANY',
    links: ['About Us', 'Careers', 'Blog', 'Contact'],
  },
  {
    heading: 'LEGAL',
    links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
  },
  {
    heading: 'SUPPORT',
    links: ['Help Center', 'Documentation', 'Community'],
  },
]

export function Footer() {
  return (
    <footer
      className="border-t"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#060B16' }}
    >
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-10">
        {/* Top: logo + columns */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <p
              className="text-xl font-extrabold mb-3 flex items-center gap-0.5"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}
            >
              AttachHub
              <span
                className="inline-block w-2 h-2 rounded-full mb-3 ml-0.5"
                style={{ background: 'var(--color-blue)' }}
              />
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              The unified platform for university students in Cameroon to connect with industry leaders.
            </p>
          </div>

          {/* Link columns */}
          {COLS.map(col => (
            <div key={col.heading}>
              <p
                className="text-xs font-semibold mb-4 tracking-widest"
                style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
              >
                {col.heading}
              </p>
              <ul className="flex flex-col gap-3">
                {col.links.map(l => (
                  <li key={l}>
                    <Link
                      href="#"
                      className="text-xs transition-colors hover:opacity-100"
                      style={{ color: 'rgba(139,164,200,0.65)' }}
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <p
            className="text-xs"
            style={{ color: 'rgba(139,164,200,0.5)', fontFamily: 'var(--font-mono)' }}
          >
            © {new Date().getFullYear()} ATTACHHUB SAIMS. BAMENDA, CAMEROON.
          </p>
          <div className="flex items-center gap-4">
            {['Privacy', 'Terms', 'Cookies'].map(t => (
              <Link
                key={t}
                href="#"
                className="text-xs transition-opacity hover:opacity-100"
                style={{ color: 'rgba(139,164,200,0.4)', fontFamily: 'var(--font-mono)' }}
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}