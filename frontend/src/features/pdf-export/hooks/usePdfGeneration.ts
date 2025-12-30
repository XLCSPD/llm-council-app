import { useState, useCallback } from 'react';
import { generateSessionReport, downloadBlob, generateReportFilename } from '../lib/pdfGenerator';
import { sessionsApi } from '@/api';
import type { FullSessionData } from '@/types';

interface UsePdfGenerationOptions {
  includeReasoning?: boolean;
  includeReview?: boolean;
}

interface UsePdfGenerationReturn {
  generateReport: (sessionData: FullSessionData) => Promise<void>;
  generateReportFromSession: (sessionId: string) => Promise<void>;
  isGenerating: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * React hook for PDF report generation
 * Handles loading state, error handling, and download triggering
 *
 * Supports two modes:
 * - generateReport: Direct generation from FullSessionData (for replay mode)
 * - generateReportFromSession: Fetches data by sessionId first (for normal mode)
 */
export function usePdfGeneration(options: UsePdfGenerationOptions = {}): UsePdfGenerationReturn {
  const { includeReasoning = true, includeReview = true } = options;

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReportInternal = async (sessionData: FullSessionData) => {
    // Validate session data
    if (!sessionData.session) {
      throw new Error('Session data is missing');
    }

    if (!sessionData.run) {
      throw new Error('Run data is missing');
    }

    // Generate the PDF
    const blob = await generateSessionReport({
      sessionData,
      includeReasoning,
      includeReview,
    });

    // Generate filename and trigger download
    const filename = generateReportFilename(
      sessionData.session.title,
      sessionData.session.created_at
    );

    downloadBlob(blob, filename);
  };

  const generateReport = useCallback(async (sessionData: FullSessionData) => {
    setIsGenerating(true);
    setError(null);

    try {
      await generateReportInternal(sessionData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF report';
      setError(errorMessage);
      console.error('PDF generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [includeReasoning, includeReview]);

  const generateReportFromSession = useCallback(async (sessionId: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Fetch full session data first
      const sessionData = await sessionsApi.getFullSession(sessionId);
      await generateReportInternal(sessionData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF report';
      setError(errorMessage);
      console.error('PDF generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [includeReasoning, includeReview]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    generateReport,
    generateReportFromSession,
    isGenerating,
    error,
    clearError,
  };
}
