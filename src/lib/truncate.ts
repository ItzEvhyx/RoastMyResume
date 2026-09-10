/** Truncate an email for compact chrome pills (first 6 chars + ellipsis). */
export function truncateEmail(email: string, maxChars = 6): string {
  const trimmed = email.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars)}…`;
}
