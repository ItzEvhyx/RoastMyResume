import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Mint a short-lived Deepgram API key for browser WebSocket streaming.
 *
 * JWTs from /auth/grant can't be used as WebSocket subprotocols (invalid chars).
 * Temporary keys are alphanumeric and work with `new WebSocket(url, ['token', key])`.
 */
export async function POST() {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'Voice input isn’t configured yet. Add DEEPGRAM_API_KEY to .env.local.',
      },
      { status: 503 },
    );
  }

  const auth = { Authorization: `Token ${apiKey}` };

  try {
    const projectId =
      process.env.DEEPGRAM_PROJECT_ID || (await resolveProjectId(apiKey));

    if (!projectId) {
      return NextResponse.json(
        {
          error:
            'Couldn’t find a Deepgram project. Set DEEPGRAM_PROJECT_ID in .env.local.',
        },
        { status: 502 },
      );
    }

    const res = await fetch(
      `https://api.deepgram.com/v1/projects/${projectId}/keys`,
      {
        method: 'POST',
        headers: {
          ...auth,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: 'roastmyresume-live-stt',
          scopes: ['usage:write'],
          time_to_live_in_seconds: 120,
        }),
      },
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[transcribe/token]', res.status, detail);
      return NextResponse.json(
        {
          error:
            res.status === 403
              ? 'Deepgram key needs Member permissions to start live voice. Create a Member key in the Deepgram console.'
              : 'Couldn’t start secure voice session. Try again.',
        },
        { status: 502 },
      );
    }

    const data = (await res.json()) as {
      key?: string;
      api_key_id?: string;
    };

    if (!data.key) {
      return NextResponse.json(
        { error: 'Couldn’t start secure voice session. Try again.' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      key: data.key,
      expires_in: 120,
    });
  } catch (err) {
    console.error('[transcribe/token]', err);
    return NextResponse.json(
      { error: 'Couldn’t reach speech service. Check your network.' },
      { status: 502 },
    );
  }
}

async function resolveProjectId(apiKey: string): Promise<string | null> {
  const res = await fetch('https://api.deepgram.com/v1/projects', {
    headers: { Authorization: `Token ${apiKey}` },
  });
  if (!res.ok) {
    console.error('[transcribe/token] projects', res.status, await res.text().catch(() => ''));
    return null;
  }
  const data = (await res.json()) as {
    projects?: Array<{ project_id?: string }>;
  };
  return data.projects?.[0]?.project_id ?? null;
}
