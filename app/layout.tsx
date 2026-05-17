import type { Metadata } from 'next'
import { Syne, Plus_Jakarta_Sans, DM_Mono } from 'next/font/google'
import './globals.css'
// Add to top of layout.tsx imports
import NavigationProgress from '@/components/ui/NavigationProgress'

// Inside your <body> tag, right at the top:


const syne = Syne({
  subsets:  ['latin'],
  weight:   ['600', '700', '800'],
  variable: '--font-heading',
  display:  'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets:  ['latin'],
  weight:   ['400', '500', '600'],
  variable: '--font-body',
  display:  'swap',
})

const dmMono = DM_Mono({
  subsets:  ['latin'],
  weight:   ['400', '500'],
  variable: '--font-mono',
  display:  'swap',
})

export const metadata: Metadata = {
  title:       'AttachHub — Student Internship Platform',
  description: 'Find, apply for, and manage mandatory industrial attachments at the University of Bamenda.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${jakarta.variable} ${dmMono.variable}`}
    >
      <body>
          <NavigationProgress />
           {children}
      </body>
    </html>
  )
}