/** Client-safe AI rate-limit constants + types (no Admin SDK). */

export const AI_DAILY_LIMIT = 3;

export type AiRateFeature = 'roast' | 'help' | 'job_match' | 'ats_check';

export const AI_RATE_FEATURES: AiRateFeature[] = [
  'roast',
  'help',
  'job_match',
  'ats_check',
];

export const AI_RATE_ADMIN_EMAILS = new Set([
  'evhyyy7@gmail.com',
  'subayhvhan@gmail.com',
]);

export type AiRateBucket = {
  day: string;
  used: number;
};

export type AiRateStatus = {
  feature: AiRateFeature;
  limit: number;
  used: number;
  remaining: number;
  unlimited: boolean;
  day: string;
};

export function isAiRateAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return AI_RATE_ADMIN_EMAILS.has(email.trim().toLowerCase());
}

export function normalizeEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes('@')) return null;
  return trimmed;
}
