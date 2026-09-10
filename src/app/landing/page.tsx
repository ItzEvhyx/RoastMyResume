'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMediaQuery } from '@/lib/use_media_query';
import { useAuthUser } from '@/app/core/session/session';
import LandingDesktop from '@/app/features/landing_page/landing.desktop';
import LandingMobile from '@/app/features/landing_page/landing.mobile';
import DeniseModal from '@/rb_components/denise_modal';
import { FORCE_LANDING_KEY } from '@/app/core/session/force.landing';

/**
 * Device switch: renders exactly one landing tree based on viewport width, so
 * the desktop (GSAP horizontal-scroll) and mobile (vertical) experiences are
 * fully isolated — only one mounts at a time.
 *
 * Breakpoint: below 768px = mobile (matches Tailwind's default `md`).
 */
export default function LandingPage() {
  const router = useRouter();
  const user = useAuthUser();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [allowLanding, setAllowLanding] = useState(false);
  const [checkedForce, setCheckedForce] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(FORCE_LANDING_KEY) === '1') {
        sessionStorage.removeItem(FORCE_LANDING_KEY);
        setAllowLanding(true);
      }
    } catch {
      // ignore
    }
    setCheckedForce(true);
  }, []);

  // Signed-in users skip marketing on normal entry — not when Back forced landing.
  useEffect(() => {
    if (!checkedForce) return;
    if (user && !allowLanding) router.replace('/templates');
  }, [user, router, allowLanding, checkedForce]);

  if (!checkedForce || (user && !allowLanding)) {
    return <main className="min-h-screen w-full bg-black" />;
  }

  // Until mount we don't know the viewport (SSR has none). Render a plain
  // black shell to avoid a hydration mismatch / layout flash.
  if (isMobile === undefined) {
    return <main className="min-h-screen w-full bg-black" />;
  }

  return (
    <>
      {isMobile ? <LandingMobile /> : <LandingDesktop />}
      {/* Single shared modal instance both trees' Get started buttons open. */}
      <DeniseModal />
    </>
  );
}
