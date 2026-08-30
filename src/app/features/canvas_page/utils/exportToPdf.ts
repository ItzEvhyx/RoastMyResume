import { domToPng } from 'modern-screenshot';
import jsPDF from 'jspdf';

/**
 * Export the resume canvas to PDF at 300 DPI
 * Canvas display: 794px × 1123px (96 DPI)
 * PDF export: A4 at 210mm × 297mm
 * Physical: 21.0cm × 29.7cm (A4)
 */
export async function exportCanvasToPdf(fileName: string = 'resume.pdf') {
  const canvas = document.getElementById('resume-canvas');
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  try {
    // Capture at high resolution (3.125× for 300 DPI equivalent)
    const dataUrl = await domToPng(canvas, {
      quality: 1,
      scale: 3.125,
      width: 794,
      height: 1123,
      backgroundColor: '#ffffff',
    });

    // Create PDF at exact A4 size
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4', // 210mm × 297mm
      compress: true,
    });

    // A4 dimensions in mm
    const pdfWidth = 210;
    const pdfHeight = 297;

    // Add image to fill entire A4 page
    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

    // Download
    pdf.save(fileName);
  } catch (error) {
    console.error('Failed to export PDF:', error);
  }
}
