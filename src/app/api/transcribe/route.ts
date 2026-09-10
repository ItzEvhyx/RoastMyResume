import { transcribeAudio } from '@/app/core/services/deepgram';

export const runtime = 'nodejs';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(request: Request) {
  if (!process.env.DEEPGRAM_API_KEY) {
    return Response.json(
      {
        error:
          'Voice input isn’t configured yet. Add DEEPGRAM_API_KEY to .env.local.',
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'Expected multipart form data.' }, { status: 400 });
  }

  const file = form.get('audio');
  if (!(file instanceof File)) {
    return Response.json({ error: 'Missing audio file.' }, { status: 400 });
  }

  if (file.size === 0) {
    return Response.json({ error: 'Audio recording was empty.' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: 'Recording is too long. Keep it under about a minute.' },
      { status: 413 },
    );
  }

  const contentType = file.type || 'audio/webm';
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const transcript = await transcribeAudio(buffer, contentType);
    if (!transcript) {
      return Response.json(
        { error: 'Couldn’t catch that — try speaking again a bit louder.' },
        { status: 422 },
      );
    }
    return Response.json({ transcript });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Transcription failed. Try again.';
    console.error('[transcribe]', message);
    return Response.json({ error: message }, { status: 502 });
  }
}
