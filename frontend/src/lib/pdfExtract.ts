/**
 * PDF text extraction utility
 * - Uses PDF.js for text-based PDFs (fast)
 * - Falls back to Tesseract.js OCR for scanned/image-based PDFs
 */
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import Tesseract from 'tesseract.js';

// Configure PDF.js worker from npm package
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Minimum characters to consider PDF.js extraction successful
const MIN_TEXT_THRESHOLD = 100;

// Max pages to process for OCR (it's slow)
const MAX_OCR_PAGES = 10;

/**
 * Extract text content from a PDF file
 * First tries PDF.js (fast), falls back to OCR if needed (slow but works for scanned PDFs)
 */
export async function extractPdfText(
  file: File,
  onProgress?: (status: string) => void
): Promise<string> {
  try {
    onProgress?.('Loading PDF...');
    console.log(`[PDF Extract] Starting extraction for: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);

    const arrayBuffer = await file.arrayBuffer();
    console.log(`[PDF Extract] File loaded into memory`);

    // Load PDF
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    console.log(`[PDF Extract] PDF loaded, pages: ${pdf.numPages}`);

    // First, try PDF.js text extraction (works for text-based PDFs)
    onProgress?.('Scanning for text...');
    let pdfJsText = '';
    try {
      pdfJsText = await extractWithPdfJs(pdf);
      console.log(`[PDF Extract] PDF.js returned ${pdfJsText.length} chars`);
    } catch (err) {
      console.error('[PDF Extract] PDF.js extraction failed:', err);
    }

    // If we got enough text, use it
    if (pdfJsText.length > 0) {
      console.log(`[PDF Extract] PDF.js extracted ${pdfJsText.length} chars - using text extraction`);
      onProgress?.('Text extracted successfully');
      return pdfJsText;
    }

    // Otherwise, fall back to OCR for scanned PDFs
    console.log(`[PDF Extract] No text from PDF.js - PDF appears to be scanned, trying OCR`);
    onProgress?.('PDF is scanned/image-based. Starting OCR (this may take a while)...');

    let ocrText = '';
    try {
      ocrText = await extractWithOcr(pdf, onProgress);
    } catch (err) {
      console.error('[PDF Extract] OCR extraction failed:', err);
    }

    if (ocrText.length > pdfJsText.length) {
      console.log(`[PDF Extract] OCR extracted ${ocrText.length} chars - using OCR result`);
      onProgress?.('OCR complete');
      return ocrText;
    }

    // Return whatever we got
    const result = pdfJsText || ocrText;
    console.log(`[PDF Extract] Final result: ${result.length} chars`);
    return result;

  } catch (error) {
    console.error('[PDF Extract] Failed:', error);
    onProgress?.('Extraction failed');
    return '';
  }
}

/**
 * Extract text using PDF.js (fast, text-based PDFs only)
 */
async function extractWithPdfJs(pdf: pdfjsLib.PDFDocumentProxy): Promise<string> {
  const textParts: string[] = [];
  const maxPages = Math.min(pdf.numPages, 50);
  let totalChars = 0; // Track actual text chars, not page markers

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (pageText && pageText.length > 0) {
        totalChars += pageText.length;
        textParts.push(`[Page ${pageNum}]\n${pageText}`);
        console.log(`[PDF.js] Page ${pageNum}: ${pageText.length} chars`);
      } else {
        console.log(`[PDF.js] Page ${pageNum}: no text`);
      }
    } catch (err) {
      console.warn(`[PDF.js] Failed page ${pageNum}:`, err);
    }
  }

  console.log(`[PDF.js] Total extracted: ${totalChars} chars from ${textParts.length} pages`);

  // Return empty if we didn't get meaningful text (this triggers OCR fallback)
  if (totalChars < MIN_TEXT_THRESHOLD) {
    return '';
  }

  if (pdf.numPages > maxPages) {
    textParts.push(`\n[... ${pdf.numPages - maxPages} more pages ...]`);
  }

  return textParts.join('\n\n');
}

/**
 * Extract text using Tesseract OCR (slow, but works for scanned PDFs)
 */
async function extractWithOcr(
  pdf: pdfjsLib.PDFDocumentProxy,
  onProgress?: (status: string) => void
): Promise<string> {
  const textParts: string[] = [];
  const maxPages = Math.min(pdf.numPages, MAX_OCR_PAGES);

  console.log(`[OCR] Starting OCR for ${maxPages} pages`);
  onProgress?.('Initializing OCR engine...');

  // Create a canvas for rendering
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('[OCR] Could not create canvas context');
    return '';
  }

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    try {
      onProgress?.(`OCR processing page ${pageNum}/${maxPages}...`);
      console.log(`[OCR] Processing page ${pageNum}/${maxPages}`);

      const page = await pdf.getPage(pageNum);

      // Render at 2x scale for better OCR accuracy
      const scale = 2;
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Clear canvas before rendering
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render PDF page to canvas
      console.log(`[OCR] Rendering page ${pageNum} to canvas (${canvas.width}x${canvas.height})`);
      await page.render({
        canvasContext: ctx,
        viewport: viewport,
        canvas: canvas,
      }).promise;
      console.log(`[OCR] Page ${pageNum} rendered successfully`);

      // Run OCR on the rendered image
      console.log(`[OCR] Running Tesseract on page ${pageNum}...`);
      const result = await Tesseract.recognize(canvas, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const progress = Math.round((m.progress || 0) * 100);
            onProgress?.(`OCR page ${pageNum}/${maxPages}: ${progress}%`);
          } else if (m.status === 'loading tesseract core' || m.status === 'loading language traineddata') {
            onProgress?.(`Loading OCR engine...`);
          }
        },
      });

      const pageText = result.data.text.trim();
      console.log(`[OCR] Page ${pageNum} extracted ${pageText.length} chars`);
      if (pageText) {
        textParts.push(`[Page ${pageNum}]\n${pageText}`);
      }

    } catch (err) {
      console.error(`[OCR] Failed page ${pageNum}:`, err);
    }
  }

  if (pdf.numPages > maxPages) {
    textParts.push(`\n[... ${pdf.numPages - maxPages} more pages not processed (OCR limit) ...]`);
  }

  const totalText = textParts.join('\n\n');
  console.log(`[OCR] Total extracted: ${totalText.length} chars from ${textParts.length} pages`);
  return totalText;
}

/**
 * Check if a file is a PDF
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
