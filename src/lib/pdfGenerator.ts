import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Remove diacritics and clean a string for safe filenames
 */
export function sanitizeFilename(str: string): string {
  if (!str) return 'Dokument';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-zA-Z0-9_-]/g, '_') // replace non-alphanumeric with underscore
    .replace(/_+/g, '_') // collapse multiple underscores
    .replace(/^_|_$/g, ''); // trim leading/trailing underscores
}

/**
 * Generate standardized filename: SAY_[DocType]_[PatientName]_[YYYY-MM-DD].pdf
 */
export function generatePdfFilename(docTypeTitle: string, patientName?: string, dateStr?: string): string {
  const safeDocType = sanitizeFilename(docTypeTitle || 'Dokument');
  const safePatient = sanitizeFilename(patientName || 'Pacient');
  const formattedDate = dateStr ? dateStr.replace(/\//g, '-').replace(/\./g, '-') : new Date().toISOString().split('T')[0];
  const safeDate = sanitizeFilename(formattedDate);

  return `SAY_${safeDocType}_${safePatient}_${safeDate}.pdf`;
}

/**
 * Export an HTML DOM element to a crisp multi-page or single-page A4 PDF
 */
export async function exportElementToPdf(element: HTMLElement, filename: string): Promise<void> {
  // Store original styles to restore later if needed
  const canvas = await html2canvas(element, {
    scale: 2.5, // High resolution capture
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth || 800,
  });

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const margin = 0; // border-to-border layout matching preview
  
  const contentWidth = pageWidth - (margin * 2);
  const contentHeight = (canvas.height * contentWidth) / canvas.width;

  // If content fits on one page (with slight tolerance)
  if (contentHeight <= pageHeight) {
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight, undefined, 'FAST');
  } else {
    // Multi-page slicing
    const totalPages = Math.ceil(contentHeight / pageHeight);
    const canvasPageHeight = (canvas.width * pageHeight) / contentWidth;

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      // Create a temporary canvas for the single page chunk
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = Math.min(canvasPageHeight, canvas.height - (page * canvasPageHeight));

      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        
        ctx.drawImage(
          canvas,
          0,
          page * canvasPageHeight, // source Y
          canvas.width,
          pageCanvas.height, // source height
          0,
          0, // dest X, Y
          pageCanvas.width,
          pageCanvas.height // dest width, height
        );

        const pageImgData = pageCanvas.toDataURL('image/png');
        const renderedHeight = (pageCanvas.height * contentWidth) / pageCanvas.width;
        pdf.addImage(pageImgData, 'PNG', margin, margin, contentWidth, renderedHeight, undefined, 'FAST');
      }
    }
  }

  pdf.save(filename);
}
