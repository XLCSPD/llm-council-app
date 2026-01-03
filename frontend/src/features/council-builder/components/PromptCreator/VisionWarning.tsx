import { AlertTriangle, Eye } from 'lucide-react';

interface VisionWarningProps {
  /** Number of non-vision models in the council */
  nonVisionCount: number;
  /** Total models in the council */
  totalCount: number;
  /** Callback to filter to vision-only models */
  onFilterVision?: () => void;
}

/**
 * Warning banner shown when attachments are added but
 * some models in the council don't support vision.
 */
export function VisionWarning({
  nonVisionCount,
  totalCount,
  onFilterVision,
}: VisionWarningProps) {
  if (nonVisionCount === 0) return null;

  const allNonVision = nonVisionCount === totalCount;

  return (
    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-amber-200 font-medium">
            {allNonVision
              ? 'No vision-capable models selected'
              : `${nonVisionCount} of ${totalCount} models cannot view attachments`
            }
          </p>
          <p className="text-xs text-amber-300/80 mt-1">
            {allNonVision
              ? 'None of your selected models can process images or PDFs. They will only receive text descriptions of your attachments.'
              : 'Some models in your council cannot process images or PDFs. They will only receive text descriptions of your attachments.'
            }
          </p>
          {onFilterVision && (
            <button
              onClick={onFilterVision}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Show only vision-capable models
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
