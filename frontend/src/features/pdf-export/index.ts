// Components
export { DownloadReportButton } from './components/DownloadReportButton';
export { ResponseExportMenu } from './components/ResponseExportMenu';

// Hooks
export { usePdfGeneration } from './hooks/usePdfGeneration';

// Core functionality (for advanced usage)
export {
  generateSessionReport,
  downloadBlob,
  generateReportFilename,
} from './lib/pdfGenerator';

// Single response exports
export {
  exportResponseAsMarkdown,
  exportResponseAsPdf,
} from './lib/singleResponseExport';

// Reasoning report exports
export {
  exportAllReasoningAsMarkdown,
  exportAllReasoningAsPdf,
} from './lib/reasoningOnlyReport';

// Types
export type { PdfGeneratorOptions } from './lib/pdfGenerator';
