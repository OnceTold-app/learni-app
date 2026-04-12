import type { Metadata } from 'next'
import { Nunito, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/nav-bar'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-nunito',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  title: 'Learni — Learn it. Earn it.',
  description: 'AI voice tutor that pays your child real money to learn. NZ Curriculum aligned. Year 1–13.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${nunito.variable} ${jakarta.variable}`}>
      <body className="antialiased" style={{ paddingTop: '52px' }}>
        <NavBar />
        {children}
      </body>
    </html>
  )
}
