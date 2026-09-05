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

export interface PdfExportOptions {
  format?: 'a4' | 'a6';
  headerTitle?: string;
  patientName?: string;
  scale?: number;
  addPageNumbers?: boolean;
}

/**
 * Scans canvas pixel rows upwards from endY down to startY
 * to find the center of the best consecutive band of empty/white rows.
 * This guarantees we never slice through characters of text, table rows, or buttons.
 */
function findBestBreakRow(
  ctx: CanvasRenderingContext2D,
  width: number,
  startY: number,
  endY: number
): number {
  if (startY >= endY) return endY;

  const bandHeight = Math.min(endY - startY, 700);
  const topY = Math.max(0, endY - bandHeight);

  let imgData: ImageData;
  try {
    imgData = ctx.getImageData(0, topY, width, bandHeight);
  } catch (err) {
    console.warn('Cannot read image data for smart break, fallback to target', err);
    return endY;
  }

  const data = imgData.data;
  const step = 4; // Sample every 4th pixel for speed
  const startX = Math.round(width * 0.06);
  const endX = Math.round(width * 0.94);

  let maxConsecutiveWhite = 0;
  let currentConsecutiveWhite = 0;
  let bestBandCenter = -1;

  for (let row = bandHeight - 1; row >= 0; row--) {
    let isRowWhite = true;
    const rowOffset = row * width * 4;

    for (let x = startX; x < endX; x += step) {
      const idx = rowOffset + x * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Non-white or non-transparent pixel
      if (a > 30 && (r < 242 || g < 242 || b < 242)) {
        isRowWhite = false;
        break;
      }
    }

    if (isRowWhite) {
      currentConsecutiveWhite++;
      if (currentConsecutiveWhite > maxConsecutiveWhite) {
        maxConsecutiveWhite = currentConsecutiveWhite;
        bestBandCenter = topY + row + Math.floor(currentConsecutiveWhite / 2);
      }
    } else {
      currentConsecutiveWhite = 0;
    }

    // A gap of 10+ pure white rows represents a clean paragraph/section boundary
    if (maxConsecutiveWhite >= 12) {
      return bestBandCenter;
    }
  }

  if (bestBandCenter > 0 && maxConsecutiveWhite >= 3) {
    return bestBandCenter;
  }

  return endY;
}

/**
 * Export an HTML DOM element to a crisp multi-page or single-page A4 or A6 PDF
 * with offscreen sandboxing, smart whitespace-aware slicing, standard typography scaling,
 * running headers, and page numbering.
 */
