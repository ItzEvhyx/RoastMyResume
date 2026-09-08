'use client';

import { useState, useRef, useEffect } from 'react';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export interface PrivacyPolicyProps {
  onBack: () => void;
  accepted?: boolean;
  onAcceptChange?: (accepted: boolean) => void;
}

export default function PrivacyPolicy({
  onBack,
  accepted = false,
  onAcceptChange,
}: PrivacyPolicyProps) {
  const [isChecked, setIsChecked] = useState(accepted);
  const [atBottom, setAtBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isCloseToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    if (isCloseToBottom) {
      setAtBottom(true);
    }
  };

  useEffect(() => {
    handleScroll();
  }, []);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setIsChecked(checked);
    if (onAcceptChange) {
      onAcceptChange(checked);
    }
  };

  return (
    <div
      className={`relative flex flex-col h-[520px] sm:h-[550px] w-full max-w-[440px] sm:max-w-[470px] text-white ${poppins.variable}`}
      style={{ fontFamily: 'var(--font-poppins)' }}
    >
      {/* Header */}
      <div className="pb-3 mb-2 border-b border-white/20">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Privacy Policy
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-normal">
          Last updated: <span className="text-neutral-200">September 8, 2026</span>
        </p>
      </div>

      {/* Scrollable Document Body */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pr-3 space-y-5 text-xs sm:text-[13px] leading-relaxed text-neutral-300 custom-scrollbar"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#555 transparent' }}
      >
        <p className="italic text-neutral-400">
          RoastMyResume (<strong className="text-white font-semibold">&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;</strong>) respects your privacy. This Privacy Policy explains what data we collect, how we use it, and the choices you have. By using RoastMyResume, you agree to the practices described here.
        </p>

        {/* Section 1 */}
        <div className="space-y-1.5">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            1. Information We Collect
          </h3>
          <ul className="space-y-2">
            <li>
              <strong className="text-white font-semibold block">Account information</strong>
              When you sign up, we collect your email address and, if you use Google sign-in, basic profile info (name, email, profile photo) from your Google account. If you sign up with email/password, we store your email and a securely hashed version of your password — we never store your password in plain text.
            </li>
            <li>
              <strong className="text-white font-semibold block">Resume and content data</strong>
              When you build or upload a resume, we store the content you create or upload, including text, section data, and any photos you add (e.g., a headshot). If you paste a job posting for Job Match scoring, we process that text as well.
            </li>
            <li>
              <strong className="text-white font-semibold block">AI feedback data</strong>
              When you request feedback (roast, straight critique, ATS check, or job-match scoring), we send the relevant resume content to our AI provider to generate a response, and we store the resulting feedback in your account so you can revisit it.
            </li>
            <li>
              <strong className="text-white font-semibold block">Voice data</strong>
              If you use voice features (roast read-aloud, or voice input), audio is processed by our text-to-speech and speech-to-text providers to generate or transcribe audio. <em className="text-neutral-200">We do not use your voice data to train AI models.</em>
            </li>
            <li>
              <strong className="text-white font-semibold block">Usage data</strong>
              We automatically collect technical data when you use the Service — like IP address, browser type, device info, and usage patterns — to keep the Service secure, prevent abuse, and enforce rate limits fairly.
            </li>
            <li>
              <strong className="text-white font-semibold block">Cookies</strong>
              We use cookies or similar technologies to keep you logged in and remember your preferences. You can control cookies through your browser settings.
            </li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="space-y-1.5">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            2. How We Use Your Information
          </h3>
          <p>We use your information to:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Create and manage your account</li>
            <li>Generate AI feedback, job-match scores, and ATS checks on your resume</li>
            <li>Save your resume drafts and feedback history so you can return to them</li>
            <li>Enforce usage limits and prevent abuse</li>
            <li>Improve and troubleshoot the Service</li>
            <li>Communicate with you about your account or updates</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p className="font-semibold text-white pt-1">
            We do not sell your personal information or your resume content to third parties.
          </p>
        </div>

        {/* Section 3 */}
        <div className="space-y-2">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            3. Who We Share Data With
          </h3>
          <p>
            We share limited data with the following categories of third-party service providers, solely to operate the Service:
          </p>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-white/20 bg-neutral-900/60 p-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/20 text-white font-semibold">
                  <th className="py-2 px-2.5">Provider</th>
                  <th className="py-2 px-2.5">Shared Data</th>
                  <th className="py-2 px-2.5">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-neutral-300">
                <tr>
                  <td className="py-2 px-2.5 font-medium text-white">Anthropic (AI)</td>
                  <td className="py-2 px-2.5">Resume / job posting text</td>
                  <td className="py-2 px-2.5">Generates critique & scores</td>
                </tr>
                <tr>
                  <td className="py-2 px-2.5 font-medium text-white">Cartesia (TTS)</td>
                  <td className="py-2 px-2.5">Feedback text</td>
                  <td className="py-2 px-2.5">Voice roast audio</td>
                </tr>
                <tr>
                  <td className="py-2 px-2.5 font-medium text-white">Deepgram (STT)</td>
                  <td className="py-2 px-2.5">Submitted audio</td>
                  <td className="py-2 px-2.5">Transcribes speech to text</td>
                </tr>
                <tr>
                  <td className="py-2 px-2.5 font-medium text-white">Firebase</td>
                  <td className="py-2 px-2.5">Account & resume files</td>
                  <td className="py-2 px-2.5">Cloud hosting & database</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="italic text-neutral-400 pt-1">
            These providers are contractually restricted to using your data only to deliver the service we&rsquo;ve asked them to provide, and are not permitted to train their models on your data.
          </p>
        </div>

        {/* Section 4 */}
        <div className="space-y-1.5">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            4. Data Retention
          </h3>
          <p>
            We retain your account and resume data for as long as your account is active. If you delete your account, we&rsquo;ll delete your personal data and resume content within <strong className="text-white font-semibold">30 days</strong>, except where required for legal or fraud prevention purposes.
          </p>
        </div>

        {/* Section 5 */}
        <div className="space-y-1.5">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            5. Your Rights and Choices
          </h3>
          <p>Depending on where you live, you may have rights to:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and associated data</li>
            <li>Export your resume data</li>
            <li>Object to or restrict certain processing</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:subayhvhan@gmail.com" className="text-white underline font-semibold">
              subayhvhan@gmail.com
            </a>.
          </p>
        </div>

        {/* Section 6 */}
        <div className="space-y-1.5">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            6. Data Security
          </h3>
          <p>
            We use industry-standard safeguards (encryption in transit, secure authentication, access controls) to protect your data. No system is 100% secure, but we take reasonable steps to safeguard your information.
          </p>
        </div>

        {/* Section 7 */}
        <div className="space-y-1.5">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            7. Children&rsquo;s Privacy
          </h3>
          <p>
            RoastMyResume is not intended for children under 13, and we don&rsquo;t knowingly collect data from children under 13.
          </p>
        </div>

        {/* Section 8 */}
        <div className="space-y-1.5">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            8. International Users
          </h3>
          <p>
            If you access the Service from outside the country where our servers are located, your data may be transferred internationally. By using the Service, you consent to this transfer.
          </p>
        </div>

        {/* Section 9 */}
        <div className="space-y-1.5">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            9. Changes to This Policy
          </h3>
          <p>
            We may update this Privacy Policy from time to time. If we make material changes, we&rsquo;ll notify you via email or an in-app notice before they take effect.
          </p>
        </div>

        {/* Section 10 */}
        <div className="space-y-1.5 pb-2">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            10. Contact Us
          </h3>
          <p>
            Questions about this Privacy Policy or how we handle your data? Reach out at{' '}
            <a
              href="mailto:subayhvhan@gmail.com"
              className="text-white underline font-semibold hover:text-white/80"
            >
              subayhvhan@gmail.com
            </a>.
          </p>
        </div>

        {/* Bottom Acknowledgement Checkbox Area */}
        <div className="pt-4 pb-2 border-t border-white/20">
          <label className="flex items-start gap-3 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => handleCheckboxChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-white/40 bg-neutral-900 text-white accent-white focus:ring-white/40 cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-white font-medium group-hover:text-white/90">
              I have read and agree to the <strong className="font-bold underline">Privacy Policy</strong>
            </span>
          </label>
        </div>
      </div>

      {/* Floating "Scroll to bottom" hint if not scrolled to bottom */}
      {!atBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-semibold shadow-lg border border-white/20 transition-all active:scale-95 animate-pulse"
        >
          <span>Scroll to bottom</span>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Bottom Back Button */}
      <div className="pt-3 border-t border-white/15 flex justify-end">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto px-8 h-[48px] sm:h-[52px] bg-white text-black font-bold rounded-full text-sm sm:text-base hover:bg-neutral-200 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Back to Sign-up</span>
        </button>
      </div>
    </div>
  );
}
