import {
  isCartesiaConfigured,
  synthesizeSpeech,
  type DeniseSpeakMode,
} from '@/app/core/services/cartesia';

export const runtime = 'nodejs';

interface SpeakBody {
  text?: unknown;
  mode?: unknown;
  phase?: unknown;
}

export async function POST(request: Request) {
  if (!isCartesiaConfigured()) {
    return Response.json(
      {
        error:
          'Denise’s voice isn’t configured. Add CARTESIA_API_KEY … CARTESIA_API_KEY5 and CARTESIA_VOICE_ID to .env.local.',
      },
      { status: 503 },
    );
  }

  let body: SpeakBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text : '';
  const mode =
    body.mode === 'roast' || body.mode === 'help'
      ? (body.mode as DeniseSpeakMode)
      : null;
  const phase =
    body.phase === 'interview' || body.phase === 'fixes' ? body.phase : null;

  if (!text.trim()) {
    return Response.json({ error: 'text is required.' }, { status: 400 });
  }
  if (!mode) {
    return Response.json({ error: 'mode must be "roast" or "help".' }, { status: 400 });
  }

  try {
    const { audio, contentType } = await synthesizeSpeech({
      transcript: text,
      mode,
      phase,
    });
    return new Response(audio, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Speech synthesis failed.';
    console.error('[denise/speak]', message);
    return Response.json({ error: message }, { status: 502 });
  }
}
