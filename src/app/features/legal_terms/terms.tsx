'use client';

import { useState, useRef, useEffect } from 'react';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export interface TermsProps {
  onBack: () => void;
  accepted?: boolean;
  onAcceptChange?: (accepted: boolean) => void;
}

export default function Terms({
  onBack,
  accepted = false,
  onAcceptChange,
}: TermsProps) {
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
          Terms of Service
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
          Welcome to RoastMyResume (<strong className="text-white font-semibold">&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our,&rdquo;</strong> or the <strong className="text-white font-semibold">&ldquo;Service&rdquo;</strong>). These Terms of Service (<strong className="text-white font-semibold">&ldquo;Terms&rdquo;</strong>) govern your access to and use of RoastMyResume, including our resume builder, AI feedback tools, and related features. By creating an account or using the Service, you agree to these Terms. If you don&rsquo;t agree, please don&rsquo;t use the Service.
        </p>

        {/* Section 1 */}
        <div className="space-y-1.5">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            1. Who Can Use RoastMyResume
          </h3>
          <p>
            You must be at least <span className="font-semibold text-white">13 years old</span> to use the Service. If you&rsquo;re under 18, you confirm you have permission from a parent or guardian. By using the Service, you confirm the information you provide is accurate and that you have the right to upload any content (resumes, photos, job postings) you submit.
          </p>
        </div>

        {/* Section 2 */}
        <div className="space-y-1.5">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            2. Your Account
          </h3>
          <ul className="list-disc pl-4 space-y-1 text-neutral-300">
            <li>You need an account to access AI-powered features (<em className="text-neutral-200">Ask Denise, Job Match, ATS Check, and voice roasts</em>). You can build a resume on the canvas without an account, but AI feedback requires signing up.</li>
            <li>You can create an account with an email and password, or by continuing with Google. You&rsquo;re responsible for keeping your login credentials secure and for all activity under your account.</li>
            <li>You agree not to create multiple accounts to bypass usage limits or restrictions we&rsquo;ve put in place.</li>
            <li>We may suspend or terminate accounts that violate these Terms, abuse the Service, or attempt to circumvent rate limits or paywalls.</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="space-y-1.5">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            3. What You Can Do With RoastMyResume
          </h3>
          <p>
            You can use RoastMyResume to build, edit, and export resumes, and to receive AI-generated feedback on your resume content, including tone-adjustable critique (<em className="text-neutral-200">&ldquo;roast&rdquo; or &ldquo;straight&rdquo; mode</em>), job-match scoring against a job posting you provide, and ATS-readability checks.
          </p>
        </div>

        {/* Section 4 */}
        <div className="space-y-1.5">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            4. Your Content
          </h3>
          <p>
            <strong className="text-white font-semibold">You own what you upload.</strong> Any resume text, photos, job postings, or other content you upload or create (&ldquo;Your Content&rdquo;) remains yours. By using the Service, you grant us a limited license to store, process, and display Your Content solely to provide the Service to you — including sending it to third-party AI providers (see Section 6) for generating feedback.
          </p>
          <p className="font-semibold text-neutral-200 pt-1">
            You&rsquo;re responsible for Your Content. Don&rsquo;t upload:
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Content you don&rsquo;t have the rights to (e.g., someone else&rsquo;s resume without permission)</li>
            <li>False, misleading, or fraudulent information intended to deceive an employer</li>
            <li>Content that&rsquo;s unlawful, abusive, or infringes on another person&rsquo;s rights</li>
            <li>Malicious files or content intended to disrupt the Service</li>
          </ul>
          <p className="italic text-neutral-400">
            We reserve the right to remove content that violates these Terms.
          </p>
        </div>

        {/* Section 5 */}
        <div className="space-y-1.5">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            5. AI-Generated Feedback
          </h3>
          <p>
            RoastMyResume uses artificial intelligence to generate feedback, scores, and suggestions about your resume. Please understand:
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong className="text-white font-semibold">AI feedback is not professional career, legal, or hiring advice.</strong> It&rsquo;s a tool to help you think about your resume — not a guarantee of interview or job success.</li>
            <li>Feedback, including &ldquo;roast mode&rdquo; content, is generated automatically and may occasionally be inaccurate, incomplete, or miss context about your specific situation. Use your own judgment before making changes.</li>
            <li>Job-match scores are estimates based on text analysis and don&rsquo;t guarantee how any specific applicant tracking system or recruiter will evaluate your resume.</li>
            <li>We are not responsible for employment outcomes resulting from your use of the Service.</li>
          </ul>
        </div>

        {/* Section 6 */}
        <div className="space-y-1.5">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            6. Third-Party Services
          </h3>
          <p>
            To provide the Service, we share limited data with third-party providers, including:
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>AI processing (resume text and feedback generation)</li>
            <li>Text-to-speech (for voice roast features, if you use them)</li>
            <li>Speech-to-text (if you use voice input features)</li>
            <li>Cloud hosting and storage for your account and resume data</li>
          </ul>
          <p>
            These providers process data solely to deliver the relevant feature and are bound by their own terms and privacy practices.
          </p>
        </div>

        {/* Section 7 */}
        <div className="space-y-1.5">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            7. Subscription, Free Use, and Rate Limits
          </h3>
          <ul className="list-disc pl-4 space-y-1">
            <li>Core resume-building tools are free to use without an account.</li>
            <li>AI features require an account and may be subject to usage limits. We may change these limits at any time.</li>
            <li>If we offer paid plans, additional terms will be presented at the time of purchase and are incorporated into these Terms.</li>
            <li>We may throttle, limit, or restrict access to prevent abuse of the Service.</li>
          </ul>
        </div>

        {/* Section 8 */}
        <div className="space-y-1.5">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            8. Acceptable Use
          </h3>
          <p className="font-semibold text-neutral-200">You agree not to:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Use automated tools (bots, scrapers) to access the Service outside of normal use</li>
            <li>Attempt to reverse-engineer, extract, or replicate our AI prompts, models, or scoring logic</li>
            <li>Circumvent rate limits, account restrictions, or paywalls</li>
            <li>Use the Service to harass, defame, or impersonate others</li>
            <li>Upload malware or attempt to compromise the security of the Service</li>
          </ul>
        </div>

        {/* Section 9 */}
        <div className="space-y-1.5">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            9. Intellectual Property
          </h3>
          <p>
            The RoastMyResume name, branding, templates, design system, and underlying software are our intellectual property (or licensed to us) and are protected by applicable law. These Terms don&rsquo;t grant you rights to our branding or code beyond what&rsquo;s needed to use the Service normally.
          </p>
        </div>

        {/* Section 10 */}
        <div className="space-y-1.5">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            10. Disclaimers
          </h3>
          <p className="italic text-neutral-300">
            The Service is provided &ldquo;as is&rdquo; without warranties of any kind, express or implied. We don&rsquo;t guarantee the Service will be uninterrupted, error-free, or that AI feedback will be accurate or suitable for your specific circumstances. You use AI-generated feedback at your own discretion.
          </p>
        </div>

        {/* Section 11 */}
        <div className="space-y-1.5">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            11. Limitation of Liability
          </h3>
          <p>
            To the maximum extent permitted by law, RoastMyResume and its team are not liable for indirect, incidental, or consequential damages arising from your use of the Service, including any employment outcomes, lost opportunities, or data loss. Our total liability for any claim relating to the Service is limited to the amount you paid us (if any) in the 12 months before the claim arose.
          </p>
        </div>

        {/* Section 12 */}
        <div className="space-y-1.5">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            12. Termination
          </h3>
          <p>
            You can delete your account at any time. We may suspend or terminate your access if you violate these Terms. Upon termination, your right to use the Service ends, though certain provisions survive.
          </p>
        </div>

        {/* Section 13 */}
        <div className="space-y-1.5">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            13. Changes to These Terms
          </h3>
          <p>
            We may update these Terms from time to time. If we make material changes, we&rsquo;ll notify you (e.g., via email or an in-app notice) before they take effect. Continued use of the Service after changes take effect means you accept the updated Terms.
          </p>
        </div>

        {/* Section 14 */}
        <div className="space-y-1.5 pb-2">
          <h3 className="text-white font-bold text-sm sm:text-[15px]">
            14. Contact Us
          </h3>
          <p>
            Questions about these Terms? Reach out at{' '}
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
              I have read and agree to the <strong className="font-bold underline">Terms of Service</strong>
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
