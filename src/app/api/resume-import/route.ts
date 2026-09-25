import { extractResumeFromPdf } from '@/app/core/services/claude';
import {
  AiRateLimitError,
  consumeAiRateLimit,
  resolveRequestEmail,
} from '@/app/core/services/ratelimit';
import { RESUME_IMPORT_MAX_BYTES } from '@/app/features/resume_import/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

function isPdf(bytes: Uint8Array): boolean {
  return (
    bytes.length > 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  );
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'Expected a file upload.' }, { status: 400 });
  }

  const emailField = form.get('email');
  const email = resolveRequestEmail(request, {
    email: typeof emailField === 'string' ? emailField : undefined,
  });
  if (!email) {
    return Response.json(
      { error: 'Sign in to import your resume.' },
      { status: 401 },
    );
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: 'No file uploaded.' }, { status: 400 });
  }
  if (file.size > RESUME_IMPORT_MAX_BYTES) {
    return Response.json(
      { error: 'That PDF is too large. Max size is 5 MB.' },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isPdf(bytes)) {
    return Response.json(
      { error: 'Only PDF files are supported.' },
      { status: 400 },
    );
  }

  let rateLimit;
  try {
    rateLimit = await consumeAiRateLimit(email, 'resume_import');
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
    console.error('[resume-import] rate limit failed:', err);
    return Response.json(
      { error: 'Could not verify AI usage limits.' },
      { status: 500 },
    );
  }

  try {
    const base64 = Buffer.from(bytes).toString('base64');
    const { notAResume, resume } = await extractResumeFromPdf({ base64 });
    if (notAResume) {
      return Response.json(
        { error: "That file doesn't look like a resume.", rateLimit },
        { status: 422 },
      );
    }
    return Response.json({ resume, rateLimit });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Resume import failed.';
    console.error('[resume-import]', message);
    return Response.json(
      { error: 'Could not read that PDF. Try another file.' },
      { status: 500 },
    );
  }
}
