import { NextRequest, NextResponse } from 'next/server';
import { getClientFirestore } from '@/app/core/services/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * POST /api/auth/signin
 *
 * Validates sign-in credentials against the Firestore `users` collection.
 * Uses the client Firestore SDK (no Admin private key required).
 *
 * Body: { email: string, password: string }
 *
 * Returns:
 *   200 { success: true, user: { email } }
 *   400 { error: "..." }   — missing fields
 *   401 { error: "..." }   — bad credentials
 *   404 { error: "..." }   — email not found
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = getClientFirestore();

    // Look up user document by email (document ID = email)
    const userRef = doc(db, 'users', normalizedEmail);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: 'Email does not exist, please sign-up first' },
        { status: 404 }
      );
    }

    const userData = userSnap.data();

    // Validate password
    if (!userData?.password || userData.password !== password) {
      return NextResponse.json(
        { error: 'Email or Password is incorrect, please try again' },
        { status: 401 }
      );
    }

    // Credentials are valid
    return NextResponse.json({
      success: true,
      user: { email: normalizedEmail },
    });
  } catch (error: unknown) {
    console.error('[Auth Sign-in] Error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