export async function exportElementToPdf(
  element: HTMLElement, 
  filename: string,
  formatOrOptions: 'a4' | 'a6' | PdfExportOptions = 'a4'
): Promise<void> {
  const options: PdfExportOptions = typeof formatOrOptions === 'string'
    ? { format: formatOrOptions }
    : (formatOrOptions || {});

  const isA6 = options.format === 'a6';
  // Standard CSS pixels at 96 DPI: A4 is 794px wide, A6 is 397px wide
  const targetWidthPx = isA6 ? 397 : 794;
  const pageWidthMm = isA6 ? 105 : 210;
  const pageHeightMm = isA6 ? 148 : 297;

  // 1. Create a clean offscreen sandboxing container
  const sandbox = document.createElement('div');
  sandbox.style.position = 'fixed';
  sandbox.style.left = '-9999px';
  sandbox.style.top = '0';
  sandbox.style.width = `${targetWidthPx}px`;
  sandbox.style.backgroundColor = '#ffffff';
  sandbox.style.margin = '0';
  sandbox.style.padding = '0';
  sandbox.style.boxSizing = 'border-box';
  sandbox.style.overflow = 'visible';
  sandbox.style.zIndex = '-99999';

  const clone = element.cloneNode(true) as HTMLElement;

  // Strip on-screen preview decorations that ruin printed documents (borders, shadows, forced screen max-width)
  clone.style.width = `${targetWidthPx}px`;
  clone.style.maxWidth = `${targetWidthPx}px`;
  clone.style.minWidth = `${targetWidthPx}px`;
  clone.style.border = 'none';
  clone.style.outline = 'none';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';
  clone.style.margin = '0';
  clone.style.removeProperty('min-height');
  clone.style.backgroundColor = '#ffffff';

  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  try {
    // 2. Wait for any images inside the document to finish loading
    const images = Array.from(clone.querySelectorAll('img'));
    await Promise.all(
      images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(res => {
          img.onload = res;
          img.onerror = res;
          setTimeout(res, 2500); // safety fallback
        });
      })
    );

    // Give browser a frame to finish layout calculations
    await new Promise(res => setTimeout(res, 60));

    // 3. High-resolution canvas capture
    const canvas = await html2canvas(clone, {
      scale: options.scale || 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: targetWidthPx,
      windowWidth: targetWidthPx,
    });

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas 2D context is not available');

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: isA6 ? 'a6' : 'a4',
      compress: true,
    });

    const totalHeightMm = (canvas.height * pageWidthMm) / canvas.width;

    // 4. Single-page document check:
    // With up to 8% tolerance (e.g. up to 320mm), fit onto 1 single page!
    // Prevents generating an ugly second page with a 2mm sliver or lone signature line.
    if (totalHeightMm <= pageHeightMm * 1.08) {
      const renderHeightMm = Math.min(pageHeightMm, totalHeightMm);
      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidthMm, renderHeightMm, undefined, 'FAST');
      pdf.save(filename);
      return;
    }

    // 5. Multi-page document calculation:
    // Page 1 has top padding built into its clinic header. Bottom reserved for footer.
    const bottomReservedMm = 14;
    const page1UsableMm = pageHeightMm - bottomReservedMm;
    const canvasPageHeight1 = Math.round((canvas.width * page1UsableMm) / pageWidthMm);

    // Subsequent pages have a running top header (14mm) and bottom footer (12mm)
    const topMarginMm = 14;
    const subsequentUsableMm = pageHeightMm - topMarginMm - 12;
    const canvasPageHeightSubsequent = Math.round((canvas.width * subsequentUsableMm) / pageWidthMm);

    interface PageSlice {
      startY: number;
      endY: number;
      isFirstPage: boolean;
    }

    const slices: PageSlice[] = [];
    let currentY = 0;
    const searchRangePx = Math.round(canvas.width * 0.28);

    while (currentY < canvas.height) {
      const isFirst = slices.length === 0;
      const usableCanvasHeight = isFirst ? canvasPageHeight1 : canvasPageHeightSubsequent;
      const remainingHeight = canvas.height - currentY;

      // If the remaining content fits on this page (with 5% tolerance)
      if (remainingHeight <= usableCanvasHeight * 1.05) {
        slices.push({
          startY: currentY,
          endY: canvas.height,
          isFirstPage: isFirst,
        });
        break;
      }

      // Otherwise, find the best non-breaking whitespace row
      const targetCutY = currentY + usableCanvasHeight;
      const minSearchY = Math.max(currentY + Math.round(usableCanvasHeight * 0.65), targetCutY - searchRangePx);
      const bestCutY = findBestBreakRow(ctx, canvas.width, minSearchY, targetCutY);

      // Ensure positive progress
      const finalCutY = Math.max(currentY + Math.round(usableCanvasHeight * 0.5), Math.min(bestCutY, targetCutY));

      slices.push({
        startY: currentY,
        endY: finalCutY,
        isFirstPage: isFirst,
      });

      currentY = finalCutY;
    }

    const totalPages = slices.length;

    // 6. Draw each slice onto its corresponding PDF page
    for (let i = 0; i < slices.length; i++) {
      const slice = slices[i];
      if (i > 0) {
        pdf.addPage();
      }

      const sliceHeight = slice.endY - slice.startY;
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeight;

      const sliceCtx = sliceCanvas.getContext('2d');
      if (sliceCtx) {
        sliceCtx.fillStyle = '#ffffff';
        sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        sliceCtx.drawImage(
          canvas,
          0,
          slice.startY,
          canvas.width,
          sliceHeight,
          0,
          0,
          sliceCanvas.width,
          sliceHeight
        );

        const imgData = sliceCanvas.toDataURL('image/jpeg', 0.96);
        const renderedHeightMm = (sliceHeight * pageWidthMm) / canvas.width;
        const topPositionMm = slice.isFirstPage ? 0 : topMarginMm;

        pdf.addImage(imgData, 'JPEG', 0, topPositionMm, pageWidthMm, renderedHeightMm, undefined, 'FAST');
      }

      // Add Running Header on Page 2+ (A4 only)
      if (!slice.isFirstPage && !isA6) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(140, 133, 123); // #8C857B
        pdf.text('SAY CLINIC  •  PLASTICKÁ CHIRURGIA & DERMATOLÓGIA', 15, 8);

        if (options.headerTitle || options.patientName) {
          const rightText = [options.headerTitle, options.patientName].filter(Boolean).join(' • ');
          pdf.text(rightText, pageWidthMm - 15, 8, { align: 'right' });
        }

        // Gold divider line
        pdf.setDrawColor(197, 160, 89); // #C5A059
        pdf.setLineWidth(0.35);
        pdf.line(15, 10, pageWidthMm - 15, 10);
      }

      // Add Running Footer on every page
      if (options.addPageNumbers !== false) {
        const footerY = pageHeightMm - 6.5;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(155, 150, 142);

        // Thin separator line
        pdf.setDrawColor(232, 226, 217); // #E8E2D9
        pdf.setLineWidth(0.25);
        pdf.line(15, pageHeightMm - 10, pageWidthMm - 15, pageHeightMm - 10);

        // Left: clinic info
        if (!isA6) {
          pdf.text('SAY CLINIC, Lazovná 43, Banská Bystrica  •  www.sayclinic.sk', 15, footerY);
        }

        // Right: Page number
        const pageText = totalPages > 1 
          ? `Strana ${i + 1} z ${totalPages}`
          : 'Strana 1 z 1';
        pdf.text(pageText, pageWidthMm - 15, footerY, { align: 'right' });
      }
    }

    pdf.save(filename);
  } finally {
    if (sandbox.parentNode) {
      sandbox.parentNode.removeChild(sandbox);
    }
  }
}

