/**
 * Daily AI feature rate limits (server-side).
 * Stored in Firestore `ai_rate_limits/{email}`.
 *
 * Uses the client Firestore SDK (same as /api/auth/signin) so it does not
 * depend on FIREBASE_PRIVATE_KEY / Admin credentials.
 */

import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { getClientFirestore } from '@/app/core/services/firebase';
import {
  AI_DAILY_LIMIT,
  AI_RATE_FEATURES,
  isAiRateAdmin,
  normalizeEmail,
  type AiRateBucket,
  type AiRateFeature,
  type AiRateStatus,
} from '@/app/core/services/ratelimit.shared';

export {
  AI_DAILY_LIMIT,
  AI_RATE_FEATURES,
  isAiRateAdmin,
  normalizeEmail,
  type AiRateBucket,
  type AiRateFeature,
  type AiRateStatus,
} from '@/app/core/services/ratelimit.shared';

const COLLECTION = 'ai_rate_limits';

export type AiRateUsageMap = Record<AiRateFeature, AiRateBucket>;

export class AiRateLimitError extends Error {
  readonly status = 429;
  readonly remaining: number;
  readonly limit: number;
  readonly feature: AiRateFeature;

  constructor(feature: AiRateFeature, limit: number) {
    super(
      `Daily limit reached for ${featureLabel(feature)} (${limit}/${limit}). Try again tomorrow.`,
    );
    this.name = 'AiRateLimitError';
    this.feature = feature;
    this.limit = limit;
    this.remaining = 0;
  }
}

function featureLabel(feature: AiRateFeature): string {
  switch (feature) {
    case 'roast':
      return 'Denise Roast';
    case 'help':
      return 'Denise Assist';
    case 'job_match':
      return 'Job Match';
    case 'ats_check':
      return 'ATS Check';
  }
}

/** UTC calendar day key — resets at midnight UTC. */
export function utcDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Read email from `x-user-email` header or JSON body.email. */
export function resolveRequestEmail(
  request: Request,
  body?: { email?: unknown },
): string | null {
  const fromHeader = normalizeEmail(request.headers.get('x-user-email'));
  if (fromHeader) return fromHeader;
  return normalizeEmail(body?.email);
}

function emptyUsage(day: string): AiRateUsageMap {
  return {
    roast: { day, used: 0 },
    help: { day, used: 0 },
    job_match: { day, used: 0 },
    ats_check: { day, used: 0 },
  };
}

function normalizeBucket(raw: unknown, day: string): AiRateBucket {
  if (typeof raw !== 'object' || raw === null) return { day, used: 0 };
  const row = raw as Record<string, unknown>;
  const bucketDay = typeof row.day === 'string' ? row.day : day;
  const used =
    typeof row.used === 'number' && row.used >= 0 ? Math.floor(row.used) : 0;
  if (bucketDay !== day) return { day, used: 0 };
  return { day: bucketDay, used };
}

function statusFor(
  feature: AiRateFeature,
  bucket: AiRateBucket,
  unlimited: boolean,
): AiRateStatus {
  const used = unlimited ? 0 : bucket.used;
  const remaining = unlimited
    ? AI_DAILY_LIMIT
    : Math.max(0, AI_DAILY_LIMIT - used);
  return {
    feature,
    limit: AI_DAILY_LIMIT,
    used,
    remaining: unlimited ? AI_DAILY_LIMIT : remaining,
    unlimited,
    day: bucket.day,
  };
}

/** Current usage for all AI features (does not increment). */
export async function getAiRateStatuses(email: string): Promise<AiRateStatus[]> {
  const day = utcDayKey();
  const unlimited = isAiRateAdmin(email);
  if (unlimited) {
    return AI_RATE_FEATURES.map((feature) =>
      statusFor(feature, { day, used: 0 }, true),
    );
  }

  const db = getClientFirestore();
  const snap = await getDoc(doc(db, COLLECTION, email));
  const data = snap.exists() ? (snap.data() as Record<string, unknown>) : {};

  return AI_RATE_FEATURES.map((feature) =>
    statusFor(feature, normalizeBucket(data[feature], day), false),
  );
}

/**
 * Atomically consume one daily use for `feature`.
 * Admins always succeed without writing.
 * Throws AiRateLimitError when the daily cap is already reached.
 */
export async function consumeAiRateLimit(
  email: string,
  feature: AiRateFeature,
): Promise<AiRateStatus> {
  const day = utcDayKey();
  if (isAiRateAdmin(email)) {
    return statusFor(feature, { day, used: 0 }, true);
  }

  const db = getClientFirestore();
  const ref = doc(db, COLLECTION, email);

  const result = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists()
      ? (snap.data() as Record<string, unknown>)
      : ({} as Record<string, unknown>);
    const bucket = normalizeBucket(data[feature], day);

    if (bucket.used >= AI_DAILY_LIMIT) {
      throw new AiRateLimitError(feature, AI_DAILY_LIMIT);
    }

    const next: AiRateBucket = { day, used: bucket.used + 1 };
    const payload: Record<string, unknown> = {
      email,
      [feature]: next,
      updatedAt: serverTimestamp(),
    };

    if (!snap.exists()) {
      const base = emptyUsage(day);
      for (const f of AI_RATE_FEATURES) {
        if (f === feature) continue;
        payload[f] = base[f];
      }
    }

    tx.set(ref, payload, { merge: true });
    return next;
  });

  return statusFor(feature, result, false);
}
