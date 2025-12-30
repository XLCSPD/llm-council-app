import { jsPDF } from 'jspdf';
import {
  PDF_COLORS,
  PDF_FONT_SIZES,
  PDF_PAGE,
  hexToRgb,
  formatDate,
  formatDuration,
  formatCost,
} from '../pdfStyles';
import type { FullSessionData } from '@/types';

interface CoverPageData {
  session: FullSessionData['session'];
  run: FullSessionData['run'];
}

/**
 * Loads an image from a URL and returns it as a base64 data URL
 */
async function loadImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Adds a cover page to the PDF document
 */
export async function addCoverPage(doc: jsPDF, data: CoverPageData): Promise<void> {
  const centerX = PDF_PAGE.width / 2;

  // Background - Light gray
  doc.setFillColor(...hexToRgb(PDF_COLORS.lightGray));
  doc.rect(0, 0, PDF_PAGE.width, PDF_PAGE.height, 'F');

  // Top accent bar
  doc.setFillColor(...hexToRgb(PDF_COLORS.teal));
  doc.rect(0, 0, PDF_PAGE.width, 8, 'F');

  // Logo - Load from public folder
  const logoY = 50;
  const logoHeight = 50; // Display height in mm
  const logoWidth = (677 / 369) * logoHeight; // Maintain aspect ratio (original: 677x369)

  try {
    const logoBase64 = await loadImageAsBase64('/logo.png');
    doc.addImage(logoBase64, 'PNG', centerX - logoWidth / 2, logoY, logoWidth, logoHeight);
  } catch (error) {
    // Fallback to placeholder if logo fails to load
    console.warn('Failed to load logo, using placeholder:', error);
    doc.setFillColor(...hexToRgb(PDF_COLORS.navy));
    doc.circle(centerX, logoY + 25, 20, 'F');
    doc.setFillColor(...hexToRgb(PDF_COLORS.cyan));
    doc.circle(centerX, logoY + 25, 12, 'F');
    doc.setFillColor(...hexToRgb(PDF_COLORS.teal));
    doc.circle(centerX, logoY + 25, 6, 'F');
  }

  // Title: LLM COUNCIL
  const titleY = logoY + logoHeight + 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(...hexToRgb(PDF_COLORS.navy));
  doc.text('LLM COUNCIL', centerX, titleY, { align: 'center' });

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
  doc.text('DELIBERATION REPORT', centerX, titleY + 13, { align: 'center' });

  // Horizontal line
  doc.setDrawColor(...hexToRgb(PDF_COLORS.teal));
  doc.setLineWidth(0.5);
  doc.line(centerX - 40, titleY + 25, centerX + 40, titleY + 25);

  // Session title
  const sessionTitleY = titleY + 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_FONT_SIZES.heading1);
  doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));

  const sessionTitle = data.session.title || 'Untitled Session';
  // Wrap title if too long
  const maxTitleWidth = PDF_PAGE.contentWidth;
  const titleLines = doc.splitTextToSize(sessionTitle, maxTitleWidth);
  doc.text(titleLines, centerX, sessionTitleY, { align: 'center' });

  // Session metadata
  const metaStartY = sessionTitleY + (titleLines.length * 8) + 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_FONT_SIZES.body);
  doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));

  const metadata = [
    { label: 'Date', value: formatDate(data.session.created_at) },
    { label: 'Status', value: data.run?.status ? data.run.status.charAt(0).toUpperCase() + data.run.status.slice(1) : 'Unknown' },
  ];

  if (data.run?.cost_usd) {
    metadata.push({ label: 'Total Cost', value: formatCost(data.run.cost_usd) });
  }

  if (data.run?.started_at && data.run?.ended_at) {
    const duration = new Date(data.run.ended_at).getTime() - new Date(data.run.started_at).getTime();
    metadata.push({ label: 'Duration', value: formatDuration(duration) });
  }

  metadata.forEach((item, index) => {
    const y = metaStartY + (index * 12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
    doc.text(`${item.label}:`, centerX - 30, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
    doc.text(item.value, centerX - 25, y, { align: 'left' });
  });

  // Status badge
  const statusY = metaStartY + 60;
  const status = data.run?.status || 'unknown';
  const statusColor = status === 'succeeded' ? PDF_COLORS.success :
                      status === 'failed' ? PDF_COLORS.error :
                      PDF_COLORS.warning;

  doc.setFillColor(...hexToRgb(statusColor));
  doc.roundedRect(centerX - 25, statusY - 5, 50, 12, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_FONT_SIZES.small);
  doc.setTextColor(255, 255, 255);
  doc.text(status.toUpperCase(), centerX, statusY + 3, { align: 'center' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_FONT_SIZES.caption);
  doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
  doc.text('Generated by LLM Council - EveryDAI Solutions', centerX, PDF_PAGE.height - 20, { align: 'center' });
  doc.text(new Date().toLocaleDateString(), centerX, PDF_PAGE.height - 14, { align: 'center' });
}
