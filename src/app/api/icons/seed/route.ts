/**
 * POST /api/icons/seed
 *
 * Seeds the top-50 resume icons into Cloudinary (as SVG assets) and records
 * each icon's Cloudinary CDN URL in Firestore under the `icons` collection.
 *
 * Uses the Firebase CLIENT SDK (no Admin SDK / service account key required).
 * Make sure your Firestore security rules allow writes to the `icons` collection
 * from the server — see the rules comment at the bottom of this file.
 *
 * Firestore document shape  (collection: "icons", doc id: "prefix--name"):
 * {
 *   iconId:        "mdi:email-outline",
 *   name:          "email-outline",
 *   prefix:        "mdi",
 *   cloudinaryUrl: "https://res.cloudinary.com/…",
 *   cachedAt:      serverTimestamp(),
 *   isTop50:       true,
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { TOP_50_RESUME_ICONS, fetchIconSvg } from '@/app/core/services/iconify';
import { uploadSvgToCloudinary } from '@/app/core/services/cloudinary';
import { getClientFirestore } from '@/app/core/services/firebase';

export const runtime = 'nodejs';
export const maxDuration = 300;

const ICONS_COLLECTION = 'icons';

interface SeedResult {
  iconId: string;
  status: 'seeded' | 'skipped' | 'error';
  cloudinaryUrl?: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  // Optional secret guard — set SEED_SECRET in .env.local to protect the route
  const seedSecret = process.env.SEED_SECRET;
  if (seedSecret) {
    const authHeader = req.headers.get('x-seed-secret');
    if (authHeader !== seedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const db = getClientFirestore();
  const results: SeedResult[] = [];

  for (const iconId of TOP_50_RESUME_ICONS) {
    const [prefix, name] = iconId.split(':');

    try {
      // 1. Fetch SVG from Iconify
      const svg = await fetchIconSvg(iconId);
      if (!svg) {
        results.push({ iconId, status: 'skipped', error: 'Icon not found on Iconify' });
        continue;
      }

      // 2. Upload to Cloudinary — public_id uses double-dash (filename-safe)
      const publicId = `icons/${prefix}--${name}`;
      const { secureUrl } = await uploadSvgToCloudinary(svg, publicId);

      // 3. Upsert Firestore doc — doc ID also uses double-dash ("/" not allowed in doc IDs)
      const docId = `${prefix}--${name}`;
      await setDoc(
        doc(db, ICONS_COLLECTION, docId),
        {
          iconId,
          name,
          prefix,
          cloudinaryUrl: secureUrl,
          cachedAt: serverTimestamp(),
          isTop50: true,
        },
        { merge: true }
      );

      results.push({ iconId, status: 'seeded', cloudinaryUrl: secureUrl });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ iconId, status: 'error', error: message });
    }
  }

  const seeded = results.filter((r) => r.status === 'seeded').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const errors = results.filter((r) => r.status === 'error').length;

  return NextResponse.json({
    summary: { total: TOP_50_RESUME_ICONS.length, seeded, skipped, errors },
    results,
  });
}

/*
 * ─── FIRESTORE SECURITY RULES ────────────────────────────────────────────────
 *
 * Add this to your Firebase Console → Firestore → Rules to allow the seed
 * and search routes to read/write the icons collection:
 *
 *   rules_version = '2';
 *   service cloud.firestore {
 *     match /databases/{database}/documents {
 *
 *       // Icons cache — public read, server-only write
 *       // (no auth check needed since the seed route is protected by SEED_SECRET)
 *       match /icons/{iconId} {
 *         allow read: if true;
 *         allow write: if true;   // tighten this once you add auth
 *       }
 *     }
 *   }
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */
