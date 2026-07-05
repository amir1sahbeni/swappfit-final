import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client for use in:
 * - Server Components
 * - Route Handlers
 * - Server Actions
 *
 * Reads/writes auth session from HTTP cookies.
 */
export async function createServerClient() {
  const cookieStore = await cookies()

  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
            // Called from a Server Component — cookies can only be mutated
            // from Server Actions or Route Handlers; safe to ignore here.
          }
        },
      },
    }
  )
}
