// Components
export { DownloadReportButton } from './components/DownloadReportButton';

// Hooks
export { usePdfGeneration } from './hooks/usePdfGeneration';

// Core functionality (for advanced usage)
export {
  generateSessionReport,
  downloadBlob,
  generateReportFilename,
} from './lib/pdfGenerator';

// Types
export type { PdfGeneratorOptions } from './lib/pdfGenerator';
