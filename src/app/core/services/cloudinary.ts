/**
 * Cloudinary service — server-side only.
 *
 * Provides a single helper: uploadSvgToCloudinary()
 * Takes an SVG string, uploads it to Cloudinary under the
 * `icons/` folder, and returns the secure CDN URL.
 *
 * All credentials come from server-only env vars (no NEXT_PUBLIC_ prefix),
 * so this file must never be imported from client components.
 */

import { v2 as cloudinary } from 'cloudinary';

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary config is incomplete. ' +
        'Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local.'
    );
  }

  return { cloudName, apiKey, apiSecret };
}

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  configured = true;
}

export interface CloudinaryUploadResult {
  /** Fully-qualified HTTPS URL served from Cloudinary CDN */
  secureUrl: string;
  /** Cloudinary public_id — useful for deduplication / deletion */
  publicId: string;
}

/**
 * Upload an SVG string to Cloudinary.
 *
 * @param svgContent  Raw SVG markup
 * @param publicId    Desired public_id, e.g. "icons/mdi--account"
 *                    Cloudinary will use this as the stable identifier.
 *                    If the asset already exists it will be overwritten
 *                    (overwrite: true) so re-seeding is idempotent.
 */
export async function uploadSvgToCloudinary(
  svgContent: string,
  publicId: string
): Promise<CloudinaryUploadResult> {
  ensureConfigured();

  // Cloudinary's Node SDK accepts a data URI for raw uploads.
  // SVG must be base64-encoded and declared as image/svg+xml.
  const base64 = Buffer.from(svgContent, 'utf-8').toString('base64');
  const dataUri = `data:image/svg+xml;base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    public_id: publicId,
    resource_type: 'image',
    // Keep the SVG as-is — do not convert to PNG
    format: 'svg',
    overwrite: true,
    // Invalidate CDN cache on overwrite so stale assets don't linger
    invalidate: true,
    // Folder is implicit in the public_id prefix ("icons/...")
    use_filename: false,
    unique_filename: false,
  });

  return {
    secureUrl: result.secure_url,
    publicId: result.public_id,
  };
}
