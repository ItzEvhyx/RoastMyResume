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

interface DeniseSignInMsgMobileProps {
  onSignUp?: () => void;
  className?: string;
}

export default function DeniseSignInMsgMobile({ onSignUp, className }: DeniseSignInMsgMobileProps) {
  return (
    <div
      className={cn(
        poppins.variable,
        futuraDisplay.variable,
        'flex flex-col items-center justify-center w-full h-full text-center px-4 py-4 overflow-y-auto select-none',
        className
      )}
    >
      {/* Denise Illustration */}
      <div className="relative w-full max-w-[210px] aspect-[1008/1063] mb-3 shrink-0 pointer-events-none">
        <Image
          src="/assets/images/denise_signup.png"
          alt="Denise from HR"
          fill
          sizes="210px"
          className="object-contain"
          priority
        />
      </div>

      {/* Header Message: "Hey, I'm Denise" + waving hand */}
      <div className="flex items-center justify-center gap-2 mb-2 shrink-0">
        <h2
          className={cn(
            futuraDisplay.className,
            'text-2xl sm:text-3xl uppercase tracking-wider text-white font-normal leading-none'
          )}
        >
          Hey, I'm Denise
        </h2>
        <div className="relative w-7 h-7 sm:w-8 sm:h-8 shrink-0 -mt-1">
          <Image
            src="/assets/images/hand_wave.png"
            alt="Hand wave"
            fill
            sizes="32px"
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Body Copy - darker gray */}
      <p
        className={cn(
          poppins.className,
          'text-neutral-400 font-bold text-sm sm:text-[15px] leading-snug max-w-[320px] text-center mb-3.5'
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
          'px-9 sm:px-10 py-3.5 rounded-full bg-white text-black font-bold text-base',
          'shadow-xl shadow-black/30 active:scale-95 transition-all duration-200 cursor-pointer shrink-0'
        )}
      >
        Sign - up for free
      </button>
    </div>
  );
}
