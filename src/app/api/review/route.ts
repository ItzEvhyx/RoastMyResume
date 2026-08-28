// src/app/api/review/route.ts
import {
  reviewResume,
  type ReviewImage,
  type ReviewMode,
  type ImageMediaType,
} from '@/app/core/services/claude';

export const runtime = 'nodejs';

const VALID_MODES: ReviewMode[] = ['roast', 'real-talk'];
const VALID_MEDIA_TYPES: ImageMediaType[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

interface ReviewBody {
  mode?: unknown;
  text?: unknown;
  images?: unknown;
}

function isValidImage(value: unknown): value is ReviewImage {
  if (typeof value !== 'object' || value === null) return false;
  const img = value as Record<string, unknown>;
  return (
    typeof img.data === 'string' &&
    img.data.length > 0 &&
    typeof img.mediaType === 'string' &&
    VALID_MEDIA_TYPES.includes(img.mediaType as ImageMediaType)
  );
}

export async function POST(request: Request) {
  let body: ReviewBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const mode = body.mode;
  if (typeof mode !== 'string' || !VALID_MODES.includes(mode as ReviewMode)) {
    return Response.json(
      { error: 'mode must be "roast" or "real-talk".' },
      { status: 400 }
    );
  }

  const text = typeof body.text === 'string' ? body.text : undefined;

  let images: ReviewImage[] | undefined;
  if (Array.isArray(body.images)) {
    if (!body.images.every(isValidImage)) {
      return Response.json(
        { error: 'One or more images are invalid.' },
        { status: 400 }
      );
    }
    images = body.images as ReviewImage[];
  }

  const hasText = Boolean(text && text.trim().length > 0);
  const hasImages = Boolean(images && images.length > 0);
  if (!hasText && !hasImages) {
    return Response.json(
      { error: 'Provide resume text or at least one screenshot.' },
      { status: 400 }
    );
  }

  try {
    const result = await reviewResume({
      mode: mode as ReviewMode,
      text,
      images,
    });
    return Response.json(result);
  } catch (err) {
    console.error('[api/review] Claude request failed:', err);
    return Response.json(
      { error: 'The review service is unavailable right now. Try again.' },
      { status: 502 }
    );
  }
}
