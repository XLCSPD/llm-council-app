import { FileText, Loader2 } from 'lucide-react';
import { usePdfGeneration } from '../hooks/usePdfGeneration';
import type { FullSessionData } from '@/types';

interface DownloadReportButtonBaseProps {
  includeReasoning?: boolean;
  includeReview?: boolean;
  variant?: 'default' | 'compact';
  className?: string;
}

interface DownloadReportButtonWithDataProps extends DownloadReportButtonBaseProps {
  sessionData: FullSessionData;
  sessionId?: never;
}

interface DownloadReportButtonWithIdProps extends DownloadReportButtonBaseProps {
  sessionId: string;
  sessionData?: never;
}

type DownloadReportButtonProps = DownloadReportButtonWithDataProps | DownloadReportButtonWithIdProps;

/**
 * Button component to download a PDF report of a council session
 * Displays loading state during generation and error handling
 *
 * Supports two modes:
 * - sessionData: Pass FullSessionData directly (for replay mode)
 * - sessionId: Pass session ID to fetch data automatically (for normal mode)
 */
export function DownloadReportButton({
  sessionData,
  sessionId,
  includeReasoning = true,
  includeReview = true,
  variant = 'default',
  className = '',
}: DownloadReportButtonProps) {
  const { generateReport, generateReportFromSession, isGenerating, error } = usePdfGeneration({
    includeReasoning,
    includeReview,
  });

  const handleClick = () => {
    if (sessionData) {
      generateReport(sessionData);
    } else if (sessionId) {
      generateReportFromSession(sessionId);
    }
  };

  // Check if we have minimum required data
  const hasMinimumData = sessionData
    ? !!(sessionData.session && sessionData.run)
    : !!sessionId;

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        disabled={isGenerating || !hasMinimumData}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
          rounded-lg transition-all duration-200
          ${isGenerating
            ? 'bg-slate-700 text-slate-400 cursor-wait'
            : hasMinimumData
              ? 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-lg shadow-teal-500/20'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }
          ${className}`}
        title={!hasMinimumData ? 'Session data incomplete' : 'Download PDF report'}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            <span>PDF Report</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleClick}
        disabled={isGenerating || !hasMinimumData}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
          rounded-lg transition-all duration-200
          ${isGenerating
            ? 'bg-slate-700 text-slate-400 cursor-wait'
            : hasMinimumData
              ? 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-lg shadow-teal-500/20'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }
          ${className}`}
        title={!hasMinimumData ? 'Session data incomplete' : 'Download comprehensive PDF report'}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating Report...</span>
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            <span>Download PDF Report</span>
          </>
        )}
      </button>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {!hasMinimumData && (
        <p className="text-xs text-slate-500">
          Complete session data required
        </p>
      )}
    </div>
  );
}
