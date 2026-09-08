'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Poppins } from 'next/font/google';
import Image from 'next/image';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

export default function JobMatchAnimation() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || hasAnimated) return;

    const q = gsap.utils.selector(root);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      gsap.set(q('[data-paper]'), { autoAlpha: 1 });
      gsap.set(q('[data-line]'), { autoAlpha: 1 });
      setHasAnimated(true);
      return;
    }

    const paper = q('[data-paper]')[0];
    const camera = q('[data-camera]')[0];
    const elements = q('[data-line]');
    const videoContainer = q('[data-video-container]')[0];
    const videoThinkingText = q('[data-thinking-text]')[0];
    const qualContainer = q('[data-qual-container]')[0];
    const qualItems = q('[data-qual]');
    const checkmarkContainer = q('[data-checkmark]')[0];
    const ratingContainer = q('[data-rating]')[0];
    const progressCircle = q('[data-progress-circle]')[0];
    const progressText = q('[data-progress-text]')[0];
    const whiteTransition = q('[data-white-transition]')[0];
    const notificationContainer = q('[data-notification]')[0];

    const tl = gsap.timeline({ 
      onComplete: () => {
        setHasAnimated(true);
        gsap.set(paper, { autoAlpha: 1 });
        gsap.set(elements, { autoAlpha: 1, y: 0 });
        gsap.set(camera, { y: 0 });
        gsap.set([videoContainer, qualContainer, checkmarkContainer, ratingContainer, whiteTransition, notificationContainer], { autoAlpha: 0 });
      }
    });

    // Initial state
    gsap.set(paper, { autoAlpha: 0, y: 60, rotateX: 6 });
    gsap.set(elements, { autoAlpha: 0, y: 10 });
    gsap.set(videoContainer, { autoAlpha: 0 });
    gsap.set(qualContainer, { autoAlpha: 0 });
    gsap.set(checkmarkContainer, { autoAlpha: 0, scale: 0 });
    gsap.set(ratingContainer, { autoAlpha: 0 });
    gsap.set(whiteTransition, { autoAlpha: 0 });
    gsap.set(notificationContainer, { autoAlpha: 0 });

    // 1. Paper drops in (faster)
    tl.fromTo(
      paper,
      { autoAlpha: 0, y: 60, rotateX: 6 },
      { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.5, ease: 'power3.out' }
    );

    // 2. Write elements faster
    tl.to(
      elements,
      { autoAlpha: 1, y: 0, duration: 0.2, stagger: 0.04, ease: 'power2.out' },
      '+=0.1'
    );

    // Beat - shorter
    tl.to({}, { duration: 0.3 });

    // 3. Continuous scroll - 2x faster (one smooth scroll from top to bottom)
    const qualifications = q('[data-section="qualifications"]')[0];
    const qualY = (qualifications as HTMLElement).offsetTop;
    tl.to(camera, { y: -qualY + 20, duration: 1.5, ease: 'power1.inOut' });
    tl.to({}, { duration: 0.25 });

    // 4. Fade to white
    tl.to(paper, { autoAlpha: 0, duration: 0.8, ease: 'power2.inOut' });

    // 5. Denise thinking - original 5 second duration
    tl.set(videoContainer, { autoAlpha: 1 });
    tl.call(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
    });
    tl.fromTo(
      videoThinkingText,
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    );
    
    // Wait for full 5-second video
    tl.to({}, { duration: 5 });

    // Pop out video
    tl.to(videoContainer, { autoAlpha: 0, scale: 0.85, duration: 0.4, ease: 'power2.in' });

    // 6. Qualifications scroll - 2x speed
    tl.set(qualContainer, { autoAlpha: 1 });
    tl.fromTo(
      qualItems,
      { y: '100vh', autoAlpha: 0 },
      { y: '-100vh', autoAlpha: 1, duration: 2, stagger: 0.125, ease: 'none' }
    );

    // 7. Big green checkmark - inflate-deflate animation (.5x speed)
    tl.set(qualContainer, { autoAlpha: 0 });
    tl.set(checkmarkContainer, { autoAlpha: 1 });
    tl.fromTo(
      checkmarkContainer,
      { scale: 0 },
      { scale: 1.2, duration: 0.5, ease: 'power2.out' }
    );
    tl.to(checkmarkContainer, { scale: 1, duration: 0.3, ease: 'power2.inOut' });
    tl.to({}, { duration: 0.5 });

    // 8. Transition to rating with circular progress (.5x speed)
    tl.to(checkmarkContainer, { autoAlpha: 0, scale: 0.8, duration: 0.2 });
    tl.set(ratingContainer, { autoAlpha: 1 });
    
    // Animate circular progress from 0 to 85% - slower
    tl.fromTo(
      progressCircle,
      { strokeDashoffset: 753.98 }, // Full circle (2 * PI * 120)
      { strokeDashoffset: 113.1, duration: 3, ease: 'power2.out' } // 85% of circle
    );
    
    // Count up the percentage text
    tl.to(
      progressText,
      {
        textContent: '85',
        duration: 3,
        ease: 'power2.out',
        snap: { textContent: 1 },
        onUpdate: function() {
          if (progressText) {
            progressText.textContent = Math.round(parseFloat(progressText.textContent || '0')).toString();
          }
        }
      },
      '<' // Start at same time as circle
    );
    
    tl.to({}, { duration: 0.75 });

    // 9. Fade rating to white (2x faster)
    tl.to(ratingContainer, { autoAlpha: 0, duration: 0.45, ease: 'power2.inOut' });
    tl.set(whiteTransition, { autoAlpha: 1 });
    tl.to({}, { duration: 0.225 });

    // 10. Notification pops up on white background (2x faster)
    tl.fromTo(
      notificationContainer,
      { autoAlpha: 0, y: 20, scale: 0.9 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.7)' }
    );
    tl.to({}, { duration: 1.875 });

    tl.play();

    return () => {
      tl.kill();
    };
  }, [hasAnimated]);

  return (
    <div
      ref={rootRef}
      className={`relative h-full w-full overflow-hidden bg-white ${poppins.variable}`}
      aria-hidden="true"
    >
      {/* Paper - Job Listing - Professional Format */}
      <div data-paper className="absolute inset-0 overflow-hidden bg-white">
        <div data-camera className="relative h-full w-full">
          <div className="flex h-full flex-col px-6 py-5 text-black" style={{ fontFamily: 'var(--font-poppins)' }}>
            
            {/* Job Title */}
            <h1 data-line className="text-3xl font-bold mb-2 text-black">
              Web Developer Intern
            </h1>
            
            {/* Company Info with underline */}
            <div data-line className="flex items-center gap-3 mb-1">
              <a href="#" className="text-base font-semibold text-blue-600 underline hover:text-blue-700">
                Creating Info
              </a>
              <span className="text-sm text-black/60">4.7 ★</span>
            </div>
            
            {/* Location with icon */}
            <div data-line className="flex items-center gap-2 text-sm text-black/70 mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>Ortigas Post Office 1605 P00</span>
            </div>

            {/* Action Buttons Row */}
            <div data-line className="flex gap-3 mb-6">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Apply on company site
              </button>
              <button className="border border-black/20 hover:bg-black/5 text-black px-4 py-2.5 rounded-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
            </div>

            {/* Job Details Section */}
            <div data-section="details" className="mb-5 pb-5 border-b border-black/10">
              <h2 data-line className="text-xl font-bold mb-4 text-black">Job details</h2>
              
              <div data-line className="mb-4">
                <div className="flex items-start gap-3 mb-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                  <div>
                    <p className="font-semibold text-sm text-black">Job type</p>
                    <p className="text-sm text-black/70 mt-1">On-the-job training (OJT)</p>
                  </div>
                </div>
              </div>

              <div data-line className="mb-4">
                <div className="flex items-start gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <div>
                    <p className="font-semibold text-sm text-black">Duration</p>
                    <p className="text-sm text-black/70 mt-1">3-6 months</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Full Job Description - Responsibilities */}
            <div data-section="responsibilities" className="mb-5 pb-5 border-b border-black/10">
              <h2 data-line className="text-xl font-bold mb-3 text-black">Full job description</h2>
              <h3 data-line className="text-base font-bold mb-3 text-black/90">Requirements and Responsibilities</h3>
              <ul className="space-y-2.5">
                <li data-line className="flex gap-3 text-sm text-black/80">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Majoring in a <strong>related field</strong> (Computer Science, Engineering, or similar)</span>
                </li>
                <li data-line className="flex gap-3 text-sm text-black/80">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Experience in <strong>web development</strong></span>
                </li>
                <li data-line className="flex gap-3 text-sm text-black/80">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Has good <em>communication skills</em> and self-discipline to finish work in a timely manner</span>
                </li>
                <li data-line className="flex gap-3 text-sm text-black/80">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Excellent <strong>teamwork skills</strong> and ability to assist other team members in problem-solving</span>
                </li>
                <li data-line className="flex gap-3 text-sm text-black/80">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Assist in web application development, testing, and launching of websites and applications</span>
                </li>
                <li data-line className="flex gap-3 text-sm text-black/80">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Willing to undergo <em>several weeks of training</em></span>
                </li>
                <li data-line className="flex gap-3 text-sm text-black/80">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Work alongside other developers in a <strong>collaborative environment</strong></span>
                </li>
              </ul>
            </div>

            {/* Qualifications */}
            <div data-section="qualifications" className="mb-4">
              <h3 data-line className="text-base font-bold mb-3 text-black/90">Required Qualifications</h3>
              <div className="grid grid-cols-2 gap-2">
                <div data-line className="flex items-center gap-2 text-sm text-black/80 bg-black/5 px-3 py-2 rounded-lg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span><strong>JavaScript</strong> experience</span>
                </div>
                <div data-line className="flex items-center gap-2 text-sm text-black/80 bg-black/5 px-3 py-2 rounded-lg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span><strong>PHP</strong> experience</span>
                </div>
                <div data-line className="flex items-center gap-2 text-sm text-black/80 bg-black/5 px-3 py-2 rounded-lg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span><strong>MySQL</strong> experience</span>
                </div>
                <div data-line className="flex items-center gap-2 text-sm text-black/80 bg-black/5 px-3 py-2 rounded-lg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span><strong>React</strong> experience</span>
                </div>
                <div data-line className="flex items-center gap-2 text-sm text-black/80 bg-black/5 px-3 py-2 rounded-lg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span><strong>Node.js</strong> experience</span>
                </div>
                <div data-line className="flex items-center gap-2 text-sm text-black/80 bg-black/5 px-3 py-2 rounded-lg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span><strong>Git</strong> / Version Control</span>
                </div>
              </div>
            </div>

            {/* Report Job Button */}
            <div data-line className="mt-6 pt-4 border-t border-black/10">
              <button className="flex items-center gap-2 text-sm text-black/60 hover:text-black/80 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                  <line x1="4" y1="22" x2="4" y2="15"/>
                </svg>
                <span>Report job</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Denise Thinking - Full container with dark overlay for text visibility */}
      <div data-video-container className="absolute inset-0 bg-white">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
        >
          <source src="/assets/videos/denise_thinking.mp4" type="video/mp4" />
        </video>
        
        {/* Black opaque overlay to dim video */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Text overlay with shimmer - now more visible */}
        <div className="absolute inset-0 flex items-center justify-center">
          <p
            data-thinking-text
            className="text-3xl font-bold shimmer-text z-10 px-6 text-center"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Checking your qualifications...
          </p>
        </div>
      </div>

      {/* Qualifications Scroll */}
      <div data-qual-container className="absolute inset-0 bg-white flex flex-col items-center justify-start pt-20 gap-4 overflow-hidden">
        {[
          'Must have at least 3-5 years of experience with React',
          'Proficient in JavaScript ES6+ and modern web development',
          'Strong experience with PHP and MySQL databases',
          'Familiarity with Node.js and server-side development',
          'Experience with Git version control and team collaboration',
          'Excellent problem-solving and communication skills'
        ].map((qual, idx) => (
          <div key={idx} data-qual className="flex items-center gap-3 text-black bg-black/5 px-6 py-4 rounded-2xl" style={{ minWidth: '320px', maxWidth: '400px' }}>
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-left" style={{ fontFamily: 'var(--font-poppins)' }}>{qual}</span>
          </div>
        ))}
      </div>

      {/* Big Green Checkmark - Just the checkmark, no background */}
      <div data-checkmark className="absolute inset-0 bg-white flex items-center justify-center">
        <div className="w-64 h-64 rounded-full bg-green-500 flex items-center justify-center shadow-2xl">
          <svg width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>

      {/* Final Rating - Circular Progress */}
      <div data-rating className="absolute inset-0 bg-green-500 flex items-center justify-center">
        <div className="relative">
          {/* Background circle */}
          <svg width="280" height="280" className="transform -rotate-90">
            <circle
              cx="140"
              cy="140"
              r="120"
              stroke="#ffffff"
              strokeWidth="20"
              fill="none"
              opacity="0.3"
            />
            {/* Progress circle */}
            <circle
              data-progress-circle
              cx="140"
              cy="140"
              r="120"
              stroke="#ffffff"
              strokeWidth="20"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="753.98"
              strokeDashoffset="753.98"
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-6xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
              <span data-progress-text>0</span>%
            </div>
            <p className="text-2xl font-semibold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>Match</p>
          </div>
        </div>
      </div>

      {/* White Transition Screen */}
      <div data-white-transition className="absolute inset-0 bg-white" />

      {/* Notification - pops up on white background */}
      <div data-notification className="absolute inset-0 bg-white flex flex-col items-center justify-center">
        <div className="mb-6">
          <Image src="/assets/icons/mail_icon.png" alt="Mail" width={120} height={120} className="drop-shadow-2xl" />
        </div>
        
        <div className="bg-green-500 rounded-3xl px-8 py-6 shadow-2xl max-w-sm text-center">
          <p className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>
            Congratulations, you got a job offer! 🎉
          </p>
        </div>
      </div>

      <style jsx>{`
        .shimmer-text {
          background: linear-gradient(90deg, #000 0%, #666 25%, #fff 50%, #666 75%, #000 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 2s linear infinite;
        }
        
        @keyframes shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}
