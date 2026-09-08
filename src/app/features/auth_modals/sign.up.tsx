'use client';

import { useState } from 'react';
import Image from 'next/image';
import localFont from 'next/font/local';
import { Poppins } from 'next/font/google';
import { getClientFirestore } from '@/app/core/services/firebase';
import { doc, getDoc } from 'firebase/firestore';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const futuraDisplay = localFont({
  src: '../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

// Solid Filled Mail Icon
function SolidMailIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="3" fill="#ffffff" />
      <path
        d="M2.5 5.5L12 13.5L21.5 5.5"
        stroke="#17171a"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Solid Filled Lock Icon
function SolidLockIcon({ className = 'w-4.5 h-4.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M7 10V7a5 5 0 0 1 10 0v3"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="4" y="9.5" width="16" height="13" rx="3" fill="#ffffff" />
      <circle cx="12" cy="14.5" r="1.6" fill="#17171a" />
      <path d="M12 15.5V18.5" stroke="#17171a" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// Eye toggle icon for show/hide password
function EyeIcon({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M2 12C3.8 7.5 7.6 4.5 12 4.5C16.4 4.5 20.2 7.5 22 12C20.2 16.5 16.4 19.5 12 19.5C7.6 19.5 3.8 16.5 2 12Z"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.8" fill="#ffffff" />
    </svg>
  );
}

function EyeOffIcon({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9.88 9.88a3.8 3.8 0 1 0 4.24 4.24"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M10.73 5.08A10.43 10.43 0 0 1 12 4.5c4.4 0 8.2 3 10 7.5a13.16 13.16 0 0 1-1.67 2.68"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M6.61 6.61A13.526 13.526 0 0 0 2 12c1.8 4.5 5.6 7.5 10 7.5a9.74 9.74 0 0 0 5.39-1.61"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <line x1="3" y1="3" x2="21" y2="21" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

// Colorful Google "G" Logo
function GoogleIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToSignIn?: () => void;
  onTermsClick?: () => void;
  onPrivacyClick?: () => void;
  onSignUpSubmit?: (email: string) => void;
  email?: string;
  setEmail?: (val: string) => void;
  password?: string;
  setPassword?: (val: string) => void;
}

export function SignUpForm({
  onSuccess,
  onSwitchToSignIn,
  onTermsClick,
  onPrivacyClick,
  onSignUpSubmit,
  email: externalEmail,
  setEmail: externalSetEmail,
  password: externalPassword,
  setPassword: externalSetPassword,
}: SignUpFormProps) {
  const [internalEmail, setInternalEmail] = useState('');
  const [internalPassword, setInternalPassword] = useState('');

  const email = externalEmail !== undefined ? externalEmail : internalEmail;
  const setEmail = externalSetEmail || setInternalEmail;

  const password = externalPassword !== undefined ? externalPassword : internalPassword;
  const setPassword = externalSetPassword || setInternalPassword;

  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const isEmailFloating = emailFocused || email.length > 0;
  const isPasswordFloating = passwordFocused || password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setEmailError(null);
    setIsCheckingAccount(true);

    try {
      const db = getClientFirestore();
      const userRef = doc(db, 'users', email.trim().toLowerCase());
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        setEmailError('Account already exists');
        setIsCheckingAccount(false);
        return;
      }
    } catch (err) {
      console.warn('Check user account existence warning:', err);
    } finally {
      setIsCheckingAccount(false);
    }

    if (onSignUpSubmit) {
      onSignUpSubmit(email);
    } else if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div
      className={`w-full max-w-[420px] sm:max-w-[460px] flex flex-col items-center ${poppins.variable} ${futuraDisplay.variable}`}
      style={{ fontFamily: 'var(--font-poppins)' }}
    >
      {/* Create Account Header */}
      <h2
        className="text-white text-5xl sm:text-6xl lg:text-[68px] mb-6 sm:mb-7 tracking-wide text-center"
        style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800 }}
      >
        Create Account
      </h2>

      {/* Sign - up with Google Button */}
      <button
        type="button"
        className="w-full h-[58px] sm:h-[62px] bg-white text-black rounded-full font-bold text-base sm:text-lg flex items-center justify-center gap-3.5 hover:bg-neutral-100 active:scale-[0.99] transition-all duration-200 shadow-lg"
        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
      >
        <GoogleIcon className="w-6 h-6 shrink-0" />
        <span>Sign - up with Google</span>
      </button>

      {/* Line Divider with "Or" */}
      <div className="w-full flex items-center my-3 sm:my-3.5">
        <div className="flex-1 h-[2px] bg-white" />
        <span
          className="px-5 text-white text-2xl sm:text-3xl tracking-wider font-extrabold"
          style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800 }}
        >
          Or
        </span>
        <div className="flex-1 h-[2px] bg-white" />
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 sm:gap-5">
        {/* Email Pill Field */}
        <div className="relative w-full">
          <div
            className={`relative w-full h-[58px] sm:h-[64px] rounded-full border-2 transition-colors duration-200 bg-[#17171a] ${
              emailError
                ? 'border-red-500 ring-2 ring-red-500/20'
                : emailFocused
                ? 'border-white ring-2 ring-white/20'
                : 'border-white'
            }`}
          >
            {/* Floating label that docks onto top-left border */}
            <label
              htmlFor="signup-email-input"
              className={`absolute pointer-events-none flex items-center gap-2 transition-all duration-200 ease-out select-none ${
                isEmailFloating
                  ? '-top-[13px] left-7 px-2 bg-[#17171a] text-sm sm:text-base font-bold text-white z-10'
                  : 'top-1/2 -translate-y-1/2 left-7 px-0 bg-transparent text-base sm:text-lg font-bold text-white/50 z-0'
              }`}
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <SolidMailIcon className="w-5 h-5 text-white shrink-0" />
              <span>Email</span>
            </label>

            <input
              id="signup-email-input"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              autoComplete="email"
              className="w-full h-full bg-transparent text-white px-7 font-poppins text-base sm:text-lg font-medium outline-none rounded-full"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>

          {/* Inline error at the bottom of the input field */}
          {emailError && (
            <p
              className="text-red-400 text-xs sm:text-sm font-semibold mt-1.5 px-6 text-left"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              {emailError}
            </p>
          )}
        </div>

        {/* Password Pill Field */}
        <div className="relative w-full">
          <div
            className={`relative w-full h-[58px] sm:h-[64px] rounded-full border-2 transition-colors duration-200 bg-[#17171a] ${
              passwordFocused ? 'border-white ring-2 ring-white/20' : 'border-white'
            }`}
          >
            {/* Floating label that docks onto top-left border */}
            <label
              htmlFor="signup-password-input"
              className={`absolute pointer-events-none flex items-center gap-2 transition-all duration-200 ease-out select-none ${
                isPasswordFloating
                  ? '-top-[13px] left-7 px-2 bg-[#17171a] text-sm sm:text-base font-bold text-white z-10'
                  : 'top-1/2 -translate-y-1/2 left-7 px-0 bg-transparent text-base sm:text-lg font-bold text-white/50 z-0'
              }`}
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <SolidLockIcon className="w-4.5 h-4.5 text-white shrink-0" />
              <span>Password</span>
            </label>

            <input
              id="signup-password-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              autoComplete="new-password"
              className="w-full h-full bg-transparent text-white pl-7 pr-16 font-poppins text-base sm:text-lg font-medium outline-none rounded-full"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />

            {/* Show/Hide Toggle Button */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 text-white hover:text-white/80 transition-colors focus:outline-none"
            >
              {showPassword ? <EyeIcon className="w-7 h-7" /> : <EyeOffIcon className="w-7 h-7" />}
            </button>
          </div>
        </div>

        {/* Sign - up Submit Button */}
        <button
          type="submit"
          disabled={isCheckingAccount}
          className="w-full mt-1 sm:mt-1.5 h-[58px] sm:h-[62px] bg-white text-black rounded-full font-bold text-xl sm:text-2xl hover:bg-neutral-100 active:scale-[0.99] transition-all duration-200 shadow-lg flex items-center justify-center gap-2 disabled:opacity-75"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
        >
          {isCheckingAccount ? (
            <span className="inline-block animate-spin h-6 w-6 border-2 border-black border-t-transparent rounded-full" />
          ) : (
            <span>Sign - up</span>
          )}
        </button>

        {/* Switch to Sign-in */}
        <div className="w-full text-center mt-1 sm:mt-2">
          <span
            className="text-xs sm:text-sm text-neutral-400 font-normal"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToSignIn}
              className="text-white underline font-bold hover:text-white/80 transition-colors"
            >
              Sign-in instead
            </button>
          </span>
        </div>

        {/* Terms & Privacy */}
        <div className="w-full text-center mt-0.5">
          <p
            className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-normal"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            By signing up you agree to our
            <br />
            <button
              type="button"
              onClick={onTermsClick}
              className="text-white underline font-semibold hover:text-white/80 transition-colors"
            >
              Terms
            </button>{' '}
            and{' '}
            <button
              type="button"
              onClick={onPrivacyClick}
              className="text-white underline font-semibold hover:text-white/80 transition-colors"
            >
              Privacy Policy
            </button>
            .
          </p>
        </div>
      </form>
    </div>
  );
}

