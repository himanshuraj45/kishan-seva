"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import Image from "next/image";
import { Show, UserButton } from "@clerk/nextjs";

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="fixed w-full top-0 z-50 pt-4 pb-2 px-4 sm:px-6 lg:px-8 bg-transparent pointer-events-none group">
      <div className="w-full max-w-screen-2xl mx-auto bg-white hover:bg-white/95 backdrop-blur-md rounded-full shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05),0_10px_20px_-2px_rgba(0,0,0,0.02)] h-[72px] flex items-center justify-between px-6 lg:px-8 border border-white/40 hover:border-white/80 pointer-events-auto transition-all duration-300">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group/logo outline-none focus:outline-none select-none">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
            <Image 
              src="/icon.jpg" 
              alt="KisanSeva Logo" 
              fill 
              className="object-cover group-hover/logo:scale-105 transition-transform duration-300"
            />
          </div>
          <span className="text-xl font-extrabold text-[#1f8742] tracking-tight leading-none group-hover/logo:opacity-90 transition-opacity">
            KisanSeva
          </span>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-[15px] font-medium text-slate-800">

          <Link href="/diagnose" className="hover:text-[#1f8742] transition-colors">
            Crops
          </Link>
          <Link href="/market" className="hover:text-[#1f8742] transition-colors">
            Markets
          </Link>
          <Link href="/schedule" className="hover:text-[#1f8742] transition-colors">
            Weather
          </Link>
          <Link href="/dashboard" className="hover:text-[#1f8742] transition-colors">
            Dashboard
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="text-slate-800 hover:text-slate-900 font-medium text-[15px] px-6 py-2 rounded-full border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all hidden sm:block"
            >
              Login
            </Link>
            <Link
              href="/sign-up"
              className="bg-[#1f8742] hover:bg-[#166534] text-white font-medium text-[15px] px-6 py-2 rounded-full shadow-sm hover:shadow transition-all"
            >
              Register
            </Link>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>

      </div>
    </header>
  );
}

