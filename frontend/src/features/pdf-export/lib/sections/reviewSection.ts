import { jsPDF } from 'jspdf';
import {
  PDF_COLORS,
  PDF_FONT_SIZES,
  PDF_PAGE,
  PDF_SPACING,
  hexToRgb,
} from '../pdfStyles';
import { renderMarkdownToPdf } from '../markdownRenderer';
import type { FullSessionData } from '@/types';

interface ReviewSectionData {
  runModels: FullSessionData['runModels'];
  peerReviews: FullSessionData['peerReviews'];
}

/**
 * Adds the peer review section to the PDF
 * Returns the Y position after the section
 */
export function addReviewSection(doc: jsPDF, data: ReviewSectionData, startY: number): number {
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
  doc.text('3. Peer Review Phase', margin, y);
  y += 3;

  // Underline
  doc.setDrawColor(...hexToRgb(PDF_COLORS.teal));
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 70, y);
  y += PDF_SPACING.sectionGap;

  // Description
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(PDF_FONT_SIZES.body);
  doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
  doc.text('Cross-evaluation scores between council members', margin, y);
  y += PDF_SPACING.paragraphGap;

  if (!data.peerReviews || data.peerReviews.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
    doc.text('No peer review data available', margin, y);
    return y + PDF_SPACING.sectionGap;
  }

  // Build score matrix
  const modelMap = new Map(data.runModels.map(m => [m.id, m]));
  const reviewerIds = [...new Set(data.peerReviews.map(r => r.reviewer_run_model_id))];
  const reviewedIds = [...new Set(data.peerReviews.map(r => r.reviewed_run_model_id))];

  // Calculate model averages
  const modelScores = new Map<string, { total: number; count: number }>();
  data.peerReviews.forEach(review => {
    const current = modelScores.get(review.reviewed_run_model_id) || { total: 0, count: 0 };
    current.total += review.score;
    current.count += 1;
    modelScores.set(review.reviewed_run_model_id, current);
  });

  // Rankings Matrix Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_FONT_SIZES.heading3);
  doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
  doc.text('Rankings Matrix', margin, y);
  y += PDF_SPACING.lineHeight + 2;

  // Draw matrix table
  const cellWidth = Math.min(30, (contentWidth - 40) / reviewedIds.length);
  const rowHeight = 10;
  const labelColWidth = 50;

  // Header row
  doc.setFillColor(...hexToRgb(PDF_COLORS.navy));
  doc.rect(margin, y - 4, contentWidth, rowHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_FONT_SIZES.caption);
  doc.setTextColor(255, 255, 255);
  doc.text('Reviewer', margin + 5, y + 2);

  reviewedIds.forEach((reviewedId, index) => {
    const model = modelMap.get(reviewedId);
    const name = model?.display_name || 'Unknown';
    const truncatedName = name.length > 10 ? name.substring(0, 8) + '..' : name;
    doc.text(truncatedName, margin + labelColWidth + (index * cellWidth) + cellWidth / 2, y + 2, { align: 'center' });
  });

  doc.text('Avg', margin + labelColWidth + (reviewedIds.length * cellWidth) + 15, y + 2, { align: 'center' });
  y += rowHeight;

  // Data rows
  reviewerIds.forEach((reviewerId, rowIndex) => {
    const rowColor = rowIndex % 2 === 0 ? PDF_COLORS.white : PDF_COLORS.cardBg;
    doc.setFillColor(...hexToRgb(rowColor));
    doc.rect(margin, y - 4, contentWidth, rowHeight, 'F');

    const reviewerModel = modelMap.get(reviewerId);
    const reviewerName = reviewerModel?.display_name || 'Unknown';
    const truncatedReviewerName = reviewerName.length > 15 ? reviewerName.substring(0, 13) + '..' : reviewerName;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF_FONT_SIZES.caption);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
    doc.text(truncatedReviewerName, margin + 5, y + 2);

    let rowTotal = 0;
    let rowCount = 0;

    reviewedIds.forEach((reviewedId, colIndex) => {
      const review = data.peerReviews.find(
        r => r.reviewer_run_model_id === reviewerId && r.reviewed_run_model_id === reviewedId
      );

      const cellX = margin + labelColWidth + (colIndex * cellWidth);
      const cellCenterX = cellX + cellWidth / 2;

      if (reviewerId === reviewedId) {
        // Self - draw dash
        doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
        doc.text('-', cellCenterX, y + 2, { align: 'center' });
      } else if (review) {
        // Score with color coding
        const score = review.score;
        rowTotal += score;
        rowCount += 1;

        const scoreColor = score >= 8 ? PDF_COLORS.success :
                          score >= 6 ? PDF_COLORS.warning :
                          PDF_COLORS.error;

        // Score cell background
        doc.setFillColor(...hexToRgb(scoreColor));
        doc.roundedRect(cellCenterX - 8, y - 3, 16, 8, 1, 1, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(score.toFixed(1), cellCenterX, y + 2, { align: 'center' });
      } else {
        doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
        doc.text('-', cellCenterX, y + 2, { align: 'center' });
      }
    });

    // Row average
    if (rowCount > 0) {
      const avg = rowTotal / rowCount;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...hexToRgb(PDF_COLORS.teal));
      doc.text(avg.toFixed(1), margin + labelColWidth + (reviewedIds.length * cellWidth) + 15, y + 2, { align: 'center' });
    }

    y += rowHeight;
  });

  y += PDF_SPACING.paragraphGap;

  // Summary statistics
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_FONT_SIZES.heading3);
  doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
  doc.text('Summary Statistics', margin, y);
  y += PDF_SPACING.lineHeight + 2;

  // Stats boxes
  const stats = [
    { label: 'Total Reviews', value: data.peerReviews.length.toString() },
    { label: 'Reviewers', value: reviewerIds.length.toString() },
    {
      label: 'Avg Score',
      value: (data.peerReviews.reduce((sum, r) => sum + r.score, 0) / data.peerReviews.length).toFixed(1),
    },
  ];

  const statBoxWidth = 50;
  const statBoxHeight = 25;

  stats.forEach((stat, index) => {
    const boxX = margin + (index * (statBoxWidth + 10));

    doc.setFillColor(...hexToRgb(PDF_COLORS.cardBg));
    doc.roundedRect(boxX, y - 2, statBoxWidth, statBoxHeight, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_FONT_SIZES.heading2);
    doc.setTextColor(...hexToRgb(PDF_COLORS.teal));
    doc.text(stat.value, boxX + statBoxWidth / 2, y + 10, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF_FONT_SIZES.caption);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
    doc.text(stat.label, boxX + statBoxWidth / 2, y + 18, { align: 'center' });
  });

  y += statBoxHeight + PDF_SPACING.sectionGap;

  // Rationales (if any)
  const reviewsWithRationale = data.peerReviews.filter(r => r.rationale);
  if (reviewsWithRationale.length > 0) {
    if (y > PDF_PAGE.height - 60) {
      doc.addPage();
      y = PDF_SPACING.pageMargin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_FONT_SIZES.heading3);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
    doc.text('Review Rationales', margin, y);
    y += 3;

    // Accent underline
    doc.setDrawColor(...hexToRgb(PDF_COLORS.teal));
    doc.setLineWidth(0.4);
    doc.line(margin, y, margin + 55, y);
    y += PDF_SPACING.lineHeight + 2;

    for (const review of reviewsWithRationale.slice(0, 5)) { // Limit to 5 rationales
      if (y > PDF_PAGE.height - 50) {
        doc.addPage();
        y = PDF_SPACING.pageMargin;
      }

      const reviewer = modelMap.get(review.reviewer_run_model_id);
      const reviewed = modelMap.get(review.reviewed_run_model_id);

      // Score badge
      const scoreColor = review.score >= 8 ? PDF_COLORS.success :
                        review.score >= 6 ? PDF_COLORS.warning :
                        PDF_COLORS.error;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(PDF_FONT_SIZES.small);
      doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
      const headerText = `${reviewer?.display_name || 'Unknown'} → ${reviewed?.display_name || 'Unknown'}`;
      doc.text(headerText, margin, y);

      // Score badge inline
      const headerWidth = doc.getTextWidth(headerText);
      doc.setFillColor(...hexToRgb(scoreColor));
      doc.roundedRect(margin + headerWidth + 5, y - 3, 18, 6, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(PDF_FONT_SIZES.caption);
      doc.text(`${review.score}/10`, margin + headerWidth + 14, y, { align: 'center' });

      y += PDF_SPACING.lineHeight + 1;

      // Render rationale with markdown
      y = renderMarkdownToPdf(doc, review.rationale || '', {
        startX: margin,
        startY: y,
        maxWidth: contentWidth,
        indent: 4,
      });
      y += PDF_SPACING.smallGap + 2;
    }
  }

  return y + PDF_SPACING.sectionGap;
}
