import { NextRequest, NextResponse } from 'next/server';
import { sendOtpEmail } from '@/app/core/services/gmail.smtp';

// In-memory OTP storage with TTL
interface OtpRecord {
  otp: string;
  expiresAt: number;
  lastSentAt: number;
  attempts: number;
}

// Global store across hot-reloads during dev
const globalForOtp = global as unknown as {
  otpStore?: Map<string, OtpRecord>;
};

const otpStore = globalForOtp.otpStore || new Map<string, OtpRecord>();
if (process.env.NODE_ENV !== 'production') {
  globalForOtp.otpStore = otpStore;
}

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 15 * 1000; // 15 seconds cooldown

function generate6DigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, otp } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. ACTION: SEND / RESEND OTP
    if (action === 'send' || action === 'resend') {
      const existing = otpStore.get(normalizedEmail);
      const now = Date.now();

      // Check resend cooldown
      if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
        const remainingSec = Math.ceil(
          (RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000
        );
        return NextResponse.json(
          { error: `Please wait ${remainingSec}s before requesting another code.` },
          { status: 429 }
        );
      }

      const newOtp = generate6DigitOtp();
      otpStore.set(normalizedEmail, {
        otp: newOtp,
        expiresAt: now + OTP_EXPIRY_MS,
        lastSentAt: now,
        attempts: 0,
      });

      // Send email via Gmail SMTP
      await sendOtpEmail(normalizedEmail, newOtp);

      if (process.env.NODE_ENV !== 'production') {
        console.log(`\x1b[32m[RoastMyResume OTP] Verification code for ${normalizedEmail}: ${newOtp}\x1b[0m`);
      }

      return NextResponse.json({
        success: true,
        message: `Verification code sent to ${normalizedEmail}`,
      });
    }

    // 2. ACTION: VERIFY OTP
    if (action === 'verify') {
      if (!otp || typeof otp !== 'string') {
        return NextResponse.json(
          { error: 'Verification code is required' },
          { status: 400 }
        );
      }

      const record = otpStore.get(normalizedEmail);
      const now = Date.now();

      if (!record) {
        return NextResponse.json(
          { error: 'No verification code found. Please request a new code.' },
          { status: 400 }
        );
      }

      if (now > record.expiresAt) {
        otpStore.delete(normalizedEmail);
        return NextResponse.json(
          { error: 'Verification code has expired. Please request a new code.' },
          { status: 400 }
        );
      }

      if (record.attempts >= 5) {
        otpStore.delete(normalizedEmail);
        return NextResponse.json(
          { error: 'Too many incorrect attempts. Please request a new code.' },
          { status: 429 }
        );
      }

      const inputOtp = otp.trim();
      if (inputOtp !== record.otp) {
        record.attempts += 1;
        return NextResponse.json(
          { error: 'Invalid verification code. Please check and try again.' },
          { status: 400 }
        );
      }

      // Successful verification
      otpStore.delete(normalizedEmail);

      return NextResponse.json({
        success: true,
        message: 'Email successfully verified',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: send, verify' },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error('OTP route error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
