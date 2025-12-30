/**
 * PDF Styling Configuration for LLM Council Reports
 * Light theme for printer-friendly output with EveryDAI brand colors
 */

// Brand Colors (Light Theme)
export const PDF_COLORS = {
  // Backgrounds
  white: '#FFFFFF',
  lightGray: '#F8FAFC',
  cardBg: '#F1F5F9',
  borderLight: '#E2E8F0',

  // Brand
  teal: '#0D9488',
  cyan: '#5EEAD4',
  navy: '#1A365D',

  // Text
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  // Role Colors
  thinker: '#6366F1',
  critic: '#F59E0B',
  devilsAdvocate: '#EF4444',
  synthesizer: '#0D9488',

  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
} as const;

// Role color mapping
export const ROLE_COLORS: Record<string, string> = {
  thinker: PDF_COLORS.thinker,
  critic: PDF_COLORS.critic,
  devils_advocate: PDF_COLORS.devilsAdvocate,
  synthesizer: PDF_COLORS.synthesizer,
  chair: PDF_COLORS.synthesizer,
  chairman: PDF_COLORS.synthesizer,
};

// Role display names
export const ROLE_LABELS: Record<string, string> = {
  thinker: 'Thinker',
  critic: 'Critic',
  devils_advocate: "Devil's Advocate",
  synthesizer: 'Synthesizer',
  chair: 'Chair',
  chairman: 'Chairman',
};

// Typography Settings
export const PDF_FONTS = {
  heading: 'helvetica',
  body: 'helvetica',
  mono: 'courier',
} as const;

export const PDF_FONT_SIZES = {
  title: 24,
  heading1: 18,
  heading2: 14,
  heading3: 12,
  body: 10,
  small: 9,
  caption: 8,
} as const;

// Spacing (in mm)
export const PDF_SPACING = {
  pageMargin: 20,
  sectionGap: 15,
  paragraphGap: 8,
  lineHeight: 5,
  smallGap: 4,
} as const;

// Page dimensions (A4 in mm)
export const PDF_PAGE = {
  width: 210,
  height: 297,
  contentWidth: 170, // width - 2 * pageMargin
} as const;

// Helper to convert hex to RGB for jsPDF
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || result.length < 4) return [0, 0, 0];
  return [
    parseInt(result[1]!, 16),
    parseInt(result[2]!, 16),
    parseInt(result[3]!, 16),
  ];
}

// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format duration from ms
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
}

// Format cost
export function formatCost(cost: number | null): string {
  if (cost === null || cost === undefined) return 'N/A';
  return `$${cost.toFixed(4)}`;
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Word wrap for jsPDF
export function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  // Approximate characters per line based on font size
  const charsPerLine = Math.floor(maxWidth / (fontSize * 0.5));
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length > charsPerLine && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}
