import { jsPDF } from 'jspdf';
import {
  PDF_COLORS,
  PDF_FONT_SIZES,
  PDF_PAGE,
  PDF_SPACING,
  hexToRgb,
  ROLE_LABELS,
  ROLE_COLORS,
  formatDuration,
} from '../pdfStyles';
import type { FullSessionData } from '@/types';

interface ReasoningSectionData {
  runModels: FullSessionData['runModels'];
}

/**
 * Adds the reasoning phase section to the PDF
 * Returns the Y position after the section
 */
export function addReasoningSection(doc: jsPDF, data: ReasoningSectionData, startY: number): number {
  let y = startY;
  const margin = PDF_SPACING.pageMargin;
  const contentWidth = PDF_PAGE.contentWidth;

  // Section header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_FONT_SIZES.heading1);
  doc.setTextColor(...hexToRgb(PDF_COLORS.navy));
  doc.text('2. Reasoning Phase', margin, y);
  y += 3;

  // Underline
  doc.setDrawColor(...hexToRgb(PDF_COLORS.teal));
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 60, y);
  y += PDF_SPACING.sectionGap;

  // Description
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(PDF_FONT_SIZES.body);
  doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
  doc.text('Individual model responses to the prompt', margin, y);
  y += PDF_SPACING.paragraphGap;

  if (!data.runModels || data.runModels.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
    doc.text('No reasoning data available', margin, y);
    return y + PDF_SPACING.sectionGap;
  }

  // Each model's response
  for (const model of data.runModels) {
    // Find phase 2 (reasoning) output
    const reasoningOutput = model.outputs?.find(o => o.phase === 2);
    if (!reasoningOutput) continue;

    // Check if we need a new page
    if (y > PDF_PAGE.height - 60) {
      doc.addPage();
      y = PDF_SPACING.pageMargin;
    }

    // Model card header
    const roleColor = ROLE_COLORS[model.role] || PDF_COLORS.textSecondary;
    const headerHeight = 10;

    // Role color bar
    doc.setFillColor(...hexToRgb(roleColor));
    doc.rect(margin, y, 3, headerHeight, 'F');

    // Model name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_FONT_SIZES.heading3);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
    const modelNameWidth = doc.getTextWidth(model.display_name || model.model_key);
    doc.text(model.display_name || model.model_key, margin + 8, y + 7);

    // Role badge - properly centered text
    const roleName = ROLE_LABELS[model.role] || model.role;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF_FONT_SIZES.caption);
    const roleTextWidth = doc.getTextWidth(roleName);
    const badgePadding = 6;
    const badgeWidth = roleTextWidth + badgePadding * 2;
    const badgeHeight = 8;
    const badgeX = margin + 8 + modelNameWidth + 8;
    const badgeY = y + (headerHeight - badgeHeight) / 2;

    doc.setFillColor(...hexToRgb(roleColor));
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    // Center text vertically in badge (baseline adjustment for small font)
    doc.text(roleName, badgeX + badgePadding, badgeY + badgeHeight - 2.5);

    // Metrics on the right
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF_FONT_SIZES.caption);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
    const metricsText = [];
    if (model.latency_ms) {
      metricsText.push(`${formatDuration(model.latency_ms)}`);
    }
    if (reasoningOutput.metadata?.token_count) {
      metricsText.push(`${reasoningOutput.metadata.token_count} tokens`);
    }
    if (metricsText.length > 0) {
      doc.text(metricsText.join(' | '), margin + contentWidth, y + 7, { align: 'right' });
    }

    y += headerHeight + 4;

    // Response content box - use proper padding and text wrapping
    const boxPadding = 8;
    const textWidth = contentWidth - (boxPadding * 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF_FONT_SIZES.small);
    const responseLines = doc.splitTextToSize(reasoningOutput.content || 'No response', textWidth);

    // Calculate box height (with max height per page)
    const lineHeight = 4.5;
    const maxLinesPerPage = Math.floor((PDF_PAGE.height - y - 30) / lineHeight);
    const displayLines = responseLines.slice(0, Math.min(responseLines.length, maxLinesPerPage));
    const boxHeight = displayLines.length * lineHeight + (boxPadding * 2);

    doc.setFillColor(...hexToRgb(PDF_COLORS.cardBg));
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'F');

    doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
    doc.text(displayLines, margin + boxPadding, y + boxPadding + 3);

    y += boxHeight + PDF_SPACING.paragraphGap;

    // If content was truncated, add continuation on new page
    if (responseLines.length > maxLinesPerPage) {
      let remainingLines = responseLines.slice(maxLinesPerPage);

      while (remainingLines.length > 0) {
        doc.addPage();
        y = PDF_SPACING.pageMargin;

        // Continuation header
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(PDF_FONT_SIZES.caption);
        doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
        doc.text(`${model.display_name} (continued)`, margin, y);
        y += PDF_SPACING.lineHeight;

        const pageLinesLimit = Math.floor((PDF_PAGE.height - y - 30) / lineHeight);
        const pageLines = remainingLines.slice(0, pageLinesLimit);
        remainingLines = remainingLines.slice(pageLinesLimit);

        const contBoxHeight = pageLines.length * lineHeight + (boxPadding * 2);
        doc.setFillColor(...hexToRgb(PDF_COLORS.cardBg));
        doc.roundedRect(margin, y, contentWidth, contBoxHeight, 2, 2, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(PDF_FONT_SIZES.small);
        doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
        doc.text(pageLines, margin + boxPadding, y + boxPadding + 3);

        y += contBoxHeight + PDF_SPACING.paragraphGap;
      }
    }
  }

  return y + PDF_SPACING.sectionGap;
}
