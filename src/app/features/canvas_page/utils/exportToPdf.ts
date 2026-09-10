import { domToJpeg } from 'modern-screenshot';
import jsPDF from 'jspdf';

const PAGE_WIDTH_PX = 794;
const PAGE_HEIGHT_PX = 1123;

/** ~144 DPI — crisp on screen and print without the cost of a 2× PNG. */
const CAPTURE_SCALE = 1.5;
const JPEG_QUALITY = 0.92;

function needsSvgXmlDecodeFix(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /firefox/i.test(ua) || (/safari/i.test(ua) && !/chrome|chromium|android/i.test(ua));
}

/**
 * Export the resume canvas to a proper A4 PDF.
 *
 * The canvas lives inside a CSS `scale()` + `translate()` zoom wrapper.
 * We clone `#resume-canvas` into an off-screen A4 host (no transforms),
 * rasterize with modern-screenshot, then wrap the image in jsPDF.
 */
export async function exportCanvasToPdf(fileName: string = 'resume.pdf') {
  const source = document.getElementById('resume-canvas');
  if (!source) {
    console.error('[exportCanvasToPdf] #resume-canvas element not found');
    return;
  }

  // Let React paint "Exporting..." before the heavy capture work.
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  const host = document.createElement('div');
  Object.assign(host.style, {
    position: 'fixed',
    top: '-9999px',
    left: '-9999px',
    width: `${PAGE_WIDTH_PX}px`,
    height: `${PAGE_HEIGHT_PX}px`,
    overflow: 'visible',
    transform: 'none',
    zoom: '1',
    opacity: '1',
    pointerEvents: 'none',
    zIndex: '-1',
  });

  const clone = source.cloneNode(true) as HTMLElement;
  Object.assign(clone.style, {
    position: 'relative',
    width: `${PAGE_WIDTH_PX}px`,
    height: `${PAGE_HEIGHT_PX}px`,
    boxShadow: 'none',
    transform: 'none',
  });

  // Selection chrome / toolbars are already tagged — strip them only.
  clone.querySelectorAll('[data-no-export="true"]').forEach((el) => el.remove());

  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    const dataUrl = await domToJpeg(clone, {
      quality: JPEG_QUALITY,
      scale: CAPTURE_SCALE,
      backgroundColor: '#ffffff',
      width: PAGE_WIDTH_PX,
      height: PAGE_HEIGHT_PX,
      // Prefer compact font payloads when embedding web fonts.
      font: { preferredFormat: 'woff2' },
      // Chromium does not need the Safari/Firefox SVG decode stall (~100ms × images).
      features: {
        fixSvgXmlDecode: needsSvgXmlDecodeFix(),
        copyScrollbar: false,
      },
      filter: (node) =>
        !(
          node instanceof Element &&
          node.getAttribute('data-no-export') === 'true'
        ),
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidthMm = pdf.internal.pageSize.getWidth();
    const pageHeightMm = pdf.internal.pageSize.getHeight();

    pdf.addImage(dataUrl, 'JPEG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST');
    pdf.save(fileName);
  } catch (err) {
    console.error('[exportCanvasToPdf] Export failed:', err);
    throw err;
  } finally {
    host.remove();
  }
}
