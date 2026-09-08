'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import localFont from 'next/font/local';
import { Poppins } from 'next/font/google';
import { motion, AnimatePresence } from 'framer-motion';
import SpecularButton from '@/components/specular_button';
import { useAuthUser, signOutUser } from '@/app/core/services/auth.state';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

const futuraDisplay = localFont({
  src: '../../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

interface BannerWebProps {
  onSignInClick?: () => void;
}

export default function BannerWeb({ onSignInClick }: BannerWebProps = {}) {
  const user = useAuthUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    };
  }, []);

  return (
    <>
    <div
      className={`relative z-10 w-screen overflow-hidden bg-white ${poppins.variable} ${futuraDisplay.variable}`}
      style={{ borderRadius: '0 0 2.5rem 2.5rem', minHeight: 300 }}
    >
      {/* Top-Right: Sign in button or User Profile pill with dropdown */}
      <div
        className="absolute right-8 top-6 z-20"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {!user ? (
          <SpecularButton
            radius={999}
            size="md"
            tint="#0b0d12"
            tintOpacity={1}
            textColor="#f5f5f5"
            onClick={onSignInClick}
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600, minWidth: 160 }}
          >
            Sign in
          </SpecularButton>
        ) : (
          <div className="relative">
            {/* User Profile Pill Button */}
            <div
              className="flex items-center gap-2.5 h-[46px] px-5 rounded-full cursor-pointer transition-all duration-200 shadow-md border border-white/20 hover:border-white/50 select-none"
              style={{
                backgroundColor: '#0b0d12',
              }}
              onClick={() => setIsDropdownOpen((prev) => !prev)}
            >
              {/* profile_icon.svg on the left */}
              <div className="relative w-5 h-5 shrink-0 flex items-center justify-center">
                <Image
                  src="/assets/icons/profile_icon.svg"
                  alt="Profile"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>

              {/* User Email */}
              <span
                className="text-sm font-semibold text-[#f5f5f5] max-w-[200px] truncate"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                {user.email}
              </span>

              {/* Dropdown Chevron */}
              <svg
                className={`w-3.5 h-3.5 ml-1 text-white/70 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180 text-white' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Dropdown Container */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-2 w-60 rounded-2xl border-2 border-white p-3 shadow-2xl z-30"
                  style={{
                    backgroundColor: '#17171a',
                    fontFamily: 'var(--font-poppins)',
                  }}
                >
                  <div className="px-3 py-2">
                    <p
                      className="text-xs text-white/50 uppercase tracking-wider font-normal"
                      style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
                    >
                      Signed in as
                    </p>
                    <p
                      className="text-sm text-white truncate font-bold mt-0.5"
                      style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
                    >
                      {user.email}
                    </p>
                  </div>

                  <div className="h-[1px] bg-white/10 my-2" />

                  <button
                    type="button"
                    onClick={() => {
                      signOutUser();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-white hover:bg-white/10 active:scale-[0.98] transition-all text-left cursor-pointer"
                    style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
                  >
                    <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
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

      {/* Two-column layout */}
      <div className="flex h-full w-full items-center" style={{ minHeight: 300 }}>

        {/* Left — pill + Denise */}
        <div
          className="relative shrink-0"
          style={{ width: 570, height: 170, marginLeft: '8%', marginBottom: 28, overflow: 'visible', alignSelf: 'flex-end' }}
        >
          <div className="absolute inset-0 border-2 border-black/30" style={{ borderRadius: 9999 }} />
          <div className="absolute bottom-0 left-0" style={{ width: 380, pointerEvents: 'none' }}>
            <Image
              src="/assets/images/denise_hr_laptop.svg"
              alt="Denise at her laptop"
              width={380}
              height={430}
              priority
              className="block"
            />
          </div>
        </div>

        {/* Right — text + extras */}
        <div className="flex flex-1 flex-col justify-between self-stretch py-8 pl-12 pr-12">

          {/* Top spacer to push heading toward center */}
          <div />

          {/* Heading + subtext */}
          <div>
            <h1
              className="leading-none text-black"
              style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800, fontSize: 'clamp(3.5rem, 6vw, 7rem)' }}
            >
              Let&rsquo;s get started
            </h1>
            <p
              className="mt-6 leading-snug text-black/60"
              style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400, fontSize: 'clamp(1.1rem, 1.6vw, 1.5rem)' }}
            >
              A good template won&rsquo;t save a bad bullet point.
              <br />
              But let&rsquo;s start somewhere.
            </p>
          </div>

          {/* Bottom row — stats / badges */}
          <div className="flex items-center gap-6">
            {/* Divider */}
            <div className="h-px flex-1 bg-black/10" />

            {/* Stat: template count */}
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-2xl leading-none text-black"
                style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800 }}
              >
                5
              </span>
              <span
                className="text-xs uppercase tracking-widest text-black/40"
                style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
              >
                Templates
              </span>
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-black/15" />

            {/* Free badge */}
            <span
              className="rounded-full border border-black/20 px-3 py-1 text-xs uppercase tracking-widest text-black/50"
              style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
            >
              Free to use
            </span>

            {/* Divider */}
            <div className="h-4 w-px bg-black/15" />

            {/* No sign-up note */}
            <span
              className="text-xs text-black/40"
              style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
            >
              No account required
            </span>
          </div>

        </div>
      </div>
    </div>

    {/* "Templates" stamp — centered, tilted, overlapping the dark bg. */}
    <div className={`relative z-20 flex justify-center ${futuraDisplay.variable}`} style={{ marginTop: 56 }}>
      <span
        className="inline-block -rotate-2 rounded-md bg-white px-20 py-5 text-black shadow-lg tracking-widest"
        style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800, fontSize: 'clamp(4rem, 7vw, 7rem)', lineHeight: 1 }}
      >
        Templates
      </span>
    </div>
    </>
  );
}
