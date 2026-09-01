import { domToPng } from 'modern-screenshot';
import jsPDF from 'jspdf';

const PAGE_WIDTH_PX = 794;
const PAGE_HEIGHT_PX = 1123;

/**
 * Export the resume canvas to a proper A4 PDF.
 *
 * The canvas div lives inside a CSS `scale()` + `translate()` wrapper that
 * reflects the current zoom level. Capturing it directly via domToPng gives
 * a screenshot at whatever the current visual size is, which causes cropping
 * when the zoom is not exactly 1.
 *
 * Fix: clone the #resume-canvas node into a temporary off-screen container
 * that is positioned at exactly 794 × 1123 px with no transforms applied,
 * capture that clone, then tear it down.
 */
export async function exportCanvasToPdf(fileName: string = 'resume.pdf') {
  const source = document.getElementById('resume-canvas');
  if (!source) {
    console.error('[exportCanvasToPdf] #resume-canvas element not found');
    return;
  }

  // ------------------------------------------------------------------
  // 1. Build an off-screen host that is exactly A4 in size and has no
  //    transforms or overflow clipping from ancestor elements.
  // ------------------------------------------------------------------
  const host = document.createElement('div');
  Object.assign(host.style, {
    position: 'fixed',
    // Place well outside the viewport so it is never visible
    top: '-9999px',
    left: '-9999px',
    width: `${PAGE_WIDTH_PX}px`,
    height: `${PAGE_HEIGHT_PX}px`,
    overflow: 'visible',
    // Reset any inherited stacking / blend context
    transform: 'none',
    zoom: '1',
    opacity: '1',
    pointerEvents: 'none',
    zIndex: '-1',
  });

  // Deep-clone the source element, preserving its children and inline styles
  const clone = source.cloneNode(true) as HTMLElement;
  Object.assign(clone.style, {
    position: 'relative',
    width: `${PAGE_WIDTH_PX}px`,
    height: `${PAGE_HEIGHT_PX}px`,
    // Strip any box-shadow so it doesn't bleed into the capture
    boxShadow: 'none',
    transform: 'none',
  });

  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    // ------------------------------------------------------------------
    // 2. Capture the clone at 3× for a crisp high-res image
    // ------------------------------------------------------------------
    const dataUrl = await domToPng(clone, {
      quality: 1,
      scale: 3,
      backgroundColor: '#ffffff',
      // Tell modern-screenshot the exact logical dimensions so it never
      // tries to measure via getBoundingClientRect on a transformed node
      width: PAGE_WIDTH_PX,
      height: PAGE_HEIGHT_PX,
    });

    // ------------------------------------------------------------------
    // 3. Embed into a perfectly-sized A4 PDF (no margins)
    // ------------------------------------------------------------------
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4', // 210mm × 297mm
    });

    const pageWidthMm = pdf.internal.pageSize.getWidth();   // 210
    const pageHeightMm = pdf.internal.pageSize.getHeight(); // 297

    pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidthMm, pageHeightMm);
    pdf.save(fileName);
  } catch (err) {
    console.error('[exportCanvasToPdf] Export failed:', err);
  } finally {
    // ------------------------------------------------------------------
    // 4. Always clean up the temporary DOM node
    // ------------------------------------------------------------------
    document.body.removeChild(host);
  }
}
