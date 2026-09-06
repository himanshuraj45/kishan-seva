// sentry.edge.config.ts — Edge runtime Sentry initialisation
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ||
    'https://3e88a6de96f74a5d694ffdedaf2ff220@o4511896738398208.ingest.us.sentry.io/4511896740757504',
  environment: process.env.NODE_ENV ?? 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  initialScope: {
    tags: { app: 'kisanseva-web', component: 'edge-middleware' },
  },
})
