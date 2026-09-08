'use client';

import { useState } from 'react';
import Image from 'next/image';
import localFont from 'next/font/local';
import { Poppins } from 'next/font/google';
import { setAuthUser } from '@/app/core/session/session';

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

// Solid Filled Mail Icon (matches Reference Image)
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

// Solid Filled Lock Icon (matches Reference Image)
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

// Eye toggle icon for show/hide password (open eye matching reference mockup)
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

export interface SignInFormProps {
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
  onForgotPassword?: () => void;
}

export function SignInForm({
  onSuccess,
  onSwitchToSignUp,
  onForgotPassword,
}: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const isEmailFloating = emailFocused || email.length > 0;
  const isPasswordFloating = passwordFocused || password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please enter both email and password');
      return;
    }

    setAuthError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Sign-in failed. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Credentials verified — set session
      setAuthUser({ email: email.trim().toLowerCase() });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Sign-in error:', err);
      setAuthError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`w-full max-w-[420px] sm:max-w-[460px] flex flex-col items-center ${poppins.variable} ${futuraDisplay.variable}`}
      style={{ fontFamily: 'var(--font-poppins)' }}
    >
      {/* Sign-in Header */}
      <h2
        className="text-white text-3xl sm:text-6xl lg:text-[68px] mb-3 sm:mb-8 tracking-wide text-center"
        style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800 }}
      >
        Sign-in
      </h2>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 sm:gap-5">
        {/* Email Pill Field with transition border label */}
        <div className="relative w-full">
          <div
            className={`relative w-full h-[50px] sm:h-[64px] rounded-full border-2 transition-colors duration-200 bg-[#17171a] ${
              emailFocused ? 'border-white ring-2 ring-white/20' : 'border-white'
            }`}
          >
            {/* Floating label that docks onto top-left border */}
            <label
              htmlFor="auth-email-input"
              className={`absolute pointer-events-none flex items-center gap-1.5 sm:gap-2 transition-all duration-200 ease-out select-none ${
                isEmailFloating
                  ? '-top-[11px] sm:-top-[13px] left-5 sm:left-7 px-2 bg-[#17171a] text-xs sm:text-base font-bold text-white z-10'
                  : 'top-1/2 -translate-y-1/2 left-5 sm:left-7 px-0 bg-transparent text-sm sm:text-lg font-bold text-white/50 z-0'
              }`}
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <SolidMailIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />
              <span>Email</span>
            </label>

            <input
              id="auth-email-input"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setAuthError(null); }}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              autoComplete="email"
              className="w-full h-full bg-transparent text-white px-5 sm:px-7 font-poppins text-sm sm:text-lg font-medium outline-none rounded-full"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>
        </div>

        {/* Password Pill Field with transition border label + show/hide toggle */}
        <div className="relative w-full">
          <div
            className={`relative w-full h-[50px] sm:h-[64px] rounded-full border-2 transition-colors duration-200 bg-[#17171a] ${
              passwordFocused ? 'border-white ring-2 ring-white/20' : 'border-white'
            }`}
          >
            {/* Floating label that docks onto top-left border */}
            <label
              htmlFor="auth-password-input"
              className={`absolute pointer-events-none flex items-center gap-1.5 sm:gap-2 transition-all duration-200 ease-out select-none ${
                isPasswordFloating
                  ? '-top-[11px] sm:-top-[13px] left-5 sm:left-7 px-2 bg-[#17171a] text-xs sm:text-base font-bold text-white z-10'
                  : 'top-1/2 -translate-y-1/2 left-5 sm:left-7 px-0 bg-transparent text-sm sm:text-lg font-bold text-white/50 z-0'
              }`}
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <SolidLockIcon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-white shrink-0" />
              <span>Password</span>
            </label>

            <input
              id="auth-password-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setAuthError(null); }}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              autoComplete="current-password"
              className="w-full h-full bg-transparent text-white pl-5 pr-12 sm:pl-7 sm:pr-16 font-poppins text-sm sm:text-lg font-medium outline-none rounded-full"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />

            {/* Show/Hide Toggle Button */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 p-1 text-white hover:text-white/80 transition-colors focus:outline-none"
            >
              {showPassword ? <EyeIcon className="w-5 h-5 sm:w-7 sm:h-7" /> : <EyeOffIcon className="w-5 h-5 sm:w-7 sm:h-7" />}
            </button>
          </div>
        </div>

        {/* Inline Auth Error */}
        {authError && (
          <div
            className="w-full px-2 -mt-1 sm:-mt-0.5"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            <p className="text-red-400 text-xs sm:text-sm font-medium">
              {authError}
            </p>
          </div>
        )}

        {/* Forgot Password Link */}
        <div className="w-full flex justify-end -mt-1 sm:-mt-0.5">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs sm:text-sm text-white/80 hover:text-white transition-colors font-medium"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Forgot Password?
          </button>
        </div>

        {/* Sign-in Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full mt-0.5 sm:mt-1.5 h-[48px] sm:h-[62px] rounded-full font-bold text-lg sm:text-2xl transition-all duration-200 shadow-lg ${
            isSubmitting
              ? 'bg-white/70 text-black/50 cursor-not-allowed'
              : 'bg-white text-black hover:bg-neutral-100 active:scale-[0.99]'
          }`}
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
              </svg>
              Signing in...
            </span>
          ) : (
            'Sign-in'
          )}
        </button>

        {/* Line Divider with "Or" */}
        <div className="w-full flex items-center my-1 sm:my-3">
          <div className="flex-1 h-[2px] bg-white" />
          <span
            className="px-3 sm:px-5 text-white text-lg sm:text-3xl tracking-wider font-extrabold"
            style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800 }}
          >
            Or
          </span>
          <div className="flex-1 h-[2px] bg-white" />
        </div>

        {/* Continue with Google Button */}
        <button
          type="button"
          className="w-full h-[48px] sm:h-[62px] bg-white text-black rounded-full font-bold text-sm sm:text-lg flex items-center justify-center gap-2.5 sm:gap-3.5 hover:bg-neutral-100 active:scale-[0.99] transition-all duration-200 shadow-lg"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
        >
          <GoogleIcon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
          <span>Continue with Google</span>
        </button>

        {/* Switch to Sign-up */}
        <div className="w-full text-center mt-1.5 sm:mt-3">
          <span
            className="text-xs sm:text-sm text-neutral-400 font-normal"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Don’t have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToSignUp}
              className="text-white underline font-bold hover:text-white/80 transition-colors"
            >
              Create one
            </button>
          </span>
        </div>
      </form>
    </div>
  );
}

