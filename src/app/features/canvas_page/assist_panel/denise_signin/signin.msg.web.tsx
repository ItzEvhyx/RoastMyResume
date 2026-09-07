'use client';

import Image from 'next/image';
import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import { cn } from '@/lib/utils';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const futuraDisplay = localFont({
  src: '../../../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

interface DeniseSignInMsgWebProps {
  onSignUp?: () => void;
  className?: string;
}

export default function DeniseSignInMsgWeb({ onSignUp, className }: DeniseSignInMsgWebProps) {
  return (
    <div
      className={cn(
        poppins.variable,
        futuraDisplay.variable,
        'flex flex-col items-center justify-center w-full h-full text-center px-4 py-6 overflow-y-auto select-none',
        className
      )}
    >
      {/* Denise Illustration */}
      <div className="relative w-full max-w-[260px] sm:max-w-[290px] aspect-[1008/1063] mb-4 shrink-0 pointer-events-none">
        <Image
          src="/assets/images/denise_signup.png"
          alt="Denise from HR"
          fill
          sizes="(max-width: 768px) 260px, 290px"
          className="object-contain"
          priority
        />
      </div>

      {/* Header Message: "Hey, I'm Denise" + waving hand */}
      <div className="flex items-center justify-center gap-2.5 mb-3 shrink-0">
        <h2
          className={cn(
            futuraDisplay.className,
            'text-3xl sm:text-[34px] md:text-[36px] uppercase tracking-wider text-white font-normal leading-none'
          )}
        >
          Hey, I'm Denise
        </h2>
        <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 -mt-1">
          <Image
            src="/assets/images/hand_wave.png"
            alt="Hand wave"
            fill
            sizes="36px"
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Body Copy - darker gray to clearly separate hierarchy from Denise heading */}
      <p
        className={cn(
          poppins.className,
          'text-neutral-400 font-bold text-[15px] sm:text-[16px] leading-snug max-w-[360px] text-center mb-3.5'
        )}
      >
        I need you to sign in first &nbsp;just so I can keep track of your reviews and not get overwhelmed helping everyone at once.
      </p>

      {/* Sign-up Pill Button - bigger CTA */}
      <button
        type="button"
        onClick={onSignUp}
        className={cn(
          poppins.className,
          'px-10 sm:px-12 py-3.5 sm:py-4 rounded-full bg-white text-black font-bold text-base sm:text-lg',
          'shadow-xl shadow-black/30 hover:bg-neutral-100 hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer shrink-0'
        )}
      >
        Sign - up for free
      </button>
    </div>
  );
}
