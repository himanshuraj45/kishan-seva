import type { Metadata, Viewport } from 'next'
import './globals.css'
import OfflineIndicator from '@/components/layout/OfflineIndicator'

export const metadata: Metadata = {
  title: {
    default: 'KisanSeva — Smart Crop Advisory for Smallholder Farmers',
    template: '%s | KisanSeva'
  },
  description:
    'AI-powered crop disease detection, personalized irrigation schedules, live mandi price comparisons — accessible on any phone or even via SMS/IVR call.',
  keywords: [
    'crop disease detection', 'mandi price', 'smart farming', 'kisan advisory',
    'irrigation schedule', 'fertilizer recommendation', 'agritech India',
    'smallholder farmer app', 'krishi advisory', 'plant disease app'
  ],
  authors: [{ name: 'KisanSeva Team' }],
  creator: 'KisanSeva',
  publisher: 'KisanSeva',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://kisanseva.app'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://kisanseva.app',
    siteName: 'KisanSeva',
    title: 'KisanSeva — Smart Crop Advisory for Smallholder Farmers',
    description: 'AI crop disease detection, irrigation scheduling & live mandi prices.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'KisanSeva App' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KisanSeva — Smart Crop Advisory',
    description: 'AI crop disease detection, irrigation scheduling & live mandi prices.',
    images: ['/og-image.png']
  },
  robots: { index: true, follow: true },
  icons: {
    icon: '/icon.jpg',
    apple: '/icon.jpg',
  }
}

export const viewport: Viewport = {
  themeColor: '#e8b672',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover'
}

import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
            rel="stylesheet"
          />
          <script dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `
          }} />

        </head>
        <body suppressHydrationWarning className="min-h-screen flex flex-col antialiased bg-white text-slate-900">
          <OfflineIndicator />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}


