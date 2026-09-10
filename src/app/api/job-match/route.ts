import {
  JobMatchValidationError,
  runJobMatch,
  type ImageMediaType,
  type JobMatchImage,
} from '@/app/core/services/claude';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ALLOWED_MEDIA: ImageMediaType[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

interface JobMatchBody {
  text?: unknown;
  canvasSnapshot?: unknown;
  images?: unknown;
}

function parseImages(value: unknown): JobMatchImage[] {
  if (!Array.isArray(value)) return [];
  const out: JobMatchImage[] = [];
  for (const item of value.slice(0, 3)) {
    if (typeof item !== 'object' || item === null) continue;
    const row = item as Record<string, unknown>;
    const data = typeof row.data === 'string' ? row.data.replace(/^data:[^;]+;base64,/, '') : '';
    const mediaType = row.mediaType;
    if (!data) continue;
    if (typeof mediaType !== 'string' || !ALLOWED_MEDIA.includes(mediaType as ImageMediaType)) {
      continue;
    }
    out.push({ data, mediaType: mediaType as ImageMediaType });
  }
  return out;
}

export async function POST(request: Request) {
  let body: JobMatchBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text.slice(0, 600) : '';
  const canvasSnapshot =
    typeof body.canvasSnapshot === 'string' ? body.canvasSnapshot : '';
  const images = parseImages(body.images);

  if (!text.trim() && images.length === 0) {
    return Response.json(
      { error: 'Paste a job listing or attach up to 3 screenshots.' },
      { status: 400 },
    );
  }

  try {
    const result = await runJobMatch({ text, images, canvasSnapshot });
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Job match failed.';
    if (err instanceof JobMatchValidationError) {
      return Response.json({ error: message }, { status: 400 });
    }
    console.error('[job-match]', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