export interface SignUpProps {
  onSuccess?: () => void;
  onSwitchToSignIn?: () => void;
  onTermsClick?: () => void;
  onPrivacyClick?: () => void;
  onSignUpSubmit?: (email: string) => void;
}

export default function SignUp({
  onSuccess,
  onSwitchToSignIn,
  onTermsClick,
  onPrivacyClick,
  onSignUpSubmit,
}: SignUpProps = {}) {
  return (
    <div
      className={`w-full text-white ${poppins.variable} ${futuraDisplay.variable}`}
      style={{ fontFamily: 'var(--font-poppins)' }}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 lg:gap-16">
        {/* Left column: Denise illustration + Futura copy */}
        <div className="flex flex-col items-center justify-center shrink-0 w-full md:w-[46%] max-w-[370px]">
          <div className="relative w-[260px] h-[300px] sm:w-[300px] sm:h-[350px] lg:w-[320px] lg:h-[370px]">
            <Image
              src="/assets/images/denise_auth.png"
              alt="Denise HR thumbs up"
              fill
              priority
              className="object-contain"
            />
          </div>
          <div className="mt-4 sm:mt-5 text-center">
            <p
              className="text-white text-2xl sm:text-3xl lg:text-[32px] leading-[1.08] tracking-wide text-center"
              style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800 }}
            >
              Takes 20 seconds.
              <br />
              No credit card, no
              <br />
              fluff.
            </p>
          </div>
        </div>

        {/* Right column: Auth inputs & actions */}
        <div className="flex-1 w-full max-w-[420px] sm:max-w-[460px] flex flex-col items-center">
          <SignUpForm
            onSuccess={onSuccess}
            onSwitchToSignIn={onSwitchToSignIn}
            onTermsClick={onTermsClick}
            onPrivacyClick={onPrivacyClick}
            onSignUpSubmit={onSignUpSubmit}
          />
        </div>
      </div>
    </div>
  );
}
