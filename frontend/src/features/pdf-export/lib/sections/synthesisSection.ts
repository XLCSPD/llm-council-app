import { jsPDF } from 'jspdf';
import {
  PDF_COLORS,
  PDF_FONT_SIZES,
  PDF_PAGE,
  PDF_SPACING,
  hexToRgb,
  ROLE_LABELS,
} from '../pdfStyles';
import { renderMarkdownToPdf } from '../markdownRenderer';
import type { FullSessionData } from '@/types';

interface SynthesisSectionData {
  runModels: FullSessionData['runModels'];
}

/**
 * Adds the synthesis section to the PDF
 * Returns the Y position after the section
 */
export function addSynthesisSection(doc: jsPDF, data: SynthesisSectionData, startY: number): number {
  let y = startY;
  const margin = PDF_SPACING.pageMargin;
  const contentWidth = PDF_PAGE.contentWidth;

  // Check if we need a new page
  if (y > PDF_PAGE.height - 80) {
    doc.addPage();
    y = PDF_SPACING.pageMargin;
  }

  // Section header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_FONT_SIZES.heading1);
  doc.setTextColor(...hexToRgb(PDF_COLORS.navy));
  doc.text('4. Synthesis', margin, y);
  y += 3;

  // Underline
  doc.setDrawColor(...hexToRgb(PDF_COLORS.teal));
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 40, y);
  y += PDF_SPACING.sectionGap;

  // Find synthesis output (phase 4)
  let chairmanModel = data.runModels.find(
    m => m.role === 'synthesizer' || m.role === 'chairman' || m.role === 'chair'
  );

  // If no chair role found, find any model with phase 4 output
  if (!chairmanModel) {
    chairmanModel = data.runModels.find(m => m.outputs?.some(o => o.phase === 4));
  }

  const synthesisOutput = chairmanModel?.outputs?.find(o => o.phase === 4);

  if (!synthesisOutput) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(PDF_FONT_SIZES.body);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
    doc.text('No synthesis data available', margin, y);
    return y + PDF_SPACING.sectionGap;
  }

  // Chairman info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_FONT_SIZES.body);
  doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
  doc.text(`Synthesized by: ${chairmanModel?.display_name || 'Unknown'} (${ROLE_LABELS[chairmanModel?.role || ''] || chairmanModel?.role})`, margin, y);
  y += PDF_SPACING.lineHeight + 2;

  // Confidence level if available
  const confidenceLevel = synthesisOutput.metadata?.confidence_level as number | undefined;
  if (confidenceLevel !== undefined) {
    const confidencePercent = Math.round(confidenceLevel * 100);
    const confidenceLabel = confidencePercent >= 80 ? 'High' :
                           confidencePercent >= 50 ? 'Medium' : 'Low';
    const confidenceColor = confidencePercent >= 80 ? PDF_COLORS.success :
                           confidencePercent >= 50 ? PDF_COLORS.warning : PDF_COLORS.error;

    // Confidence bar
    doc.setFillColor(...hexToRgb(PDF_COLORS.cardBg));
    doc.roundedRect(margin, y - 2, contentWidth, 20, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_FONT_SIZES.body);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
    doc.text(`Confidence: ${confidenceLabel}`, margin + 5, y + 6);

    // Progress bar background
    doc.setFillColor(...hexToRgb(PDF_COLORS.borderLight));
    doc.roundedRect(margin + 60, y + 1, 80, 8, 2, 2, 'F');

    // Progress bar fill
    doc.setFillColor(...hexToRgb(confidenceColor));
    doc.roundedRect(margin + 60, y + 1, 80 * (confidencePercent / 100), 8, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_FONT_SIZES.body);
    doc.setTextColor(...hexToRgb(confidenceColor));
    doc.text(`${confidencePercent}%`, margin + 150, y + 6);

    y += 22;
  }

  y += PDF_SPACING.smallGap;

  // Key Agreements
  const keyAgreements = synthesisOutput.metadata?.key_agreements as string[] | undefined;
  if (keyAgreements && keyAgreements.length > 0) {
    y = addListSection(doc, 'Key Agreements', keyAgreements, margin, y, contentWidth, PDF_COLORS.success);
  }

  // Key Disagreements
  const keyDisagreements = synthesisOutput.metadata?.key_disagreements as string[] | undefined;
  if (keyDisagreements && keyDisagreements.length > 0) {
    y = addListSection(doc, 'Key Disagreements', keyDisagreements, margin, y, contentWidth, PDF_COLORS.warning);
  }

  // Full Synthesis Content
  if (y > PDF_PAGE.height - 60) {
    doc.addPage();
    y = PDF_SPACING.pageMargin;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_FONT_SIZES.heading3);
  doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
  doc.text('Full Synthesis', margin, y);
  y += 3;

  // Accent underline for section
  doc.setDrawColor(...hexToRgb(PDF_COLORS.teal));
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 45, y);
  y += PDF_SPACING.lineHeight + 2;

  // Render synthesis content with markdown formatting
  const synthesisContent = synthesisOutput.content || '';
  y = renderMarkdownToPdf(doc, synthesisContent, {
    startX: margin,
    startY: y,
    maxWidth: contentWidth,
  });

  y += PDF_SPACING.paragraphGap;

  // Minority Opinions
  const minorityOpinions = synthesisOutput.metadata?.minority_opinions as string[] | undefined;
  if (minorityOpinions && minorityOpinions.length > 0) {
    if (y > PDF_PAGE.height - 40) {
      doc.addPage();
      y = PDF_SPACING.pageMargin;
    }
    y = addListSection(doc, 'Minority Opinions', minorityOpinions, margin, y, contentWidth, PDF_COLORS.textMuted);
  }

  return y + PDF_SPACING.sectionGap;
}

function addListSection(
  doc: jsPDF,
  title: string,
  items: string[],
  x: number,
  y: number,
  width: number,
  accentColor: string
): number {
  // Check for page break
  if (y > PDF_PAGE.height - 40) {
    doc.addPage();
    y = PDF_SPACING.pageMargin;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_FONT_SIZES.heading3);
  doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
  doc.text(title, x, y);

  // Accent underline
  doc.setDrawColor(...hexToRgb(accentColor));
  doc.setLineWidth(0.5);
  doc.line(x, y + 2, x + doc.getTextWidth(title), y + 2);
  y += PDF_SPACING.lineHeight + 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_FONT_SIZES.small);
  doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));

  items.forEach((item) => {
    if (y > PDF_PAGE.height - 20) {
      doc.addPage();
      y = PDF_SPACING.pageMargin;
    }

    // Bullet point with accent color
    doc.setFillColor(...hexToRgb(accentColor));
    doc.circle(x + 3, y - 1, 1.5, 'F');

    const lines = doc.splitTextToSize(item, width - 15);
    doc.text(lines, x + 8, y);
    y += lines.length * 4.5 + 2;
  });

  return y + PDF_SPACING.smallGap;
}
