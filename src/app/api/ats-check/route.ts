import { analyzeAtsCheck } from '@/app/core/services/claude';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface AtsCheckBody {
  canvasSnapshot?: unknown;
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

  try {
    const result = await analyzeAtsCheck({ canvasSnapshot });
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'ATS check failed.';
    console.error('[ats-check]', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
