import React from "react";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#021f18] to-[#044a33] text-white p-4">
      
      {/* Brand Header */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-[#10b981] p-1.5 rounded-lg flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#10b981"/>
              <path d="M7 12C7 12 9.5 7 15 7C15 7 15 12.5 10 15.5L7 12Z" fill="white"/>
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight">KisanSeva</span>
        </div>
        
        <p className="text-[#10b981] text-xs font-bold tracking-[0.2em] uppercase mb-2">Join the community</p>
        <h2 className="text-3xl font-semibold">Welcome to KisanSeva</h2>
      </div>

      {children}
      
      {/* Language Footer */}
      <div className="mt-12 flex gap-4 text-sm font-medium text-emerald-500/50">
        <span className="text-[#10b981] cursor-pointer">English</span>
        <span className="cursor-pointer hover:text-emerald-400">हिंदी</span>
        <span className="cursor-pointer hover:text-emerald-400">मराठी</span>
        <span className="cursor-pointer hover:text-emerald-400">தமிழ்</span>
        <span className="cursor-pointer hover:text-emerald-400">తెలుగు</span>
        <span className="cursor-pointer hover:text-emerald-400">ಕನ್ನಡ</span>
      </div>
    </div>
  );
}
