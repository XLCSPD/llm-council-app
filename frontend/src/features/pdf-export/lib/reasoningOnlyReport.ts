/**
 * Export functions for reasoning phase reports
 * Generates PDF and markdown reports containing all reasoning responses
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

interface ReasoningResponse {
  modelName: string;
  role: RoleType | string;
  content: string;
  latency_ms: number;
  token_count: number;
  timestamp?: string;
}

interface ReasoningReportData {
  sessionTitle: string;
  promptContent: string;
  responses: ReasoningResponse[];
  generatedAt?: string;
}

/**
 * Export all reasoning responses as a markdown file
 */
export function exportAllReasoningAsMarkdown(data: ReasoningReportData): void {
  const timestamp = formatDate(data.generatedAt || new Date().toISOString());

  // Calculate totals
  const totalLatency = data.responses.reduce((sum, r) => sum + r.latency_ms, 0);
  const totalTokens = data.responses.reduce((sum, r) => sum + r.token_count, 0);
  const avgTokens = Math.round(totalTokens / data.responses.length);

  let markdown = `# Reasoning Phase Report

**Session:** ${data.sessionTitle}
**Generated:** ${timestamp}
**Models:** ${data.responses.length} | **Total Time:** ${formatDuration(totalLatency)} | **Total Tokens:** ${totalTokens.toLocaleString()}

---

## Prompt

${data.promptContent}

---

## Model Responses

`;

  data.responses.forEach((response, index) => {
    const roleLabel = ROLE_LABELS[response.role] || response.role;
    markdown += `### ${index + 1}. ${response.modelName} (${roleLabel})

**Latency:** ${formatDuration(response.latency_ms)} | **Tokens:** ${response.token_count.toLocaleString()}

${response.content}

---

`;
  });

  markdown += `## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Models | ${data.responses.length} |
| Total Latency | ${formatDuration(totalLatency)} |
| Total Tokens | ${totalTokens.toLocaleString()} |
| Average Tokens | ${avgTokens.toLocaleString()} |
`;

  // Download
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const sanitizedTitle = data.sessionTitle.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
  link.download = `${sanitizedTitle}-reasoning-report.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export all reasoning responses as a PDF report
 */
export function exportAllReasoningAsPdf(data: ReasoningReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const margin = PDF_SPACING.pageMargin;
  const contentWidth = PDF_PAGE.contentWidth;
  const centerX = PDF_PAGE.width / 2;

  // Calculate totals
  const totalLatency = data.responses.reduce((sum, r) => sum + r.latency_ms, 0);
  const totalTokens = data.responses.reduce((sum, r) => sum + r.token_count, 0);

  // ==================
  // COVER PAGE
  // ==================

  // Background
  doc.setFillColor(...hexToRgb(PDF_COLORS.lightGray));
  doc.rect(0, 0, PDF_PAGE.width, PDF_PAGE.height, 'F');

  // Top accent bar
  doc.setFillColor(...hexToRgb(PDF_COLORS.teal));
  doc.rect(0, 0, PDF_PAGE.width, 8, 'F');

  // Title
  let y = 60;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...hexToRgb(PDF_COLORS.navy));
  doc.text('REASONING PHASE', centerX, y, { align: 'center' });
  y += 12;
  doc.setFontSize(20);
  doc.text('REPORT', centerX, y, { align: 'center' });

  // Decorative line
  y += 15;
  doc.setDrawColor(...hexToRgb(PDF_COLORS.teal));
  doc.setLineWidth(0.5);
  doc.line(centerX - 40, y, centerX + 40, y);

  // Session title
  y += 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_FONT_SIZES.heading1);
  doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
  const titleLines = doc.splitTextToSize(data.sessionTitle, contentWidth);
  doc.text(titleLines, centerX, y, { align: 'center' });

  // Stats summary
  y += titleLines.length * 8 + 30;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_FONT_SIZES.body);
  doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));

  const stats = [
    { label: 'Models', value: data.responses.length.toString() },
    { label: 'Total Time', value: formatDuration(totalLatency) },
    { label: 'Total Tokens', value: totalTokens.toLocaleString() },
    { label: 'Generated', value: formatDate(data.generatedAt || new Date().toISOString()) },
  ];

  stats.forEach((stat, index) => {
    const statY = y + (index * 12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
    doc.text(`${stat.label}:`, centerX - 20, statY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
    doc.text(stat.value, centerX - 15, statY, { align: 'left' });
  });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_FONT_SIZES.caption);
  doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
  doc.text('LLM Council - Reasoning Phase Export', centerX, PDF_PAGE.height - 20, { align: 'center' });

  // ==================
  // PROMPT PAGE
  // ==================
  doc.addPage();
  y = margin;

  // Section header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_FONT_SIZES.heading1);
  doc.setTextColor(...hexToRgb(PDF_COLORS.navy));
  doc.text('Prompt', margin, y);
  y += 3;

  // Underline
  doc.setDrawColor(...hexToRgb(PDF_COLORS.teal));
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + 30, y);
  y += 10;

  // Prompt content
  y = renderMarkdownToPdf(doc, data.promptContent, {
    startX: margin,
    startY: y,
    maxWidth: contentWidth,
  });

  // ==================
  // RESPONSE PAGES
  // ==================
  data.responses.forEach((response, index) => {
    doc.addPage();
    y = margin;

    const roleColor = ROLE_COLORS[response.role] || PDF_COLORS.textSecondary;
    const roleLabel = ROLE_LABELS[response.role] || response.role;

    // Role color bar at top
    doc.setFillColor(...hexToRgb(roleColor));
    doc.rect(0, 0, PDF_PAGE.width, 6, 'F');

    y = 18;

    // Response number
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF_FONT_SIZES.caption);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
    doc.text(`Response ${index + 1} of ${data.responses.length}`, margin, y);
    y += 8;

    // Model name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_FONT_SIZES.heading1);
    doc.setTextColor(...hexToRgb(PDF_COLORS.navy));
    doc.text(response.modelName, margin, y);
    y += 8;

    // Role badge
    doc.setFontSize(PDF_FONT_SIZES.small);
    const badgeTextWidth = doc.getTextWidth(roleLabel);
    const badgePadding = 4;
    const badgeWidth = badgeTextWidth + badgePadding * 2;

    doc.setFillColor(...hexToRgb(roleColor));
    doc.roundedRect(margin, y - 4, badgeWidth, 6, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(roleLabel, margin + badgePadding, y);
    y += 8;

    // Metrics
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF_FONT_SIZES.caption);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
    const metrics = `${formatDuration(response.latency_ms)} | ${response.token_count.toLocaleString()} tokens`;
    doc.text(metrics, margin, y);
    y += 6;

    // Divider
    doc.setDrawColor(...hexToRgb(PDF_COLORS.borderLight));
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentWidth, y);
    y += 8;

    // Response content
    y = renderMarkdownToPdf(doc, response.content, {
      startX: margin,
      startY: y,
      maxWidth: contentWidth,
    });
  });

  // ==================
  // ADD PAGE NUMBERS
  // ==================
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Skip cover page
    if (i === 1) continue;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF_FONT_SIZES.caption);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
    doc.text(
      `Page ${i} of ${pageCount}`,
      centerX,
      PDF_PAGE.height - 10,
      { align: 'center' }
    );
  }

  // Download
  const sanitizedTitle = data.sessionTitle.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
  doc.save(`${sanitizedTitle}-reasoning-report.pdf`);
}
