import { NextRequest, NextResponse } from 'next/server';
import { seedTemplatesToFirestore } from '@/app/features/resume_templates/firestore';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/templates/seed
 * Upserts all code-defined resume templates into Firestore `templates/{id}`.
 */
export async function POST(req: NextRequest) {
  const seedSecret = process.env.SEED_SECRET;
  if (seedSecret) {
    const authHeader = req.headers.get('x-seed-secret');
    if (authHeader !== seedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await seedTemplatesToFirestore();
    return NextResponse.json({
      summary: {
        written: result.written.length,
        errors: result.errors.length,
      },
      ...result,
    });
  } catch (err) {
    console.error('[api/templates/seed]', err);
    return NextResponse.json(
      { error: 'Failed to seed templates.' },
      { status: 500 },
    );
  }
}

/*
Suggested Firestore rules (merge with existing):

match /templates/{templateId} {
  allow read: if true;
  allow write: if false; // seed via server with open rules during setup, or Admin SDK
}

For local/dev parity with icons seed (client SDK writes):
match /templates/{templateId} {
  allow read, write: if true;
}
*/
