// src/app/api/denise/route.ts

import {
  askDenise,
  type ConversationMessage,
  type DeniseMode,
} from '@/app/core/services/claude';
import {
  AiRateLimitError,
  consumeAiRateLimit,
  resolveRequestEmail,
} from '@/app/core/services/ratelimit';

export const runtime = 'nodejs';

const VALID_MODES: DeniseMode[] = ['roast', 'help'];

interface DeniseBody {
  mode?: unknown;
  canvasSnapshot?: unknown;
  messages?: unknown;
  approvedElements?: unknown;
  skipInterview?: unknown;
  email?: unknown;
}

function isValidMessage(value: unknown): value is ConversationMessage {
  if (typeof value !== 'object' || value === null) return false;
  const msg = value as Record<string, unknown>;
  return (
    (msg.role === 'user' || msg.role === 'assistant') &&
    typeof msg.content === 'string' &&
    msg.content.length > 0
  );
}

function parseApprovedElements(
  value: unknown,
): Record<string, string> | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === 'string' && raw.length > 0) {
      out[key] = raw;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

export async function POST(request: Request) {
  let body: DeniseBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  // Validate mode
  const mode = body.mode;
  if (typeof mode !== 'string' || !VALID_MODES.includes(mode as DeniseMode)) {
    return Response.json(
      { error: 'mode must be "roast" or "help".' },
      { status: 400 },
    );
  }

  // Validate canvasSnapshot
  const canvasSnapshot =
    typeof body.canvasSnapshot === 'string' ? body.canvasSnapshot : '';

  // Validate messages
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json(
      { error: 'messages must be a non-empty array.' },
      { status: 400 },
    );
  }
  if (!body.messages.every(isValidMessage)) {
    return Response.json(
      { error: 'Each message must have a role ("user"|"assistant") and non-empty content.' },
      { status: 400 },
    );
  }

  const approvedElements = parseApprovedElements(body.approvedElements);
  const skipInterview = body.skipInterview === true;

  const email = resolveRequestEmail(request, body);
  if (!email) {
    return Response.json(
      { error: 'Sign in to use Denise.' },
      { status: 401 },
    );
  }

  const conversation = body.messages as ConversationMessage[];
  const isNewSession = !conversation.some((m) => m.role === 'assistant');

  let rateLimit = null;
  if (isNewSession) {
    try {
      rateLimit = await consumeAiRateLimit(
        email,
        mode as 'roast' | 'help',
      );
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
      console.error('[api/denise] rate limit failed:', err);
      return Response.json(
        { error: 'Could not verify AI usage limits.' },
        { status: 500 },
      );
    }
  }

  try {
    const result = await askDenise({
      mode: mode as DeniseMode,
      canvasSnapshot,
      messages: body.messages as ConversationMessage[],
      approvedElements,
      skipInterview,
    });
    return Response.json({ ...result, ...(rateLimit ? { rateLimit } : {}) });
  } catch (err) {
    console.error('[api/denise] Claude request failed:', err);
    return Response.json(
      { error: 'Denise is unavailable right now. Try again.' },
      { status: 502 },
    );
  }
}
