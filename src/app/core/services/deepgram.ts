/**
 * Deepgram speech-to-text (prerecorded).
 * Used for voice input — works in Brave/Chromium/Firefox where Web Speech fails.
 */

/** Copy into a real ArrayBuffer so fetch BodyInit types accept it on Vercel/Node. */
function toArrayBuffer(audio: ArrayBuffer | Uint8Array | Buffer): ArrayBuffer {
  if (audio instanceof ArrayBuffer) return audio;
  const copy = new Uint8Array(audio.byteLength);
  copy.set(audio);
  return copy.buffer;
}

export async function transcribeAudio(
  audio: ArrayBuffer | Uint8Array | Buffer,
  contentType: string,
): Promise<string> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error(
      'DEEPGRAM_API_KEY is not set. Add it to .env.local to enable voice input.',
    );
  }

  const url = new URL('https://api.deepgram.com/v1/listen');
  url.searchParams.set('model', 'nova-2');
  url.searchParams.set('smart_format', 'true');
  url.searchParams.set('punctuate', 'true');
  url.searchParams.set('language', 'en');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': contentType || 'audio/webm',
    },
    body: toArrayBuffer(audio),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(
      `Deepgram transcription failed (${res.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`,
    );
  }

  const data = (await res.json()) as {
    results?: {
      channels?: Array<{
        alternatives?: Array<{ transcript?: string }>;
      }>;
    };
  };

  const transcript =
    data.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? '';

  return transcript;
}
