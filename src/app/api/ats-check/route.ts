import { analyzeAtsCheck } from '@/app/core/services/claude';
import {
  AiRateLimitError,
  consumeAiRateLimit,
  resolveRequestEmail,
} from '@/app/core/services/ratelimit';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface AtsCheckBody {
  canvasSnapshot?: unknown;
  email?: unknown;
}

export async function POST(request: Request) {
  let body: AtsCheckBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const canvasSnapshot =
    typeof body.canvasSnapshot === 'string' ? body.canvasSnapshot : '';

  const email = resolveRequestEmail(request, body);
  if (!email) {
    return Response.json(
      { error: 'Sign in to use ATS Check.' },
      { status: 401 },
    );
  }

  let rateLimit;
  try {
    rateLimit = await consumeAiRateLimit(email, 'ats_check');
  } catch (err) {
    if (err instanceof AiRateLimitError) {
      return Response.json(
        {
          error: err.message,
          remaining: 0,
          feature: err.feature,
          limit: err.limit,
        },
        { status: 429 },
      );
    }
    console.error('[ats-check] rate limit failed:', err);
    return Response.json(
      { error: 'Could not verify AI usage limits.' },
      { status: 500 },
    );
  }

  try {
    const result = await analyzeAtsCheck({ canvasSnapshot });
    return Response.json({ ...result, rateLimit });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'ATS check failed.';
    console.error('[ats-check]', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
