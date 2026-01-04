/**
 * Export functions for individual model responses
 * Supports both markdown and PDF formats
 */
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
  formatDate,
} from './pdfStyles';
import { renderMarkdownToPdf } from './markdownRenderer';
import type { RoleType } from '@/types';

interface ResponseMetadata {
  latency_ms: number;
  token_count: number;
  timestamp: string;
}

/**
 * Export a single model response as a markdown file
 */
export function exportResponseAsMarkdown(
  modelName: string,
  role: RoleType | string,
  content: string,
  metadata: ResponseMetadata
): void {
  const roleLabel = ROLE_LABELS[role] || role;
  const timestamp = formatDate(metadata.timestamp);

  const markdown = `# ${modelName} - ${roleLabel} Response

**Generated:** ${timestamp}
**Latency:** ${formatDuration(metadata.latency_ms)} | **Tokens:** ${metadata.token_count.toLocaleString()}

---

${content}
`;

  // Create and download the file
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${modelName.replace(/[^a-zA-Z0-9]/g, '-')}-response.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export a single model response as a PDF file
 */
export function exportResponseAsPdf(
  modelName: string,
  role: RoleType | string,
  content: string,
  metadata: ResponseMetadata,
  promptContent?: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const margin = PDF_SPACING.pageMargin;
  const contentWidth = PDF_PAGE.contentWidth;
  let y: number = margin;

  // Header with role color bar
  const roleColor = ROLE_COLORS[role] || PDF_COLORS.textSecondary;
  const roleLabel = ROLE_LABELS[role] || role;

  // Role color bar on top
  doc.setFillColor(...hexToRgb(roleColor));
  doc.rect(0, 0, PDF_PAGE.width, 8, 'F');

  y = 20;

  // Model name as title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_FONT_SIZES.title);
  doc.setTextColor(...hexToRgb(PDF_COLORS.navy));
  doc.text(modelName, margin, y);
  y += 8;

  // Role badge
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_FONT_SIZES.small);
  const roleTextWidth = doc.getTextWidth(roleLabel);
  const badgePadding = 4;
  const badgeWidth = roleTextWidth + badgePadding * 2;
  const badgeHeight = 6;

  doc.setFillColor(...hexToRgb(roleColor));
  doc.roundedRect(margin, y - 4, badgeWidth, badgeHeight, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(roleLabel, margin + badgePadding, y);
  y += 8;

  // Metrics row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_FONT_SIZES.caption);
  doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
  const timestamp = formatDate(metadata.timestamp);
  doc.text(`Generated: ${timestamp}`, margin, y);

  const metricsText = `${formatDuration(metadata.latency_ms)} | ${metadata.token_count.toLocaleString()} tokens`;
  doc.text(metricsText, margin + contentWidth, y, { align: 'right' });
  y += 6;

  // Divider
  doc.setDrawColor(...hexToRgb(PDF_COLORS.borderLight));
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);
  y += 8;

  // Optional: Include prompt context
  if (promptContent) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_FONT_SIZES.heading3);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
    doc.text('Prompt', margin, y);
    y += 5;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(PDF_FONT_SIZES.small);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
    const promptLines = doc.splitTextToSize(promptContent, contentWidth);
    // Limit to first 3 lines
    const truncatedPrompt = promptLines.slice(0, 3);
    doc.text(truncatedPrompt, margin, y);
    if (promptLines.length > 3) {
      y += truncatedPrompt.length * 4;
      doc.text('...', margin, y);
    }
    y += (truncatedPrompt.length + 1) * 4 + 6;
  }

  // Response header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_FONT_SIZES.heading2);
  doc.setTextColor(...hexToRgb(PDF_COLORS.navy));
  doc.text('Response', margin, y);
  y += 3;

  // Accent underline
  doc.setDrawColor(...hexToRgb(PDF_COLORS.teal));
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + 30, y);
  y += 8;

  // Response content with markdown rendering
  y = renderMarkdownToPdf(doc, content, {
    startX: margin,
    startY: y,
    maxWidth: contentWidth,
  });

  // Footer with branding
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF_FONT_SIZES.caption);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
    doc.text(
      'LLM Council - Individual Response Export',
      margin,
      PDF_PAGE.height - 10
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      margin + contentWidth,
      PDF_PAGE.height - 10,
      { align: 'right' }
    );
  }

  // Download
  const filename = `${modelName.replace(/[^a-zA-Z0-9]/g, '-')}-response.pdf`;
  doc.save(filename);
}
