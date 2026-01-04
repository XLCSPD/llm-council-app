import { jsPDF } from 'jspdf';
import {
  PDF_COLORS,
  PDF_FONT_SIZES,
  PDF_PAGE,
  PDF_SPACING,
  hexToRgb,
  ROLE_LABELS,
  ROLE_COLORS,
} from '../pdfStyles';
import { renderMarkdownToPdf } from '../markdownRenderer';
import type { FullSessionData, PromptConfig } from '@/types';

interface PromptSectionData {
  prompt: (PromptConfig & { id: string }) | null;
  councilConfig: FullSessionData['run'] extends null ? null : NonNullable<FullSessionData['run']>['council_config'] | null;
}

/**
 * Adds the prompt and configuration section to the PDF
 * Returns the Y position after the section
 */
export function addPromptSection(doc: jsPDF, data: PromptSectionData, startY: number): number {
  let y = startY;
  const margin = PDF_SPACING.pageMargin;
  const contentWidth = PDF_PAGE.contentWidth;

  // Section header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_FONT_SIZES.heading1);
  doc.setTextColor(...hexToRgb(PDF_COLORS.navy));
  doc.text('1. Prompt & Configuration', margin, y);
  y += 3;

  // Underline
  doc.setDrawColor(...hexToRgb(PDF_COLORS.teal));
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 80, y);
  y += PDF_SPACING.sectionGap;

  if (!data.prompt) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(PDF_FONT_SIZES.body);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
    doc.text('No prompt data available', margin, y);
    return y + PDF_SPACING.sectionGap;
  }

  // Main Prompt Content
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_FONT_SIZES.heading3);
  doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
  doc.text('User Prompt', margin, y);
  y += 3;

  // Accent underline
  doc.setDrawColor(...hexToRgb(PDF_COLORS.teal));
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + 40, y);
  y += PDF_SPACING.lineHeight + 2;

  // Render prompt content with markdown formatting
  const promptContent = data.prompt.content || 'No content';
  y = renderMarkdownToPdf(doc, promptContent, {
    startX: margin,
    startY: y,
    maxWidth: contentWidth,
  });
  y += PDF_SPACING.paragraphGap;

  // Objective
  if (data.prompt.objective) {
    y = addField(doc, 'Objective', data.prompt.objective, margin, y, contentWidth);
  }

  // Audience
  if (data.prompt.audience) {
    y = addField(doc, 'Target Audience', data.prompt.audience, margin, y, contentWidth);
  }

  // Context
  if (data.prompt.context) {
    y = addField(doc, 'Context', data.prompt.context, margin, y, contentWidth);
  }

  // Constraints
  if (data.prompt.constraints && data.prompt.constraints.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_FONT_SIZES.heading3);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
    doc.text('Constraints', margin, y);
    y += PDF_SPACING.lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF_FONT_SIZES.body);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
    data.prompt.constraints.forEach((constraint) => {
      doc.text(`• ${constraint}`, margin + 5, y);
      y += PDF_SPACING.lineHeight;
    });
    y += PDF_SPACING.smallGap;
  }

  // Council Members
  if (data.councilConfig?.members && data.councilConfig.members.length > 0) {
    y += PDF_SPACING.paragraphGap;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_FONT_SIZES.heading3);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
    doc.text('Council Members', margin, y);
    y += PDF_SPACING.lineHeight + 2;

    // Table header
    const modelColWidth = 80;
    const roleColWidth = 50;
    const tableX = margin;

    doc.setFillColor(...hexToRgb(PDF_COLORS.navy));
    doc.rect(tableX, y - 4, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_FONT_SIZES.small);
    doc.setTextColor(255, 255, 255);
    doc.text('Model', tableX + 5, y);
    doc.text('Role', tableX + modelColWidth + 5, y);
    doc.text('Weight', tableX + modelColWidth + roleColWidth + 5, y);
    y += 8;

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF_FONT_SIZES.small);
    data.councilConfig.members.forEach((member, index) => {
      const rowColor = index % 2 === 0 ? PDF_COLORS.white : PDF_COLORS.cardBg;
      doc.setFillColor(...hexToRgb(rowColor));
      doc.rect(tableX, y - 4, contentWidth, 7, 'F');

      doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
      doc.text(member.display_name || member.model_key, tableX + 5, y);

      // Role with color indicator
      const roleColor = ROLE_COLORS[member.role] || PDF_COLORS.textSecondary;
      doc.setFillColor(...hexToRgb(roleColor));
      doc.circle(tableX + modelColWidth + 3, y - 1, 2, 'F');
      doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
      doc.text(ROLE_LABELS[member.role] || member.role, tableX + modelColWidth + 8, y);

      doc.text(member.weight.toString(), tableX + modelColWidth + roleColWidth + 5, y);
      y += 7;
    });
  }

  return y + PDF_SPACING.sectionGap;
}

function addField(doc: jsPDF, label: string, value: string, x: number, y: number, width: number): number {
  // Check for page break
  if (y > PDF_PAGE.height - 40) {
    doc.addPage();
    y = PDF_SPACING.pageMargin;
  }

  // Label with accent styling
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_FONT_SIZES.heading3);
  doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
  doc.text(label, x, y);
  y += PDF_SPACING.lineHeight;

  // Render value with markdown formatting
  y = renderMarkdownToPdf(doc, value, {
    startX: x,
    startY: y,
    maxWidth: width,
    indent: 4,
  });
  y += PDF_SPACING.smallGap;

  return y;
}
