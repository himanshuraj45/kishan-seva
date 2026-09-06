/**
 * @file src/app/(app)/layout.tsx
 * @description Server-side layout wrapper for all authenticated app routes.
 *
 * Fetches the authenticated farmer's profile from Supabase (with a Clerk fallback)
 * and passes it to `AppLayoutClient` which renders the shell UI.
 */
import React from 'react';
import { createClient } from '@/lib/supabase/server';
import AppLayoutClient from './AppLayoutClient';
import { currentUser } from '@clerk/nextjs/server';

/** Minimal profile shape used by the app shell. */
interface FarmerProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  farm_location?: string;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const supabase = await createClient();

  // Construct a baseline profile from Clerk data as a safe fallback
  let profile: FarmerProfile = {
    id: user?.id ?? '',
    name: user?.firstName ?? 'Kisan',
    email: user?.primaryEmailAddress?.emailAddress ?? '',
  };

  if (user) {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        // Supabase profile takes precedence over the Clerk fallback
        profile = profileData as FarmerProfile;
      } else if (error) {
        // Ignore expected "no rows" / invalid UUID errors
        if (error.code !== '22P02' && error.code !== 'PGRST303') {
          console.error('Supabase profile fetch error:', JSON.stringify(error, null, 2));
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile from Supabase:', err);
    }
  }

  return (
    <AppLayoutClient profile={profile}>
      {children}
    </AppLayoutClient>
  );
}
