import { jsPDF } from 'jspdf';
import { PDF_PAGE, PDF_SPACING, PDF_COLORS, hexToRgb } from './pdfStyles';
import { addCoverPage } from './sections/coverPage';
import { addPromptSection } from './sections/promptSection';
import { addReasoningSection } from './sections/reasoningSection';
import { addReviewSection } from './sections/reviewSection';
import { addSynthesisSection } from './sections/synthesisSection';
import type { FullSessionData } from '@/types';

export interface PdfGeneratorOptions {
  sessionData: FullSessionData;
  includeReasoning?: boolean;
  includeReview?: boolean;
}

/**
 * Generates a comprehensive PDF report for a council deliberation session
 */
export async function generateSessionReport(options: PdfGeneratorOptions): Promise<Blob> {
  const { sessionData, includeReasoning = true, includeReview = true } = options;

  // Create PDF document (A4 size)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // 1. Cover Page
  await addCoverPage(doc, {
    session: sessionData.session,
    run: sessionData.run,
  });

  // 2. Table of Contents
  doc.addPage();
  addTableOfContents(doc, {
    hasPrompt: !!sessionData.prompt,
    hasReasoning: includeReasoning && sessionData.runModels.some(m => m.outputs?.some(o => o.phase === 2)),
    hasReview: includeReview && sessionData.peerReviews.length > 0,
    hasSynthesis: sessionData.runModels.some(m => m.outputs?.some(o => o.phase === 4)),
  });

  // 3. Prompt Section
  doc.addPage();
  addPromptSection(doc, {
    prompt: sessionData.prompt,
    councilConfig: sessionData.run?.council_config || null,
  }, PDF_SPACING.pageMargin);

  // 4. Reasoning Section (if enabled)
  if (includeReasoning) {
    doc.addPage();
    addReasoningSection(doc, {
      runModels: sessionData.runModels,
    }, PDF_SPACING.pageMargin);
  }

  // 5. Review Section (if enabled)
  if (includeReview && sessionData.peerReviews.length > 0) {
    doc.addPage();
    addReviewSection(doc, {
      runModels: sessionData.runModels,
      peerReviews: sessionData.peerReviews,
    }, PDF_SPACING.pageMargin);
  }

  // 6. Synthesis Section
  doc.addPage();
  addSynthesisSection(doc, {
    runModels: sessionData.runModels,
  }, PDF_SPACING.pageMargin);

  // 7. Add page numbers to all pages
  addPageNumbers(doc);

  // Return as Blob
  return doc.output('blob');
}

/**
 * Adds table of contents
 */
function addTableOfContents(
  doc: jsPDF,
  sections: {
    hasPrompt: boolean;
    hasReasoning: boolean;
    hasReview: boolean;
    hasSynthesis: boolean;
  }
): void {
  const margin = PDF_SPACING.pageMargin;
  let y = margin;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...hexToRgb(PDF_COLORS.navy));
  doc.text('Table of Contents', margin, y);
  y += 3;

  // Underline
  doc.setDrawColor(...hexToRgb(PDF_COLORS.teal));
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 60, y);
  y += 20;

  // Contents
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);

  const items = [
    { num: '1', title: 'Prompt & Configuration', enabled: sections.hasPrompt },
    { num: '2', title: 'Reasoning Phase', enabled: sections.hasReasoning },
    { num: '3', title: 'Peer Review Phase', enabled: sections.hasReview },
    { num: '4', title: 'Synthesis', enabled: sections.hasSynthesis },
  ];

  items.forEach((item) => {
    if (item.enabled) {
      doc.setTextColor(...hexToRgb(PDF_COLORS.teal));
      doc.text(item.num + '.', margin, y);

      doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
      doc.text(item.title, margin + 10, y);

      // Dotted line to page (decorative)
      doc.setDrawColor(...hexToRgb(PDF_COLORS.borderLight));
      doc.setLineDashPattern([1, 1], 0);
      doc.line(margin + 10 + doc.getTextWidth(item.title) + 5, y, PDF_PAGE.width - margin - 20, y);
      doc.setLineDashPattern([], 0);

      y += 12;
    }
  });
}

/**
 * Adds page numbers to all pages
 */
function addPageNumbers(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Skip cover page
    if (i === 1) continue;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
    doc.text(
      `Page ${i} of ${pageCount}`,
      PDF_PAGE.width / 2,
      PDF_PAGE.height - 10,
      { align: 'center' }
    );

    // Header line on content pages
    if (i > 1) {
      doc.setDrawColor(...hexToRgb(PDF_COLORS.borderLight));
      doc.setLineWidth(0.2);
      doc.line(PDF_SPACING.pageMargin, 12, PDF_PAGE.width - PDF_SPACING.pageMargin, 12);
    }
  }
}

/**
 * Downloads a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates filename for the report
 */
export function generateReportFilename(sessionTitle: string | null, createdAt: string): string {
  const date = new Date(createdAt).toISOString().split('T')[0];
  const sanitizedTitle = sessionTitle
    ? sessionTitle.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
    : 'session';
  return `council-report-${sanitizedTitle}-${date}.pdf`;
}
