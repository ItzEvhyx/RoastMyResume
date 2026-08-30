import { domToPng } from 'modern-screenshot';
import jsPDF from 'jspdf';

/**
 * Export the resume canvas to PDF as proper A4
 * Canvas: 794px × 1123px (A4 ratio at 96 DPI)
 * PDF: 210mm × 297mm (standard A4)
 */
export async function exportCanvasToPdf(fileName: string = 'resume.pdf') {
  const canvas = document.getElementById('resume-canvas');
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  try {
    // Capture canvas at high resolution
    const dataUrl = await domToPng(canvas, {
      quality: 1,
      scale: 3, // High quality capture
      backgroundColor: '#ffffff',
    });

    // Create A4 PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4', // Exactly 210mm × 297mm
    });

    // Get A4 dimensions
    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Add image to fill the entire page
    pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidth, pageHeight);

    // Save
    pdf.save(fileName);
  } catch (error) {
    console.error('Failed to export PDF:', error);
  }
}
