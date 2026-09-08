'use client';

import { useState } from 'react';
import Image from 'next/image';
import localFont from 'next/font/local';
import { Poppins } from 'next/font/google';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthUser, signOutUser } from '@/app/core/services/auth.state';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-poppins',
});

const futuraDisplay = localFont({
  src: '../../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

interface BannerMobileProps {
  onSignInClick?: () => void;
}

export default function BannerMobile({ onSignInClick }: BannerMobileProps = {}) {
  const user = useAuthUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <>
    <div
      className={`relative z-10 w-screen overflow-hidden bg-white ${poppins.variable} ${futuraDisplay.variable}`}
      style={{ borderRadius: '0 0 1.75rem 1.75rem', minHeight: 148 }}
    >
      {/* Top right mobile auth button / profile */}
      <div className="absolute right-4 top-3 z-20">
        {!user ? (
          <button
            type="button"
            onClick={onSignInClick}
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#f5f5f5] bg-[#0b0d12] shadow-sm"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Sign in
          </button>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold text-[#f5f5f5] bg-[#0b0d12] shadow-sm border border-white/20"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
                <Image
                  src="/assets/icons/profile_icon.svg"
                  alt="Profile"
                  width={16}
                  height={16}
                  className="object-contain"
                />
              </div>
              <span className="max-w-[100px] truncate">{user.email}</span>
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border-2 border-white p-2.5 shadow-2xl z-30"
                  style={{ backgroundColor: '#17171a', fontFamily: 'var(--font-poppins)' }}
                >
                  <div className="px-2 py-1">
                    <p className="text-[10px] text-white/50 uppercase tracking-wider font-normal" style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}>Signed in as</p>
                    <p className="text-xs font-bold text-white truncate mt-0.5" style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}>{user.email}</p>
                  </div>
                  <div className="h-[1px] bg-white/10 my-1.5" />
                  <button
                    type="button"
                    onClick={() => {
                      signOutUser();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-bold text-white hover:bg-white/10 text-left cursor-pointer"
                    style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
                  >
                    <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-white hover:text-red-300 transition-colors">Sign - out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Single row: pill+Denise left, text right — both centered on the same axis */}
      <div className="flex h-full w-full items-center" style={{ minHeight: 148, paddingTop: 8, paddingBottom: 16 }}>

        {/* Left — pill + Denise */}
        <div
          className="relative shrink-0"
          style={{ width: 140, height: 78, marginLeft: '5%', overflow: 'visible' }}
        >
          {/* Pill outline */}
          <div
            className="absolute inset-0 border-2 border-black/25"
            style={{ borderRadius: 9999 }}
          />
          {/* Denise */}
          <div className="absolute bottom-0 left-0" style={{ width: 120, pointerEvents: 'none' }}>
            <Image
              src="/assets/images/denise_hr_laptop.svg"
              alt="Denise at her laptop"
              width={120}
              height={135}
              priority
              className="block"
            />
          </div>
        </div>

        {/* Right — text left-aligned, vertically centered */}
        <div
          className="flex flex-col justify-center pl-4"
          style={{ flex: 1 }}
        >
          <h1
            className="leading-none text-black"
            style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800, fontSize: 'clamp(1.4rem, 5.5vw, 2rem)' }}
          >
            Let&rsquo;s get started
          </h1>
          <p
            className="mt-2 leading-snug text-black/55"
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400, fontSize: 'clamp(0.75rem, 3vw, 0.9rem)' }}
          >
            A good template won&rsquo;t save<br />a bad bullet point.<br />But let&rsquo;s start somewhere.
          </p>
        </div>

      </div>
    </div>

    {/* Templates stamp */}
    <div className={`relative z-20 flex justify-center ${futuraDisplay.variable}`} style={{ marginTop: 48 }}>
      <span
        className="inline-block -rotate-2 rounded-md bg-white px-10 py-4 text-black shadow-lg tracking-widest"
        style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800, fontSize: 'clamp(2.5rem, 9vw, 3.5rem)', lineHeight: 1 }}
      >
        Templates
      </span>
    </div>
    </>
  );
}
