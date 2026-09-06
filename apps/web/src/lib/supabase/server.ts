import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'

export async function createClient() {
  const cookieStore = await cookies()
  const { getToken } = await auth()
  
  // The token is configured in the Clerk Dashboard under JWT Templates
  let supabaseAccessToken = null
  try {
    supabaseAccessToken = await getToken({ template: 'supabase' })
  } catch (err) {
    console.warn('Clerk getToken failed (missing supabase template?):', err)
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: supabaseAccessToken ? {
          Authorization: `Bearer ${supabaseAccessToken}`,
        } : {},
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  )
}
