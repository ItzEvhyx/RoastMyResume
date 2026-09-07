import { NextRequest, NextResponse } from 'next/server';
import { fetchIconSvg } from '@/app/core/services/iconify';

export const runtime = 'nodejs';

// Minimal fallback SVG so the browser never displays a broken image icon
const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9" opacity="0.3"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id') ?? searchParams.get('iconId');
  const prefix = searchParams.get('prefix') ?? 'mdi';
  const name = searchParams.get('name');

  let iconId = id;
  if (!iconId && name) {
    iconId = `${prefix}:${name}`;
  }

  if (!iconId) {
    return new NextResponse(FALLBACK_SVG, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  try {
    const svg = await fetchIconSvg(iconId);
    if (svg) {
      return new NextResponse(svg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  } catch (err) {
    console.error(`[/api/icons/svg] Failed to load "${iconId}":`, err);
  }

  // Graceful fallback SVG instead of 404 or broken image
  return new NextResponse(FALLBACK_SVG, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
