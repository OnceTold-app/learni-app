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
  title: {
    default: 'Learni — AI Tutor That Pays Your Child to Learn | NZ Year 1–13',
    template: '%s | Learni',
  },
  description: 'Earni is an AI voice tutor that pays your child real money for correct answers. Maths, Reading, Writing, Science & Te Reo Māori. NZ Curriculum aligned, Year 1–13. 14-day free trial.',
  keywords: [
    'AI tutor NZ', 'online tutoring New Zealand', 'maths tutor NZ', 'learni', 'earni',
    'NZ curriculum', 'year 1-13 tutor', 'kids learning app', 'educational app NZ',
    'reading tutor', 'Te Reo Maori learning', 'school tutor NZ', 'NCEA prep',
    'Kip McGrath alternative', 'homework help NZ', 'reward learning app',
  ],
  authors: [{ name: 'Learni', url: 'https://learniapp.co' }],
  creator: 'Learni',
  metadataBase: new URL('https://learniapp.co'),
  alternates: {
    canonical: 'https://learniapp.co',
  },
  openGraph: {
    type: 'website',
    locale: 'en_NZ',
    url: 'https://learniapp.co',
    siteName: 'Learni',
    title: 'Learni — The AI Tutor That Pays Your Child to Learn',
    description: 'Voice tutoring, baseline assessment, visual maths, achievement badges & real money rewards. Maths, Reading, Writing, Science & Te Reo Māori. NZ Year 1–13.',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Learni — AI Tutor That Pays Your Child to Learn',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Learni — The AI Tutor That Pays Your Child to Learn',
    description: 'Voice tutoring + real money rewards. NZ Curriculum. Year 1–13.',
    images: ['/og-image.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
