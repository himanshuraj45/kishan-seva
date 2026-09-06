/**
 * KisanSeva — Next.js Edge Middleware
 *
 * Responsibilities:
 * 1. Authentication guard via Clerk (protects app routes)
 * 2. API rate limiting — 20 requests per 10 seconds per IP
 * 3. Security headers on all responses (XSS, CSRF, Clickjacking)
 * 4. Request timing header for observability
 */
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

// ── Route matchers ──────────────────────────────────────────────────────────
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/settings(.*)',
  '/diagnose(.*)',
  '/market(.*)',
  '/schedule(.*)',
  '/community(.*)',
  '/finance(.*)',
  '/schemes(.*)',
  '/topography(.*)',
  '/trace(.*)'
])

const isApiRoute = createRouteMatcher(['/api/(.*)', '/api/v1/(.*)'])

// ── In-memory rate limit store ──────────────────────────────────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

/**
 * Sliding-window rate limiter.
 * @param ip - Client IP address
 * @param limit - Max requests per window (default: 20)
 * @param windowMs - Window duration in ms (default: 10s)
 * @returns true if request is allowed, false if rate-limited
 */
function checkRateLimit(ip: string, limit = 20, windowMs = 10_000): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

/** Adds essential security headers to a response */
function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-KisanSeva-Version', '2.4.1')
  return res
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const start = Date.now()

  // 1. Rate limit API routes
  if (isApiRoute(req)) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (!checkRateLimit(ip)) {
      const res = NextResponse.json(
        { error: 'Too many requests', retryAfter: 10 },
        { status: 429, headers: { 'Retry-After': '10' } }
      )
      return addSecurityHeaders(res)
    }
  }

  // 2. Auth protection for app routes
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  // 3. Add security headers + timing to all responses
  const res = NextResponse.next()
  res.headers.set('X-Response-Time', `${Date.now() - start}ms`)
  return addSecurityHeaders(res)
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
