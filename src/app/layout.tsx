import type { Metadata } from 'next'
import { Nunito, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/nav-bar'
import PostHogProvider from '@/components/posthog-provider'
import CookieBanner from '@/components/CookieBanner'

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
  description: 'Earni is an AI voice tutor that pays your child real money for correct answers. Maths, Reading, Writing, Science & Te Reo Māori. Year 1–13. 7-day free trial, no card needed.',
  keywords: [
    'AI tutor NZ', 'online tutoring New Zealand', 'maths tutor NZ', 'learni', 'earni',
    'NZ curriculum', 'year 1-13 tutor', 'kids learning app', 'educational app NZ',
    'reading tutor', 'Te Reo Maori learning', 'school tutor NZ', 'NCEA prep',
    'after school tutor NZ', 'homework help NZ', 'reward learning app',
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
    description: 'Voice tutoring + real money rewards. Year 1–13. 7-day free trial.',
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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Learni',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#2ec4b6',
    'theme-color': '#2ec4b6',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${nunito.variable} ${jakarta.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Learni" />
        <meta name="application-name" content="Learni" />
        <meta name="msapplication-TileColor" content="#2ec4b6" />
        <meta name="theme-color" content="#2ec4b6" />
      </head>
      <body className="antialiased" style={{ paddingTop: '52px' }}>
        <PostHogProvider />
        <NavBar />
        {children}
        <CookieBanner />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function(err) {
                console.warn('SW registration failed:', err);
              });
            });
          }
        `}} />
      </body>
    </html>
  )
}
