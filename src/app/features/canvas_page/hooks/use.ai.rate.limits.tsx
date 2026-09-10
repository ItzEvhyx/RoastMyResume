'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthUser } from '@/app/core/session/session';
import {
  AI_DAILY_LIMIT,
  type AiRateFeature,
  type AiRateStatus,
} from '@/app/core/services/ratelimit.shared';

export type { AiRateFeature, AiRateStatus };
export { AI_DAILY_LIMIT };

type FeaturesMap = Partial<Record<AiRateFeature, AiRateStatus>>;

function authHeaders(email: string | null | undefined): HeadersInit {
  if (!email) return {};
  return { 'x-user-email': email };
}

/** Shared client headers for AI API calls (rate-limit identity). */
export function aiRequestHeaders(email: string | null | undefined): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...authHeaders(email),
  };
}

export function useAiRateLimits(feature?: AiRateFeature) {
  const user = useAuthUser();
  const email = user?.email ?? null;
  const [features, setFeatures] = useState<FeaturesMap>({});
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!email) {
      setFeatures({});
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/rate-limits?email=${encodeURIComponent(email)}`,
        { headers: authHeaders(email) },
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        features?: AiRateStatus[];
      };
      const next: FeaturesMap = {};
      for (const row of data.features ?? []) {
        next[row.feature] = row;
      }
      setFeatures(next);
    } catch (err) {
      console.warn('[useAiRateLimits]', err);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const status = feature ? features[feature] : undefined;
  const remaining = status?.unlimited
    ? AI_DAILY_LIMIT
    : (status?.remaining ?? (email ? AI_DAILY_LIMIT : 0));
  const unlimited = Boolean(status?.unlimited);
  const exhausted = Boolean(email && !unlimited && remaining <= 0);

  const applyStatus = useCallback((row: AiRateStatus) => {
    setFeatures((prev) => ({ ...prev, [row.feature]: row }));
  }, []);

  return {
    email,
    features,
    status,
    remaining,
    unlimited,
    exhausted,
    loading,
    limit: AI_DAILY_LIMIT,
    refresh,
    applyStatus,
  };
}

/** Compact “N left today” label for assist panel headers. */
export function AiUsageBadge({
  remaining,
  limit,
  unlimited,
}: {
  remaining: number;
  limit: number;
  unlimited?: boolean;
}) {
  if (unlimited) {
    return (
      <span
        className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-white/55"
        style={{ fontFamily: 'var(--font-poppins)' }}
      >
        Unlimited
      </span>
    );
  }

  const left = Math.max(0, remaining);
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
        left <= 0
          ? 'border-red-400/30 bg-red-500/10 text-red-300'
          : 'border-white/15 bg-white/5 text-white/60'
      }`}
      style={{ fontFamily: 'var(--font-poppins)' }}
      title={`${left} of ${limit} uses left today`}
    >
      {left}/{limit} left today
    </span>
  );
}
