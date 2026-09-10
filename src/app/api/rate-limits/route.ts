import { NextRequest, NextResponse } from 'next/server';
import {
  getAiRateStatuses,
  normalizeEmail,
  resolveRequestEmail,
} from '@/app/core/services/ratelimit';

export const runtime = 'nodejs';

/**
 * GET /api/rate-limits?email=
 * or header x-user-email
 *
 * Returns remaining daily AI uses for the signed-in account.
 */
export async function GET(req: NextRequest) {
  const email =
    resolveRequestEmail(req) ||
    normalizeEmail(req.nextUrl.searchParams.get('email'));

  if (!email) {
    return NextResponse.json(
      { error: 'Sign in to view AI usage limits.' },
      { status: 401 },
    );
  }

  try {
    const features = await getAiRateStatuses(email);
    return NextResponse.json({ email, features });
  } catch (err) {
    console.error('[api/rate-limits]', err);
    return NextResponse.json(
      { error: 'Could not load rate limits.' },
      { status: 500 },
    );
  }
}