export interface SignInProps {
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
  onForgotPassword?: () => void;
}

export default function SignIn({
  onSuccess,
  onSwitchToSignUp,
  onForgotPassword,
}: SignInProps = {}) {
  return (
    <div
      className={`w-full text-white ${poppins.variable} ${futuraDisplay.variable}`}
      style={{ fontFamily: 'var(--font-poppins)' }}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-8 md:gap-12 lg:gap-16">
        {/* Left column: Denise illustration + Futura copy (row on mobile, column on desktop) */}
        <div className="flex flex-row md:flex-col items-center justify-center gap-3 sm:gap-6 md:gap-0 shrink-0 w-full md:w-[46%] max-w-[420px] md:max-w-[370px]">
          <div className="relative w-[160px] h-[185px] sm:w-[185px] sm:h-[210px] md:w-[300px] md:h-[350px] lg:w-[320px] lg:h-[370px] shrink-0">
            <Image
              src="/assets/images/denise_auth.png"
              alt="Denise HR thumbs up"
              fill
              priority
              className="object-contain"
            />
          </div>
          <div className="mt-0 md:mt-5 text-left md:text-center flex-1 md:flex-initial">
            <p
              className="text-white text-[21px] sm:text-2xl md:text-3xl lg:text-[32px] leading-[1.12] sm:leading-[1.1] md:leading-[1.08] tracking-wide text-left md:text-center"
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
          <SignInForm
            onSuccess={onSuccess}
            onSwitchToSignUp={onSwitchToSignUp}
            onForgotPassword={onForgotPassword}
          />
        </div>
      </div>
    </div>
  );
}
