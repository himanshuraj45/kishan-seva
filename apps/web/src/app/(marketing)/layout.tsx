import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

import GoogleTranslateWidget from '@/components/layout/GoogleTranslateWidget'
import './marketing.css'
import { Show, UserButton } from '@clerk/nextjs'
import ChatWidget from '@/components/chat/ChatWidget'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] w-full pointer-events-none">
        <div className="max-w-[1376px] mx-auto px-8 pt-6 pointer-events-auto">
          <nav className="navbar">
            <Link href="/" className="logo flex items-center gap-2 outline-none focus:outline-none">
              <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0">
                <Image src="/icon.jpg" alt="KisanSeva Logo" fill className="object-cover" />
              </div>
              <span>KisanSeva</span>
            </Link>
            <ul className="nav-links">
              <li><Link href="/diagnose">Crops</Link></li>
              <li><Link href="/soil-health">Soil Test</Link></li>
              <li><Link href="/schedule">My Plots</Link></li>
              <li><Link href="/market">Markets</Link></li>
              <li><Link href="/community">Community</Link></li>
              <li><Link href="/dashboard">Dashboard</Link></li>
            </ul>
            <div className="auth-buttons flex items-center gap-3">
              <GoogleTranslateWidget className="mt-1" />
              <Show when="signed-out">
                <Link href="/sign-in" className="btn btn-outline nav-cta hidden sm:flex">Login</Link>
                <Link href="/sign-up" className="btn btn-solid nav-cta hidden sm:flex">Register</Link>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </div>
          </nav>
        </div>
      </header>
      {children}
      <ChatWidget />
    </>
  )
}

