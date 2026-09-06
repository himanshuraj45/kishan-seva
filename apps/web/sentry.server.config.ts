// sentry.server.config.ts — Node.js server-side Sentry initialisation
import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ||
  'https://3e88a6de96f74a5d694ffdedaf2ff220@o4511896738398208.ingest.us.sentry.io/4511896740757504'

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',
  release: process.env.NEXT_PUBLIC_APP_VERSION ?? 'kisanseva@1.0.0',

  // Capture 100% of server-side transactions in dev, 20% in prod
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Log to console in development
  debug: process.env.NODE_ENV === 'development',

  integrations: [
    Sentry.captureConsoleIntegration({ levels: ['error', 'warn'] }),
  ],

  // Attach request data to all server events
  beforeSend(event, hint) {
    // Tag which AI provider caused an error
    const err = hint?.originalException as any
    if (err?.provider) {
      event.tags = { ...event.tags, llm_provider: err.provider }
    }
    return event
  },

  initialScope: {
    tags: {
      app: 'kisanseva-web',
      component: 'api-routes',
    },
  },
})
