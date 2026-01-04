/**
 * Markdown Renderer for jsPDF
 * Parses markdown content and renders it with proper visual hierarchy
 *
 * Design System: Structured Markdown with Visual Hierarchy
 * - Explicit hierarchy with proper header tags
 * - Structured lists with Key: Value format
 * - Visual anchors (blockquotes) for metadata and summaries
 * - Breathing room with horizontal rules
 */
import { jsPDF } from 'jspdf';
import {
  PDF_COLORS,
  PDF_FONT_SIZES,
  PDF_PAGE,
  PDF_SPACING,
  hexToRgb,
} from './pdfStyles';

interface RenderOptions {
  startX: number;
  startY: number;
  maxWidth: number;
  lineHeight?: number;
  /** Add extra indentation for nested content */
  indent?: number;
}

interface ParsedBlock {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'paragraph' | 'bullet' | 'numbered' | 'code' | 'blockquote' | 'hr' | 'keyvalue';
  content: string;
  level?: number; // For numbered lists
  key?: string; // For key-value pairs
}

/**
 * Parse markdown text into structured blocks
 */
function parseMarkdown(text: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const lines = text.split('\n');
  let currentParagraph: string[] = [];
  let inCodeBlock = false;
  let codeContent: string[] = [];
  let listCounter = 0;
  let inBlockquote = false;
  let blockquoteContent: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const content = currentParagraph.join(' ').trim();
      if (content) {
        // Check for key-value pattern: **Key:** Value
        const keyValueMatch = content.match(/^\*\*([^:*]+):\*\*\s*(.+)$/);
        if (keyValueMatch) {
          blocks.push({ type: 'keyvalue', key: keyValueMatch[1], content: keyValueMatch[2] || '' });
        } else {
          blocks.push({ type: 'paragraph', content });
        }
      }
      currentParagraph = [];
    }
  };

  const flushBlockquote = () => {
    if (blockquoteContent.length > 0) {
      blocks.push({ type: 'blockquote', content: blockquoteContent.join('\n') });
      blockquoteContent = [];
      inBlockquote = false;
    }
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Code block handling
    if (trimmedLine.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({ type: 'code', content: codeContent.join('\n') });
        codeContent = [];
        inCodeBlock = false;
      } else {
        flushParagraph();
        flushBlockquote();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // Horizontal rule
    if (trimmedLine === '---' || trimmedLine === '***' || trimmedLine === '___') {
      flushParagraph();
      flushBlockquote();
      blocks.push({ type: 'hr', content: '' });
      continue;
    }

    // Empty line - flush current content
    if (!trimmedLine) {
      flushParagraph();
      flushBlockquote();
      listCounter = 0;
      continue;
    }

    // Blockquotes - collect multiple lines
    if (trimmedLine.startsWith('> ')) {
      flushParagraph();
      inBlockquote = true;
      blockquoteContent.push(trimmedLine.slice(2));
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    // Headers - H1
    if (trimmedLine.startsWith('# ') && !trimmedLine.startsWith('## ')) {
      flushParagraph();
      blocks.push({ type: 'h1', content: trimmedLine.slice(2) });
      listCounter = 0;
      continue;
    }
    // Headers - H2
    if (trimmedLine.startsWith('## ')) {
      flushParagraph();
      blocks.push({ type: 'h2', content: trimmedLine.slice(3) });
      listCounter = 0;
      continue;
    }
    // Headers - H3
    if (trimmedLine.startsWith('### ')) {
      flushParagraph();
      blocks.push({ type: 'h3', content: trimmedLine.slice(4) });
      listCounter = 0;
      continue;
    }
    // Headers - H4
    if (trimmedLine.startsWith('#### ')) {
      flushParagraph();
      blocks.push({ type: 'h4', content: trimmedLine.slice(5) });
      listCounter = 0;
      continue;
    }
    // Also match headers with ** prefix (some LLMs use **Header**)
    if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && !trimmedLine.slice(2, -2).includes('**')) {
      const headerContent = trimmedLine.slice(2, -2);
      // Treat standalone bold lines as h3 if short
      if (headerContent.length < 50 && !headerContent.includes(':')) {
        flushParagraph();
        blocks.push({ type: 'h3', content: headerContent });
        listCounter = 0;
        continue;
      }
    }

    // Bullet points with key-value pattern: - **Key:** Value
    const bulletKeyValue = trimmedLine.match(/^[-*•]\s+\*\*([^:*]+):\*\*\s*(.*)$/);
    if (bulletKeyValue) {
      flushParagraph();
      blocks.push({ type: 'keyvalue', key: bulletKeyValue[1], content: bulletKeyValue[2] || '' });
      listCounter = 0;
      continue;
    }

    // Regular bullet points
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.startsWith('• ')) {
      flushParagraph();
      blocks.push({ type: 'bullet', content: trimmedLine.slice(2) });
      listCounter = 0;
      continue;
    }

    // Numbered lists
    const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      flushParagraph();
      listCounter++;
      blocks.push({ type: 'numbered', content: numberedMatch[2] || '', level: listCounter });
      continue;
    }

    // Regular text - add to current paragraph
    currentParagraph.push(trimmedLine);
  }

  // Flush remaining content
  flushParagraph();
  flushBlockquote();
  if (inCodeBlock && codeContent.length > 0) {
    blocks.push({ type: 'code', content: codeContent.join('\n') });
  }

  return blocks;
}

