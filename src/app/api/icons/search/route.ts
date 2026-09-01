/**
 * GET /api/icons/search?q=email&limit=50&prefixes=mdi,heroicons
 *
 * Icon search with a two-layer cache:
 *
 *   Layer 1 — Firestore "icons" collection
 *             Pre-seeded top-50 icons and any previously searched icons
 *             are served instantly from the DB with their Cloudinary CDN URL.
 *
 *   Layer 2 — Iconify REST API
 *             Icons not yet in Firestore are fetched live, uploaded to
 *             Cloudinary in the background, and written to Firestore so
 *             they're cached for the next request. The response is not
 *             blocked — uncached icons still get a direct Iconify SVG URL
 *             immediately.
 *
 * Response shape:
 * {
 *   icons: Array<{
 *     iconId:        string   // "mdi:email-outline"
 *     name:          string   // "email-outline"
 *     prefix:        string   // "mdi"
 *     cloudinaryUrl: string   // Cloudinary CDN URL (cached) or Iconify URL (fallback)
 *     svgUrl:        string   // direct Iconify SVG URL — always present
 *     cached:        boolean  // true = served from Cloudinary cache
 *   }>,
 *   total: number
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { searchIcons, fetchIconSvg, iconIdToSvgUrl } from '@/app/core/services/iconify';
import { uploadSvgToCloudinary } from '@/app/core/services/cloudinary';
import { getClientFirestore } from '@/app/core/services/firebase';
import type { Firestore } from 'firebase/firestore';

export const runtime = 'nodejs';

const ICONS_COLLECTION = 'icons';

export interface IconSearchItem {
  iconId: string;
  name: string;
  prefix: string;
  /** Cloudinary CDN URL when cached, direct Iconify SVG URL as fallback */
  cloudinaryUrl: string;
  /** Raw Iconify SVG URL — always present */
  svgUrl: string;
  cached: boolean;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query = searchParams.get('q')?.trim();
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100);
  const prefixes = searchParams.get('prefixes') ?? undefined;

  if (!query) {
    return NextResponse.json(
      { error: 'Missing required query param: q' },
      { status: 400 }
    );
  }

  try {
    // -----------------------------------------------------------------------
    // 1. Search Iconify for matching icon IDs
    // -----------------------------------------------------------------------
    const { icons: iconifyResults, total } = await searchIcons(query, limit, prefixes);

    if (iconifyResults.length === 0) {
      return NextResponse.json({ icons: [], total: 0 });
    }

    const db = getClientFirestore();

    // -----------------------------------------------------------------------
    // 2. Check Firestore cache for each icon (parallel reads)
    // -----------------------------------------------------------------------
    const cacheChecks = await Promise.all(
      iconifyResults.map(async ({ prefix, name }) => {
        const docId = `${prefix}--${name}`;
        const snap = await getDoc(doc(db, ICONS_COLLECTION, docId));
        if (snap.exists()) {
          const data = snap.data() as { cloudinaryUrl?: string };
          return { docId, cloudinaryUrl: data.cloudinaryUrl ?? null };
        }
        return { docId, cloudinaryUrl: null };
      })
    );

    const cachedUrls = new Map<string, string>();
    for (const { docId, cloudinaryUrl } of cacheChecks) {
      if (cloudinaryUrl) cachedUrls.set(docId, cloudinaryUrl);
    }

    // -----------------------------------------------------------------------
    // 3. Background-cache any icons not yet in Firestore (non-blocking)
    // -----------------------------------------------------------------------
    const uncached = iconifyResults.filter(
      ({ prefix, name }) => !cachedUrls.has(`${prefix}--${name}`)
    );
    if (uncached.length > 0) {
      void cacheIconsInBackground(uncached, db);
    }

    // -----------------------------------------------------------------------
    // 4. Build response — Cloudinary URL when cached, Iconify URL as fallback
    // -----------------------------------------------------------------------
    const icons: IconSearchItem[] = iconifyResults.map(({ iconId, name, prefix, svgUrl }) => {
      const docId = `${prefix}--${name}`;
      const cloudinaryUrl = cachedUrls.get(docId);
      return {
        iconId,
        name,
        prefix,
        cloudinaryUrl: cloudinaryUrl ?? svgUrl,
        svgUrl,
        cached: !!cloudinaryUrl,
      };
    });

    return NextResponse.json({ icons, total });
  } catch (err) {
    console.error('[/api/icons/search] Error:', err);
    return NextResponse.json(
      { error: 'Search failed', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Background cache writer — fires after the response is sent
// ---------------------------------------------------------------------------

interface UncachedIcon {
  iconId: string;
  name: string;
  prefix: string;
}

async function cacheIconsInBackground(
  icons: UncachedIcon[],
  db: Firestore
): Promise<void> {
  for (const { iconId, name, prefix } of icons) {
    try {
      const svg = await fetchIconSvg(iconId);
      if (!svg) continue;

      const publicId = `icons/${prefix}--${name}`;
      const { secureUrl } = await uploadSvgToCloudinary(svg, publicId);

      const docId = `${prefix}--${name}`;
      await setDoc(
        doc(db, ICONS_COLLECTION, docId),
        {
          iconId,
          name,
          prefix,
          cloudinaryUrl: secureUrl,
          cachedAt: serverTimestamp(),
          isTop50: false,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn(`[cacheIconsInBackground] Failed to cache "${iconId}":`, err);
    }
  }
}
