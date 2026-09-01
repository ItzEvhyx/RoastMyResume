/**
 * Iconify service — server-side only.
 *
 * Two responsibilities:
 *  1. ICON_LIST  — the 50 most common resume icons, pre-defined so the seed
 *                  route can warm the Cloudinary + Firestore cache on first deploy.
 *  2. fetchIconSvg()   — fetch a single icon's SVG from the Iconify REST API.
 *  3. searchIcons()    — full-text icon search against api.iconify.design,
 *                        used by the /api/icons/search route to give users
 *                        access to the entire Iconify catalogue.
 *
 * Iconify REST API docs: https://iconify.design/docs/api/
 * SVG endpoint:  https://api.iconify.design/{prefix}/{name}.svg
 * Search endpoint: https://api.iconify.design/search?query=…
 */

const ICONIFY_BASE = 'https://api.iconify.design';

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
  /** Direct SVG URL from Iconify CDN — usable without caching */
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
 * Convert an iconId ("mdi:account-outline") to the Iconify SVG endpoint URL.
 */
export function iconIdToSvgUrl(iconId: string): string {
  const [prefix, name] = iconId.split(':');
  return `${ICONIFY_BASE}/${prefix}/${name}.svg`;
}

/**
 * Fetch the raw SVG markup for a single icon.
 * Returns null if the icon is not found (404) instead of throwing.
 */
export async function fetchIconSvg(iconId: string): Promise<string | null> {
  const url = iconIdToSvgUrl(iconId);

  const res = await fetch(url, {
    // Revalidate every 7 days — icons don't change
    next: { revalidate: 60 * 60 * 24 * 7 },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Iconify fetch failed for "${iconId}": ${res.status} ${res.statusText}`);
  }

  const text = await res.text();

  // Iconify returns the literal string "404" (not a 404 status) for unknown icons
  if (text.trim() === '404') return null;

  return text;
}

/**
 * Search the full Iconify catalogue.
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
  const params = new URLSearchParams({
    query,
    limit: String(Math.min(limit, 999)),
  });
  if (prefixes) params.set('prefixes', prefixes);

  const url = `${ICONIFY_BASE}/search?${params.toString()}`;

  const res = await fetch(url, {
    // Search results can be cached briefly — 5 min
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Iconify search failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as {
    icons: string[];       // ["mdi:account", ...]
    total: number;
    limit: number;
    start: number;
  };

  const icons: IconifySearchResult[] = (data.icons ?? []).map((iconId) => {
    const [prefix, name] = iconId.split(':');
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
