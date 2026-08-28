'use client';

import { useEffect, useState } from 'react';

/**
 * SSR-safe media query hook.
 *
 * Returns `undefined` until the component has mounted on the client, then the
 * boolean match. Consumers should treat `undefined` as "not yet known" and
 * render nothing (or a neutral shell) to avoid a hydration mismatch — the
 * server has no viewport, so we can't know which tree to render until mount.
 *
 * @example
 *   const isMobile = useMediaQuery('(max-width: 767px)');
 *   if (isMobile === undefined) return null;
 *   return isMobile ? <Mobile /> : <Desktop />;
 */
export function useMediaQuery(query: string): boolean | undefined {
  const [matches, setMatches] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);

    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
