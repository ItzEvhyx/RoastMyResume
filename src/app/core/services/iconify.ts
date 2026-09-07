/**
 * Iconify service — server-side and client-compatible helpers.
 *
 * Responsibilities:
 *  1. TOP_50_RESUME_ICONS — pre-defined common resume icons for caching & seed.
 *  2. fetchIconSvg()      — ultra-resilient multi-tier SVG fetcher:
 *                            - In-memory cache
 *                            - Direct Iconify REST API
 *                            - Iconify JSON batch endpoint
 *                            - jsdelivr CDN fallbacks
 *  3. searchIcons()       — full-text search with fallback to local icon catalogue.
 *  4. iconIdToSvgUrl()    — resolves icon IDs to our robust local SVG endpoint (/api/icons/svg).
 */

const ICONIFY_BASE = 'https://api.iconify.design';

// In-memory cache for loaded SVGs to prevent duplicate network hits
const svgMemoryCache = new Map<string, string>();

// ---------------------------------------------------------------------------
// Top-50 resume icons
// Format: "<prefix>:<name>" — maps 1-to-1 to the Iconify SVG URL
// ---------------------------------------------------------------------------
export const TOP_50_RESUME_ICONS: string[] = [
  // Contact / personal
  'mdi:email-outline',
  'mdi:phone-outline',
  'mdi:map-marker-outline',
  'mdi:linkedin',
  'mdi:github',
  'mdi:web',
  'mdi:twitter',
  'mdi:account-outline',

  // Work & education
  'mdi:briefcase-outline',
  'mdi:school-outline',
  'mdi:certificate-outline',
  'mdi:calendar-range',
  'mdi:office-building-outline',
  'mdi:human-male-board',
  'mdi:book-open-outline',
  'mdi:file-document-outline',

  // Skills & tools
  'mdi:code-tags',
  'mdi:language-javascript',
  'mdi:language-typescript',
  'mdi:language-python',
  'mdi:language-java',
  'mdi:react',
  'mdi:nodejs',
  'mdi:database-outline',
  'mdi:cloud-outline',
  'mdi:docker',
  'mdi:git',
  'mdi:aws',
  'mdi:microsoft-azure',
  'mdi:google-cloud',
  'mdi:linux',
  'mdi:microsoft-windows',

  // Soft skills / general
  'mdi:lightbulb-outline',
  'mdi:handshake-outline',
  'mdi:chart-line',
  'mdi:magnify',
  'mdi:rocket-launch-outline',
  'mdi:star-outline',
  'mdi:check-circle-outline',
  'mdi:trophy-outline',
  'mdi:medal-outline',
  'mdi:pencil-outline',
  'mdi:translate',
  'mdi:microphone-outline',
  'mdi:presentation',

  // Design & creative
  'mdi:palette-outline',
  'mdi:vector-pen',
  'mdi:camera-outline',
  'mdi:monitor-screenshot',
  'mdi:figma',
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IconifySearchResult {
  /** e.g. "mdi:account-outline" */
  iconId: string;
  /** Display-friendly name, e.g. "account-outline" */
  name: string;
  /** Icon set prefix, e.g. "mdi" */
  prefix: string;
  /** Local SVG proxy URL or direct SVG URL */
  svgUrl: string;
}

export interface IconifySearchResponse {
  icons: IconifySearchResult[];
  /** Total number of matching icons across all sets */
  total: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert an iconId ("mdi:account-outline") to the local SVG proxy endpoint URL.
 * This avoids client-side Cloudflare 429 rate limiting and CORS canvas-tainting issues.
 */
export function iconIdToSvgUrl(iconId: string): string {
  const parts = iconId.split(':');
  if (parts.length === 2) {
    return `/api/icons/svg?id=${encodeURIComponent(iconId)}`;
  }
  return `/api/icons/svg?id=${encodeURIComponent(`mdi:${iconId}`)}`;
}

/**
 * Fetch the raw SVG markup for a single icon.
 * Features a 4-tier fallback:
 *   1. Memory cache
 *   2. Direct Iconify SVG
 *   3. Iconify JSON endpoint (immune to SVG endpoint rate limits)
 *   4. jsdelivr CDNs
 */
export async function fetchIconSvg(iconId: string): Promise<string | null> {
  const normalizedId = iconId.trim();
  if (svgMemoryCache.has(normalizedId)) {
    return svgMemoryCache.get(normalizedId)!;
  }

  const parts = normalizedId.split(':');
  const prefix = parts.length === 2 ? parts[0] : 'mdi';
  const name = parts.length === 2 ? parts[1] : parts[0];

  if (!prefix || !name) return null;

  // Tier 1: Direct Iconify SVG
  try {
    const res = await fetch(`${ICONIFY_BASE}/${prefix}/${name}.svg`, {
      next: { revalidate: 60 * 60 * 24 * 7 },
      headers: { Accept: 'image/svg+xml' },
    });
    if (res.ok) {
      const text = await res.text();
      if (text.trim() && text.trim() !== '404' && text.includes('<svg')) {
        svgMemoryCache.set(normalizedId, text);
        return text;
      }
    }
  } catch (err) {
    // Continue to next tier
  }

  // Tier 2: Iconify JSON endpoint (often immune to SVG endpoint rate limits)
  try {
    const res = await fetch(`${ICONIFY_BASE}/${prefix}.json?icons=${encodeURIComponent(name)}`, {
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (res.ok) {
      const data = (await res.json()) as {
        width?: number;
        height?: number;
        icons?: Record<string, { body: string; width?: number; height?: number }>;
      };
      const iconData = data.icons?.[name];
      if (iconData?.body) {
        const width = iconData.width ?? data.width ?? 24;
        const height = iconData.height ?? data.height ?? 24;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 ${width} ${height}">${iconData.body}</svg>`;
        svgMemoryCache.set(normalizedId, svg);
        return svg;
      }
    }
  } catch (err) {
    // Continue to next tier
  }

  // Tier 3: jsdelivr MaterialDesign repo for mdi
  if (prefix === 'mdi') {
    try {
      const mdiRes = await fetch(`https://cdn.jsdelivr.net/gh/Templarian/MaterialDesign@master/svg/${encodeURIComponent(name)}.svg`, {
        next: { revalidate: 60 * 60 * 24 * 7 },
      });
      if (mdiRes.ok) {
        const text = await mdiRes.text();
        if (text.includes('<svg')) {
          svgMemoryCache.set(normalizedId, text);
          return text;
        }
      }
    } catch (err) {
      // Continue to next tier
    }
  }

  // Tier 4: @iconify-json npm package on jsdelivr
  try {
    const jsonRes = await fetch(`https://cdn.jsdelivr.net/npm/@iconify-json/${prefix}@1/icons.json`, {
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (jsonRes.ok) {
      const data = (await jsonRes.json()) as {
        width?: number;
        height?: number;
        icons?: Record<string, { body: string; width?: number; height?: number }>;
      };
      const iconData = data.icons?.[name];
      if (iconData?.body) {
        const width = iconData.width ?? data.width ?? 24;
        const height = iconData.height ?? data.height ?? 24;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 ${width} ${height}">${iconData.body}</svg>`;
        svgMemoryCache.set(normalizedId, svg);
        return svg;
      }
    }
  } catch (err) {
    // End of tiers
  }

  return null;
}

/**
 * Search the full Iconify catalogue with graceful local fallback.
 *
 * @param query    Free-text search term
 * @param limit    Max results to return (default 50, max 999)
 * @param prefixes Comma-separated set prefixes to restrict search, e.g. "mdi,heroicons"
 */
export async function searchIcons(
  query: string,
  limit = 50,
  prefixes?: string
): Promise<IconifySearchResponse> {
  const trimmed = query.trim().toLowerCase();

  try {
    const params = new URLSearchParams({
      query,
      limit: String(Math.min(limit, 999)),
    });
    if (prefixes) params.set('prefixes', prefixes);

    const url = `${ICONIFY_BASE}/search?${params.toString()}`;
    const res = await fetch(url, {
      next: { revalidate: 300 },
    });

    if (res.ok) {
      const data = (await res.json()) as {
        icons?: string[];
        total?: number;
      };

      const icons: IconifySearchResult[] = (data.icons ?? []).map((iconId) => {
        const parts = iconId.split(':');
        const prefix = parts[0];
        const name = parts[1] ?? parts[0];
        return {
          iconId,
          name,
          prefix,
          svgUrl: iconIdToSvgUrl(iconId),
        };
      });

      return {
        icons,
        total: data.total ?? icons.length,
      };
    }
  } catch (err) {
    console.warn('[iconify] remote search failed, using local fallback:', err);
  }

  // Fallback: search local TOP_50_RESUME_ICONS
  const matched = TOP_50_RESUME_ICONS.filter((id) => id.toLowerCase().includes(trimmed)).slice(0, limit);
  return {
    icons: matched.map((iconId) => {
      const parts = iconId.split(':');
      const prefix = parts[0];
      const name = parts[1] ?? parts[0];
      return {
        iconId,
        name,
        prefix,
        svgUrl: iconIdToSvgUrl(iconId),
      };
    }),
    total: matched.length,
  };
}
