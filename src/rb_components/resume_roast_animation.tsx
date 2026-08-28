'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * A self-contained "motion graphics" animation for the About section.
 *
 * Sequence (loops forever):
 *   1. Transparent stage — a blank ATS resume sheet drops in.
 *   2. The ENTIRE resume writes itself top-to-bottom, filling the sheet.
 *   3. Once complete, the "camera" zooms into each weak / vague line in turn:
 *      it circles the line in red and pops a critique comment beside it,
 *      clears, then moves on to the next weak line.
 *   4. Zoom back out, hold, reset, loop.
 *
 * The timeline only starts once the About section scrolls into view (from
 * either direction) and pauses when it leaves.
 */
export default function ResumeRoastAnimation({
  className = '',
}: {
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const q = gsap.utils.selector(root);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const paper = q('[data-paper]');
    const camera = q('[data-camera]')[0] as HTMLElement;
    const lines = q('[data-line]');
    const flaws = Array.from(root.querySelectorAll<HTMLElement>('[data-flaw]'));

    // Single comment overlay, lives outside the paper so it floats on top,
    // unscaled and unclipped.
    const comment = root.querySelector<HTMLElement>('[data-comment]');
    const commentText = root.querySelector<HTMLElement>('[data-comment-text]');

    if (reduce) {
      gsap.set(paper, { autoAlpha: 1, y: 0 });
      gsap.set(lines, { autoAlpha: 1, y: 0 });
      flaws.forEach((f) => {
        gsap.set(f.querySelector('[data-circle]'), { strokeDashoffset: 0, autoAlpha: 1 });
      });
      if (commentText && flaws[0]) commentText.textContent = flaws[0].dataset.critique ?? '';
      gsap.set(comment, { autoAlpha: 1 });
      return;
    }

    // Center of an element as a % of the camera box (for zoom origin).
    const originOf = (el: HTMLElement) => {
      const cam = camera.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const px = ((r.left + r.width / 2 - cam.left) / cam.width) * 100;
      const py = ((r.top + r.height / 2 - cam.top) / cam.height) * 100;
      return `${px}% ${py}%`;
    };

    // Place the (unscaled) comment overlay centered just below the circled
    // line, measured live AFTER the zoom so it tracks the on-screen position.
    const placeCommentUnder = (flaw: HTMLElement) => {
      if (!comment) return;
      const rootRect = root.getBoundingClientRect();
      const r = flaw.getBoundingClientRect();
      const cx = r.left + r.width / 2 - rootRect.left;
      const below = r.bottom - rootRect.top + 12;
      // Clamp so the box stays fully inside the stage.
      const w = comment.offsetWidth || 420;
      const half = w / 2;
      const left = Math.min(
        Math.max(cx, half + 8),
        rootRect.width - half - 8
      );
      const top = Math.min(below, rootRect.height - (comment.offsetHeight || 60) - 8);
      gsap.set(comment, { left, top, xPercent: -50, x: 0 });
    };

    let tl: gsap.core.Timeline | null = null;

    const build = () => {
      gsap.set(camera, { scale: 1, transformOrigin: '50% 50%' });
      gsap.set(paper, { autoAlpha: 0, y: 60, rotateX: 6, transformOrigin: '50% 0%' });
      gsap.set(lines, { autoAlpha: 0, y: 8 });
      gsap.set(comment, { autoAlpha: 0, y: 8, scale: 0.96 });
      flaws.forEach((f) => {
        const c = f.querySelector<SVGPathElement>('[data-circle]');
        const len = c?.getTotalLength?.() ?? 400;
        gsap.set(c, { strokeDasharray: len, strokeDashoffset: len, autoAlpha: 1 });
      });

      const t = gsap.timeline({ repeat: -1, repeatDelay: 0.5, paused: true });

      // 1. Paper pops up into view (fromTo so it restarts cleanly each loop)
      t.fromTo(
        paper,
        { autoAlpha: 0, y: 60, rotateX: 6 },
        { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.6, ease: 'power3.out' }
      );

      // 2. The ENTIRE resume writes itself, top to bottom
      t.to(
        lines,
        { autoAlpha: 1, y: 0, duration: 0.18, stagger: 0.055, ease: 'power2.out' },
        '+=0.1'
      );

      // Beat so the viewer sees the whole finished resume
      t.to({}, { duration: 0.7 });

      // 3. Roast each flaw in turn: zoom in -> circle -> comment -> clear.
      // The comment is a single overlay that floats above the paper (never
      // scaled/clipped); we just retarget its text + position per flaw.
      flaws.forEach((flaw) => {
        const circle = flaw.querySelector('[data-circle]');

        t.set(camera, { transformOrigin: originOf(flaw) });
        t.to(camera, { scale: 2.3, duration: 0.7, ease: 'power2.inOut' });
        t.to(circle, { strokeDashoffset: 0, duration: 0.5, ease: 'power1.inOut' }, '-=0.1');

        // Fill the text, position under the zoomed circle, then pop it in.
        t.call(() => {
          if (commentText) commentText.textContent = flaw.dataset.critique ?? '';
          placeCommentUnder(flaw);
        });
        t.fromTo(
          comment,
          { autoAlpha: 0, y: 8, scale: 0.96 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.7)' }
        );
        // Hold the correction on screen (3s longer than before) so it's
        // readable before moving to the next flaw.
        t.to({}, { duration: 4.2 });
        t.to([comment, circle], { autoAlpha: 0, duration: 0.3, ease: 'power1.in' });
      });

      // 4. Zoom back out, brief hold
      t.to(camera, { scale: 1, transformOrigin: '50% 50%', duration: 0.6, ease: 'power2.inOut' });
      t.to({}, { duration: 0.6 });

      // 5. Slide the whole resume down and out, then the timeline loops back
      //    to step 1 which pops it up again.
      t.to(paper, { autoAlpha: 0, y: 60, duration: 0.55, ease: 'power2.in' });

      return t;
    };

    tl = build();

    const onResize = () => {
      const wasActive = (tl?.progress() ?? 0) > 0;
      tl?.kill();
      tl = build();
      if (wasActive) tl.play();
    };
    window.addEventListener('resize', onResize);

    // Start when the About panel scrolls into view (either direction).
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!tl) return;
        if (entry.isIntersecting) tl.play();
        else tl.pause();
      },
      { threshold: 0.35 }
    );
    io.observe(root);

    return () => {
      io.disconnect();
      window.removeEventListener('resize', onResize);
      tl?.kill();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`relative h-full w-full overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Paper sheet — nearly fills the stage */}
      <div
        data-paper
        className="absolute inset-x-[3%] inset-y-[2%] overflow-hidden rounded-md bg-white shadow-2xl"
      >
        {/* Camera: the element we scale to zoom into a region */}
        <div data-camera className="relative h-full w-full">
          <div className="flex h-full flex-col px-6 py-5 text-neutral-800">
            {/* Header */}
            <div data-line className="text-center text-lg font-bold tracking-tight text-neutral-900">
              YHVHAN SUBA
            </div>
            <div data-line className="text-center text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-600">
              Software Engineer
            </div>
            <div data-line className="mb-2 text-center text-[8px] text-neutral-500">
              yhvhan.suba@email.com · (555) 018-2245 · San Francisco, CA · linkedin.com/in/yhvhansuba
            </div>

            {/* Summary */}
            <SectionTitle>Summary</SectionTitle>
            <Flaw critique="Too vague. Quantify the impact — how many, how much, what changed?">
              Responsible for various tasks and helped the team with different
              things to improve stuff.
            </Flaw>

            {/* Experience */}
            <SectionTitle>Experience</SectionTitle>
            <JobHeader role="Senior Product Manager — Northwind" dates="2021 – Present" />
            <ul className="mb-1.5 mt-0.5 space-y-0.5">
              <Bullet>
                Led a cross-functional team of 8 to ship a billing revamp,
                cutting churn 23% in two quarters.
              </Bullet>
              <FlawBullet critique="Passive & generic. What did you own? Lead with a strong verb.">
                Was involved in meetings and worked on various product-related
                activities as needed.
              </FlawBullet>
            </ul>

            <JobHeader role="Product Manager — Acme Labs" dates="2018 – 2021" />
            <ul className="mb-1.5 mt-0.5 space-y-0.5">
              <Bullet>
                Owned the onboarding funnel; A/B tests lifted activation from
                41% to 58%.
              </Bullet>
              <FlawBullet critique="No numbers. 'A lot' means nothing to a recruiter.">
                Helped increase sales a lot and made the product much better
                overall.
              </FlawBullet>
            </ul>

            {/* Education */}
            <SectionTitle>Education</SectionTitle>
            <JobHeader role="B.S. Computer Science — UC Berkeley" dates="2014 – 2018" />
            <div data-line className="mb-1.5 text-[9px] leading-relaxed text-neutral-600">
              GPA 3.8 · Dean&apos;s List · Product Management Club (VP)
            </div>

            {/* Skills */}
            <SectionTitle>Skills</SectionTitle>
            <FlawLine critique="Buzzword soup. Cut the fluff, keep the concrete tools.">
              Hard worker · Team player · Synergy · Fast learner · Roadmapping ·
              SQL · Figma · Jira · Agile
            </FlawLine>

            {/* Certifications */}
            <SectionTitle>Certifications</SectionTitle>
            <div data-line className="flex items-baseline justify-between text-[9px] leading-relaxed text-neutral-700">
              <span>Certified Scrum Product Owner (CSPO)</span>
              <span className="text-[8px] text-neutral-500">2022</span>
            </div>

            {/* Projects — fills the rest of the sheet */}
            <SectionTitle>Projects</SectionTitle>
            <ul className="mt-0.5 space-y-0.5">
              <Bullet>
                Built an internal analytics dashboard adopted by 4 teams,
                cutting weekly reporting time by 6 hours.
              </Bullet>
              <Bullet>
                Prototyped an AI resume-review tool that scores clarity and
                flags vague phrasing.
              </Bullet>
            </ul>

            <div className="mt-auto" />
          </div>
        </div>
      </div>

      {/* Critique overlay — outside the paper, floats on top of everything.
          One element, retargeted + repositioned per flaw (centered just below
          the circled line), so it's never scaled or clipped. */}
      <div
        data-comment
        className="pointer-events-none absolute left-0 top-0 z-30 w-max max-w-[85%] rounded-xl bg-neutral-900/95 px-5 py-4 shadow-2xl ring-1 ring-white/10"
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-base font-semibold uppercase tracking-wider text-red-400">
            Roast
          </span>
        </div>
        <p data-comment-text className="max-w-[420px] text-xl leading-snug text-white/90" />
      </div>
    </div>
  );
}

/* ---------- building blocks ---------- */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div data-line className="mb-1 mt-1 border-b border-neutral-300 pb-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-800">
      {children}
    </div>
  );
}

function JobHeader({ role, dates }: { role: string; dates: string }) {
  return (
    <div data-line className="flex items-baseline justify-between">
      <span className="text-[9.5px] font-semibold text-neutral-900">{role}</span>
      <span className="text-[8px] text-neutral-500">{dates}</span>
    </div>
  );
}

function Dot() {
  return <span className="mt-[3px] h-1 w-1 shrink-0 rounded-full bg-neutral-700" />;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li data-line className="flex gap-1.5 text-[9px] leading-relaxed text-neutral-700">
      <Dot />
      <span>{children}</span>
    </li>
  );
}

/* The red circle drawn over a flagged line (stays inside the paper, anchored
   to the text, so it scales correctly with the zoom). The critique text lives
   on the flaw's data-critique attribute and is shown by the shared overlay. */
function RoastCircle() {
  return (
    <svg
      className="pointer-events-none absolute -inset-x-2 -inset-y-1 z-10 h-[calc(100%+8px)] w-[calc(100%+16px)] overflow-visible"
      viewBox="0 0 300 60"
      fill="none"
      preserveAspectRatio="none"
    >
      <path
        data-circle
        d="M18,30 C18,11 90,7 160,9 C242,11 292,17 289,32 C286,50 200,54 128,53 C58,52 12,50 21,29 C25,19 60,15 122,14"
        stroke="#ef4444"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Flaw({ children, critique }: { children: React.ReactNode; critique: string }) {
  return (
    <div
      data-line
      data-flaw
      data-critique={critique}
      className="relative mb-2 flex gap-1.5 text-[9px] leading-relaxed text-neutral-700"
    >
      <Dot />
      <span>{children}</span>
      <RoastCircle />
    </div>
  );
}

function FlawBullet({ children, critique }: { children: React.ReactNode; critique: string }) {
  return (
    <li
      data-line
      data-flaw
      data-critique={critique}
      className="relative flex gap-1.5 text-[9px] leading-relaxed text-neutral-700"
    >
      <Dot />
      <span>{children}</span>
      <RoastCircle />
    </li>
  );
}

function FlawLine({ children, critique }: { children: React.ReactNode; critique: string }) {
  return (
    <div
      data-line
      data-flaw
      data-critique={critique}
      className="relative mb-1.5 text-[9px] leading-relaxed text-neutral-700"
    >
      <span>{children}</span>
      <RoastCircle />
    </div>
  );
}