/**
 * Render inline formatting (bold, italic, code) within a line
 * Returns segments with their formatting
 * Note: Reserved for future enhancement of inline formatting support
 */
interface _TextSegment {
  text: string;
  bold: boolean;
  italic: boolean;
  code: boolean;
}

function _parseInlineFormatting(text: string): _TextSegment[] {
  const segments: _TextSegment[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Check for bold (**text** or __text__)
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)/s);
    if (boldMatch) {
      if (boldMatch[1]) {
        segments.push(..._parseInlineFormatting(boldMatch[1]));
      }
      segments.push({ text: boldMatch[2] || '', bold: true, italic: false, code: false });
      remaining = boldMatch[3] || '';
      continue;
    }

    // Check for inline code (`text`)
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)/s);
    if (codeMatch) {
      if (codeMatch[1]) {
        segments.push({ text: codeMatch[1], bold: false, italic: false, code: false });
      }
      segments.push({ text: codeMatch[2] || '', bold: false, italic: false, code: true });
      remaining = codeMatch[3] || '';
      continue;
    }

    // Check for italic (*text* or _text_) - single asterisk/underscore
    const italicMatch = remaining.match(/^(.*?)\*([^*]+)\*(.*)/s);
    if (italicMatch) {
      if (italicMatch[1]) {
        segments.push({ text: italicMatch[1], bold: false, italic: false, code: false });
      }
      segments.push({ text: italicMatch[2] || '', bold: false, italic: true, code: false });
      remaining = italicMatch[3] || '';
      continue;
    }

    // No more formatting found
    segments.push({ text: remaining, bold: false, italic: false, code: false });
    break;
  }

  return segments;
}

/**
 * Render formatted text segments at a position
 * Returns the final X position
 * Note: Reserved for future enhancement of inline formatting support
 */
function _renderFormattedText(
  doc: jsPDF,
  segments: _TextSegment[],
  x: number,
  y: number,
  maxWidth: number,
  baseFontSize: number = PDF_FONT_SIZES.small
): { endX: number; lines: number } {
  let currentX = x;
  const lines = 1;
  void maxWidth; // Reserved for future wrapping logic

  for (const segment of segments) {
    if (segment.code) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(baseFontSize - 1);
      doc.setTextColor(...hexToRgb(PDF_COLORS.teal));
    } else {
      doc.setFont('helvetica', segment.bold ? 'bold' : segment.italic ? 'italic' : 'normal');
      doc.setFontSize(baseFontSize);
      doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
    }

    const textWidth = doc.getTextWidth(segment.text);
    doc.text(segment.text, currentX, y);
    currentX += textWidth;
  }

  return { endX: currentX, lines };
}

// Suppress unused warnings - these are reserved for future inline formatting enhancement
void _parseInlineFormatting;
void _renderFormattedText;
void renderTextWithBold;

