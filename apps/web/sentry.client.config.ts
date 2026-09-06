// sentry.client.config.ts — Browser-side Sentry initialisation
import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ||
  'https://3e88a6de96f74a5d694ffdedaf2ff220@o4511896738398208.ingest.us.sentry.io/4511896740757504'

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',
  release: process.env.NEXT_PUBLIC_APP_VERSION ?? 'kisanseva@1.0.0',

  // Performance monitoring — capture 10% of transactions in prod, 100% in dev
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay — record 10% of sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      // Mask PII — farmer names, phone numbers
      maskAllText: false,
      blockAllMedia: false,
      maskAllInputs: true,
    }),
    Sentry.browserTracingIntegration(),
    Sentry.feedbackIntegration({
      colorScheme: 'light',
      buttonLabel: 'Report Issue',
      submitButtonLabel: 'Send Report',
      formTitle: 'Report a Problem',
    }),
  ],

  // Filter out noise
  beforeSend(event) {
    // Drop network errors from user connectivity issues
    if (event.exception?.values?.[0]?.type === 'TypeError') {
      const msg = event.exception.values[0].value ?? ''
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        return null
      }
    }
    return event
  },

  // Tag every event with KisanSeva context
  initialScope: {
    tags: {
      app: 'kisanseva-web',
      component: 'frontend',
    },
  },
})
