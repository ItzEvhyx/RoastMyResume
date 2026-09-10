import {
  askDeniseStream,
  type ConversationMessage,
  type DeniseMode,
  type DeniseResult,
} from '@/app/core/services/claude';
import {
  buildSpeechScript,
  flushRemainingSpeech,
  pullCompleteSpeechChunks,
  synthesizeSpeechPcm,
  type DeniseSpeakMode,
} from '@/app/core/services/cartesia';
import {
  AiRateLimitError,
  consumeAiRateLimit,
  resolveRequestEmail,
  type AiRateStatus,
} from '@/app/core/services/ratelimit';

export const runtime = 'nodejs';
export const maxDuration = 120;

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

function sse(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Streams Denise text as it generates, and Cartesia PCM per finished sentence
 * so speech can start before the full reply is ready.
 */
export async function POST(request: Request) {
  let body: DeniseBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const mode = body.mode;
  if (typeof mode !== 'string' || !VALID_MODES.includes(mode as DeniseMode)) {
    return Response.json(
      { error: 'mode must be "roast" or "help".' },
      { status: 400 },
    );
  }

  const canvasSnapshot =
    typeof body.canvasSnapshot === 'string' ? body.canvasSnapshot : '';

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json(
      { error: 'messages must be a non-empty array.' },
      { status: 400 },
    );
  }
  if (!body.messages.every(isValidMessage)) {
    return Response.json(
      {
        error:
          'Each message must have a role ("user"|"assistant") and non-empty content.',
      },
      { status: 400 },
    );
  }

  const approvedElements = parseApprovedElements(body.approvedElements);
  const skipInterview = body.skipInterview === true;
  const speakMode = mode as DeniseSpeakMode;
  const voiceEnabled = Boolean(
    process.env.CARTESIA_API_KEY && process.env.CARTESIA_VOICE_ID,
  );

  const email = resolveRequestEmail(request, body);
  if (!email) {
    return Response.json(
      { error: 'Sign in to use Denise.' },
      { status: 401 },
    );
  }

  const conversation = body.messages as ConversationMessage[];
  // One daily use per new thread (first assistant-less request), not per follow-up.
  const isNewSession = !conversation.some((m) => m.role === 'assistant');
  let rateLimit: AiRateStatus | null = null;

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
      console.error('[api/denise/stream] rate limit failed:', err);
      return Response.json(
        { error: 'Could not verify AI usage limits.' },
        { status: 500 },
      );
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) => {
        try {
          controller.enqueue(sse(payload));
        } catch {
          /* closed */
        }
      };

      let spokenOffset = 0;
      let latestSpeech = '';
      let speechFrozen = false;
      let speakPhase: 'interview' | 'fixes' | null =
        speakMode === 'help' ? 'interview' : null;
      let ttsChain: Promise<void> = Promise.resolve();
      let aborted = false;

      const enqueueSpeech = (chunk: string) => {
        if (!voiceEnabled || aborted || !chunk.trim()) return;
        ttsChain = ttsChain
          .then(async () => {
            if (aborted) return;
            try {
              const { pcm, sampleRate } = await synthesizeSpeechPcm({
                transcript: chunk,
                mode: speakMode,
                phase: speakPhase,
              });
              if (aborted) return;
              send({
                type: 'audio',
                pcm: Buffer.from(pcm).toString('base64'),
                sampleRate,
              });
            } catch (err) {
              console.error('[denise/stream] TTS chunk failed:', err);
              send({
                type: 'voice_error',
                error:
                  err instanceof Error
                    ? err.message
                    : 'Voice chunk failed.',
              });
            }
          })
          .catch(() => undefined);
      };

      const speakFromMarkdown = (content: string, allowFreeze: boolean) => {
        if (speechFrozen) return;
        const { text, capped } = buildSpeechScript(content, speakMode);
        latestSpeech = text;
        const { chunks, nextOffset } = pullCompleteSpeechChunks(
          latestSpeech,
          spokenOffset,
        );
        spokenOffset = nextOffset;
        for (const chunk of chunks) enqueueSpeech(chunk);
        // After 3 bullets + dismissal are in the script, stop spending more credits
        if (allowFreeze && capped) speechFrozen = true;
      };

      const onContent = (content: string) => {
        send({ type: 'text', content });
        speakFromMarkdown(content, true);
      };

      try {
        send({ type: 'status', status: 'generating' });

        const result: DeniseResult = await askDeniseStream(
          {
            mode: mode as DeniseMode,
            canvasSnapshot,
            messages: body.messages as ConversationMessage[],
            approvedElements,
            skipInterview,
          },
          { onContent },
        );

        speakPhase = result.phase === 'interview' || result.phase === 'fixes'
          ? result.phase
          : speakPhase;

        // Final text (full) always — speech stays capped for credits
        send({ type: 'text', content: result.content });
        if (!speechFrozen) {
          speakFromMarkdown(result.content, true);
        }
        const rest = flushRemainingSpeech(latestSpeech, spokenOffset);
        if (rest) enqueueSpeech(rest);

        await ttsChain;
        send({
          type: 'done',
          result,
          ...(rateLimit ? { rateLimit } : {}),
        });
      } catch (err) {
        console.error('[api/denise/stream] failed:', err);
        send({
          type: 'error',
          error: 'Denise is unavailable right now. Try again.',
        });
      } finally {
        aborted = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