/**
 * Strip bold markers from text for measuring/display
 */
function stripBold(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '$1');
}

/**
 * Render text with inline bold support
 * Handles **bold** markers within text
 */
function renderTextWithBold(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number = PDF_FONT_SIZES.small
): number {
  // Split text into segments with bold markers
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  let currentX = x;
  let currentY = y;
  const lineHeight = fontSize * 0.5;

  doc.setFontSize(fontSize);

  for (const part of parts) {
    if (!part) continue;

    const isBold = part.startsWith('**') && part.endsWith('**');
    const content = isBold ? part.slice(2, -2) : part;

    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));

    // Check if we need to wrap
    const textWidth = doc.getTextWidth(content);
    if (currentX + textWidth > x + maxWidth) {
      // Wrap to next line
      currentY += lineHeight;
      currentX = x;
    }

    doc.text(content, currentX, currentY);
    currentX += textWidth;
  }

  return currentY;
}

/**
 * Main function: Render markdown content to PDF
 * Returns the final Y position after rendering
 */
export function renderMarkdownToPdf(
  doc: jsPDF,
  content: string,
  options: RenderOptions
): number {
  const { startX, startY, maxWidth, lineHeight = 4.5, indent = 0 } = options;
  let y = startY;
  const effectiveX = startX + indent;
  const effectiveWidth = maxWidth - indent;
  const blocks = parseMarkdown(content);

  for (const block of blocks) {
    // Check for page break
    const estimatedHeight = block.type === 'code' ? 30 : block.type === 'blockquote' ? 20 : 12;
    if (y + estimatedHeight > PDF_PAGE.height - 25) {
      doc.addPage();
      y = PDF_SPACING.pageMargin;
    }

    switch (block.type) {
      case 'h1': {
        y += 6; // Extra space before h1
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(PDF_FONT_SIZES.heading1);
        doc.setTextColor(...hexToRgb(PDF_COLORS.navy));

        const lines = doc.splitTextToSize(stripBold(block.content), effectiveWidth);
        doc.text(lines, effectiveX, y);
        y += lines.length * 6;

        // Full width underline
        doc.setDrawColor(...hexToRgb(PDF_COLORS.teal));
        doc.setLineWidth(0.5);
        doc.line(effectiveX, y, effectiveX + effectiveWidth * 0.6, y);
        y += 6;
        break;
      }

      case 'h2': {
        y += 5; // Extra space before h2
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(PDF_FONT_SIZES.heading2);
        doc.setTextColor(...hexToRgb(PDF_COLORS.navy));

        const lines = doc.splitTextToSize(stripBold(block.content), effectiveWidth);
        doc.text(lines, effectiveX, y);
        y += lines.length * 5;

        // Accent underline
        doc.setDrawColor(...hexToRgb(PDF_COLORS.teal));
        doc.setLineWidth(0.4);
        doc.line(effectiveX, y, effectiveX + Math.min(doc.getTextWidth(stripBold(block.content)), effectiveWidth * 0.5), y);
        y += 5;
        break;
      }

      case 'h3': {
        y += 4; // Extra space before h3
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(PDF_FONT_SIZES.heading3);
        doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));

        const lines = doc.splitTextToSize(stripBold(block.content), effectiveWidth);
        doc.text(lines, effectiveX, y);
        y += lines.length * 4.5 + 2;
        break;
      }

      case 'h4': {
        y += 3;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(PDF_FONT_SIZES.body);
        doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));

        const lines = doc.splitTextToSize(stripBold(block.content), effectiveWidth);
        doc.text(lines, effectiveX, y);
        y += lines.length * 4 + 2;
        break;
      }

      case 'hr': {
        y += 4;
        doc.setDrawColor(...hexToRgb(PDF_COLORS.borderLight));
        doc.setLineWidth(0.3);
        doc.line(effectiveX, y, effectiveX + effectiveWidth, y);
        y += 6;
        break;
      }

      case 'keyvalue': {
        // Key-Value pattern: **Key:** Value - with bold key and teal accent
        const bulletIndentKV = 8; // Space for bullet point
        doc.setFillColor(...hexToRgb(PDF_COLORS.teal));
        doc.circle(effectiveX + 2, y - 1, 1, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(PDF_FONT_SIZES.small);
        doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
        const keyText = `${block.key}:`;
        doc.text(keyText, effectiveX + bulletIndentKV, y);

        const keyWidth = doc.getTextWidth(keyText);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));

        // Calculate value width accounting for bullet and key
        const valueStartX = effectiveX + bulletIndentKV + keyWidth + 2;
        const firstLineWidth = Math.max(effectiveWidth - bulletIndentKV - keyWidth - 4, 30);
        const wrapLineWidth = Math.max(effectiveWidth - bulletIndentKV, 40);

        // First line sits after the key
        const firstLineValue = doc.splitTextToSize(stripBold(block.content), firstLineWidth);
        if (firstLineValue.length > 0) {
          doc.text(firstLineValue[0] || '', valueStartX, y);
        }

        // Wrapped lines align with the key start position
        if (firstLineValue.length > 1) {
          // Re-wrap remaining content at the full width
          const remainingText = stripBold(block.content).slice((firstLineValue[0] || '').length).trim();
          if (remainingText) {
            const wrapLines = doc.splitTextToSize(remainingText, wrapLineWidth);
            for (const wrapLine of wrapLines) {
              y += lineHeight;
              doc.text(wrapLine, effectiveX + bulletIndentKV, y);
            }
          }
        }
        y += lineHeight + 1;
        break;
      }

      case 'bullet': {
        // Bullet point
        doc.setFillColor(...hexToRgb(PDF_COLORS.teal));
        doc.circle(effectiveX + 2, y - 1, 1, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(PDF_FONT_SIZES.small);
        doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));

        const bulletIndent = 8;
        const lines = doc.splitTextToSize(stripBold(block.content), effectiveWidth - bulletIndent);

        if (lines.length > 0) {
          doc.text(lines, effectiveX + bulletIndent, y);
          y += lines.length * lineHeight + 1;
        }
        break;
      }

      case 'numbered': {
        // Number with teal color
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(PDF_FONT_SIZES.small);
        doc.setTextColor(...hexToRgb(PDF_COLORS.teal));
        const numText = `${block.level}.`;
        doc.text(numText, effectiveX, y);

        // Calculate actual number width + padding for proper text wrapping
        const numWidth = doc.getTextWidth(numText);
        const numIndent = numWidth + 4; // 4mm padding after number

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));

        // Ensure we have valid width for text wrapping
        const availableWidth = Math.max(effectiveWidth - numIndent, 40);
        const lines = doc.splitTextToSize(stripBold(block.content), availableWidth);
        doc.text(lines, effectiveX + numIndent, y);
        y += lines.length * lineHeight + 1;
        break;
      }

      case 'code': {
        y += 2;
        // Code block with dark background
        doc.setFont('courier', 'normal');
        doc.setFontSize(PDF_FONT_SIZES.caption);

        // Calculate actual character width using font metrics
        const charWidth = doc.getTextWidth('M'); // Use 'M' as reference for monospace
        const codePadding = 8; // 4mm padding on each side
        const availableCodeWidth = effectiveWidth - codePadding;
        const maxChars = Math.max(Math.floor(availableCodeWidth / charWidth), 20);

        const codeLines = block.content.split('\n');
        // Truncate long code blocks
        const maxCodeLines = Math.min(codeLines.length, 15);
        const codeHeight = maxCodeLines * 3.5 + 6;

        doc.setFillColor(...hexToRgb('#1E293B'));
        doc.roundedRect(effectiveX, y - 3, effectiveWidth, codeHeight, 2, 2, 'F');

        doc.setTextColor(...hexToRgb('#E2E8F0'));
        for (let i = 0; i < maxCodeLines; i++) {
          const codeLine = codeLines[i] || '';
          // Truncate if line exceeds max chars
          const truncated = codeLine.length > maxChars ? codeLine.slice(0, maxChars - 3) + '...' : codeLine;
          doc.text(truncated, effectiveX + 4, y + i * 3.5);
        }
        if (codeLines.length > maxCodeLines) {
          doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
          doc.text(`... ${codeLines.length - maxCodeLines} more lines`, effectiveX + 4, y + maxCodeLines * 3.5);
        }
        y += codeHeight + 3;
        break;
      }

      case 'blockquote': {
        // Blockquote with teal left bar - visual anchor per design system
        const quoteLines = block.content.split('\n');
        const quoteHeight = Math.max(quoteLines.length * lineHeight + 6, 12);

        // Background
        doc.setFillColor(...hexToRgb('#F8FAFC'));
        doc.roundedRect(effectiveX, y - 4, effectiveWidth, quoteHeight, 2, 2, 'F');

        // Teal left bar
        doc.setFillColor(...hexToRgb(PDF_COLORS.teal));
        doc.rect(effectiveX, y - 4, 3, quoteHeight, 'F');

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(PDF_FONT_SIZES.small);
        doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));

        let quoteY = y;
        for (const quoteLine of quoteLines) {
          // Check for bold key-value in blockquote
          const kvMatch = quoteLine.match(/^\*\*([^:*]+):\*\*\s*(.*)$/);
          if (kvMatch) {
            doc.setFont('helvetica', 'bolditalic');
            doc.text(`${kvMatch[1]}:`, effectiveX + 8, quoteY);
            doc.setFont('helvetica', 'italic');
            const keyWidth = doc.getTextWidth(`${kvMatch[1]}: `);
            doc.text(kvMatch[2] || '', effectiveX + 8 + keyWidth, quoteY);
          } else {
            const wrappedLines = doc.splitTextToSize(stripBold(quoteLine), effectiveWidth - 12);
            doc.text(wrappedLines, effectiveX + 8, quoteY);
            quoteY += (wrappedLines.length - 1) * lineHeight;
          }
          quoteY += lineHeight;
        }
        y += quoteHeight + 2;
        break;
      }

      case 'paragraph':
      default: {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(PDF_FONT_SIZES.small);
        doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));

        const lines = doc.splitTextToSize(stripBold(block.content), effectiveWidth);

        // Check if content will overflow page
        const contentHeight = lines.length * lineHeight;
        if (y + contentHeight > PDF_PAGE.height - 25) {
          // Split across pages
          const linesPerPage = Math.floor((PDF_PAGE.height - y - 25) / lineHeight);
          let remainingLines = [...lines];

          while (remainingLines.length > 0) {
            const pageLines = remainingLines.slice(0, Math.max(linesPerPage, 1));
            remainingLines = remainingLines.slice(Math.max(linesPerPage, 1));

            doc.text(pageLines, effectiveX, y);

            if (remainingLines.length > 0) {
              doc.addPage();
              y = PDF_SPACING.pageMargin;
            } else {
              y += pageLines.length * lineHeight;
            }
          }
        } else {
          doc.text(lines, effectiveX, y);
          y += lines.length * lineHeight;
        }
        y += 2; // Paragraph spacing
        break;
      }
    }
  }

  return y;
}

/**
 * Render content with a styled box container
 */
export function renderMarkdownInBox(
  doc: jsPDF,
  content: string,
  startX: number,
  startY: number,
  maxWidth: number,
  boxPadding: number = 8
): number {
  // First, calculate approximate height by parsing
  const blocks = parseMarkdown(content);
  let estimatedHeight = 0;

  for (const block of blocks) {
    doc.setFontSize(PDF_FONT_SIZES.small);
    const textLines = doc.splitTextToSize(block.content, maxWidth - boxPadding * 2);
    estimatedHeight += textLines.length * 4.5 + (block.type.startsWith('h') ? 6 : 2);
  }

  // Check if we need a new page before starting
  if (startY + Math.min(estimatedHeight, 100) > PDF_PAGE.height - 30) {
    doc.addPage();
    startY = PDF_SPACING.pageMargin;
  }

  // Render content first to calculate actual height
  const contentStartY = startY + boxPadding;
  const endY = renderMarkdownToPdf(doc, content, {
    startX: startX + boxPadding,
    startY: contentStartY,
    maxWidth: maxWidth - boxPadding * 2,
  });

  return endY + boxPadding;
}
