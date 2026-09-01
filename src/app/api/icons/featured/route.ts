/**
 * GET /api/icons/featured?limit=15
 *
 * Returns icons that were seeded as top-50 (isTop50: true) from Firestore.
 * Uses the client SDK — no Admin credentials required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, limit as fsLimit, getDocs } from 'firebase/firestore';
import { getClientFirestore } from '@/app/core/services/firebase';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const count = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 15), 50);

  try {
    const db = getClientFirestore();
    const q = query(
      collection(db, 'icons'),
      where('isTop50', '==', true),
      fsLimit(count),
    );

    const snap = await getDocs(q);
    const icons = snap.docs.map(d => {
      const data = d.data() as {
        iconId: string;
        name: string;
        prefix: string;
        cloudinaryUrl: string;
      };
      // Always include the direct Iconify SVG URL as a reliable fallback
      const svgUrl = `https://api.iconify.design/${data.prefix}/${data.name}.svg`;
      return {
        iconId: data.iconId,
        name: data.name,
        prefix: data.prefix,
        cloudinaryUrl: data.cloudinaryUrl,
        svgUrl,
      };
    });

    return NextResponse.json({ icons });
  } catch (err) {
    console.error('[/api/icons/featured]', err);
    return NextResponse.json(
      { error: 'Failed to load featured icons', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
