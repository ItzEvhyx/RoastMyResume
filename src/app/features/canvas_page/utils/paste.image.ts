/**
 * OS clipboard → canvas photo helpers.
 * Clipboard images become data URLs on IconElements (same as Photos panel uploads).
 */

export const PASTE_IMAGE_DEFAULT_SIZE = 200;
export const PASTE_IMAGE_PAGE_WIDTH = 794;
export const PASTE_IMAGE_PAGE_HEIGHT = 1123;

/** True for raster data URLs we render as <img> (not SVG icon masks). */
export function isRasterImageUrl(url: string): boolean {
  return /^data:image\/(png|jpe?g|webp|gif|bmp)/i.test(url);
}

/** Pull the first image File from a paste/drop DataTransfer. */
export function getClipboardImageFile(
  data: DataTransfer | null | undefined,
): File | null {
  if (!data) return null;

  const fromItems = Array.from(data.items ?? [])
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .find((file): file is File => file !== null);
  if (fromItems) return fromItems;

  return (
    Array.from(data.files ?? []).find((file) =>
      file.type.startsWith('image/'),
    ) ?? null
  );
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read image from clipboard.'));
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error('Failed to read image from clipboard.'));
    reader.readAsDataURL(file);
  });
}

export type PasteImagePlacement = {
  /** Selected frame id — paste fills the frame instead of adding a free image. */
  selectedFrameId?: string | null;
  updateFrameImage?: (id: string, dataUrl: string) => void;
  addImage: (element: {
    x: number;
    y: number;
    size: number;
    width: number;
    height: number;
    isShape: false;
    svgUrl: string;
    color: string;
  }) => void;
  /** Optional canvas-space anchor (e.g. mobile paste pill). Defaults to page center. */
  anchorX?: number;
  anchorY?: number;
};

/** Convert a clipboard image file and place it on the canvas / into a frame. */
export async function placeClipboardImage(
  file: File,
  placement: PasteImagePlacement,
): Promise<void> {
  const dataUrl = await readFileAsDataUrl(file);

  if (placement.selectedFrameId && placement.updateFrameImage) {
    placement.updateFrameImage(placement.selectedFrameId, dataUrl);
    return;
  }

  const size = PASTE_IMAGE_DEFAULT_SIZE;
  const x =
    placement.anchorX !== undefined
      ? Math.round(placement.anchorX - size / 2)
      : Math.round((PASTE_IMAGE_PAGE_WIDTH - size) / 2);
  const y =
    placement.anchorY !== undefined
      ? Math.round(placement.anchorY - size / 2)
      : Math.round((PASTE_IMAGE_PAGE_HEIGHT - size) / 2);

  placement.addImage({
    x,
    y,
    size,
    width: size,
    height: size,
    isShape: false,
    svgUrl: dataUrl,
    color: '#000000',
  });
}
