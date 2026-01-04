/**
 * DecisionCard - Session history card with council fingerprint
 * Displays session summary with action menu for re-run options
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MoreHorizontal, Play, FileText, Users, RotateCcw, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CouncilFingerprint, CouncilDots } from './CouncilFingerprint';
import { OutcomeIndicators, StarRatingDisplay } from './OutcomeIndicators';
import { useDecisionMemoryStore, useCouncilStore, useSessionStore } from '@/store';
import type {
  DecisionCardData,
  RerunAction,
  ConsensusTier,
  CostTier,
  DepthLevel,
} from '../../types';
import type { SearchResult } from '../../types';

interface DecisionCardProps {
  data: DecisionCardData;
  variant?: 'default' | 'compact' | 'full';
  onDelete?: () => void;
  className?: string;
}

/**
 * Adapter to convert SearchResult to DecisionCardData
 */
export function searchResultToCardData(result: SearchResult): DecisionCardData {
  // Determine consensus tier from agreement data (simplified)
  const consensusTier: ConsensusTier = 'unknown';

  // Determine cost tier
  const costTier: CostTier = result.cost_usd
    ? result.cost_usd < 0.1
      ? 'low'
      : result.cost_usd < 0.5
        ? 'medium'
        : 'high'
    : 'low';

  // Determine depth from run phase
  const phaseDepth: DepthLevel = (result.run_phase as DepthLevel) || 1;

  return {
    sessionId: result.session_id,
    title: result.title,
    promptPreview: result.prompt_content?.substring(0, 150) || '',
    councilMembers: result.council_config?.members?.map((m) => ({
      modelKey: m.model_key,
      displayName: m.display_name,
      role: m.role as 'thinker' | 'critic' | 'devils_advocate' | 'synthesizer',
    })) || [],
    runStatus: result.run_status || 'unknown',
    phaseDepth,
    consensusTier,
    costTier,
    createdAt: result.created_at,
    rating: result.rating,
    tags: result.tags || [],
  };
}

export function DecisionCard({
  data,
  variant = 'default',
  onDelete,
  className = '',
}: DecisionCardProps) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const { prepareRerun } = useDecisionMemoryStore();
  const { setSelectedModels } = useCouncilStore();
  const { updatePrompt, resetSession, loadSessionForReplay } = useSessionStore();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-emerald-500';
      case 'failed':
        return 'bg-red-500';
      case 'running':
        return 'bg-amber-500 animate-pulse';
      default:
        return 'bg-slate-500';
    }
  };

  const handleClick = () => {
    loadSessionForReplay(data.sessionId);
    navigate('/');
  };

  const handleAction = async (action: RerunAction) => {
    setShowMenu(false);

    try {
      const { prompt, council } = await prepareRerun(action, data.sessionId);
      resetSession();

      if (prompt) updatePrompt(prompt);
      if (council) setSelectedModels(council);

      navigate('/');
    } catch (error) {
      console.error('Failed to prepare re-run:', error);
    }
  };

  // Compact variant for sidebar
  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className={`
          group p-3 rounded-xl cursor-pointer
          bg-slate-800/40 hover:bg-slate-800/60
          border border-transparent hover:border-slate-700/50
          transition-all duration-200
          ${className}
        `}
      >
        <div className="flex items-start gap-2.5">
          {/* Status dot */}
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getStatusColor(data.runStatus)}`} />

          <div className="flex-1 min-w-0">
            {/* Title */}
            <h4 className="text-sm font-medium text-slate-200 truncate mb-1">
              {data.title || 'Untitled Session'}
            </h4>

            {/* Council fingerprint + metadata */}
            <div className="flex items-center gap-2">
              <CouncilDots members={data.councilMembers} maxVisible={4} />
              <span className="text-[10px] text-slate-500">{formatDate(data.createdAt)}</span>
              {data.rating && <StarRatingDisplay rating={data.rating} size="sm" />}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full variant with all details
  if (variant === 'full') {
    return (
      <div
        className={`
          relative p-4 rounded-2xl
          bg-slate-800/50 hover:bg-slate-800/70
          border border-slate-700/50 hover:border-slate-600/50
          transition-all duration-200
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0" onClick={handleClick}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(data.runStatus)}`} />
              <h3 className="text-base font-semibold text-slate-200 truncate cursor-pointer hover:text-teal-400 transition-colors">
                {data.title || 'Untitled Session'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 line-clamp-2">{data.promptPreview}</p>
          </div>

          {/* Actions menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  className="absolute right-0 top-full mt-1 w-48 rounded-lg bg-slate-800 border border-slate-700 shadow-xl z-20 py-1"
                >
                  <button
                    onClick={() => { handleClick(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  >
                    <Play className="w-4 h-4" />
                    View Session
                  </button>
                  <button
                    onClick={() => handleAction('reuse-prompt')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  >
                    <FileText className="w-4 h-4" />
                    Reuse Prompt
                  </button>
                  <button
                    onClick={() => handleAction('reuse-council')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  >
                    <Users className="w-4 h-4" />
                    Reuse Council
                  </button>
                  <button
                    onClick={() => handleAction('exact')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Re-run Exact
                  </button>
                  {onDelete && (
                    <>
                      <div className="border-t border-slate-700 my-1" />
                      <button
                        onClick={() => { onDelete(); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Session
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Council fingerprint */}
        <div className="mb-3">
          <CouncilFingerprint members={data.councilMembers} maxVisible={5} size="md" />
        </div>

        {/* Tags */}
        {data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {data.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-0.5 text-[10px] font-medium rounded-full"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Footer with indicators */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
          <OutcomeIndicators
            consensus={data.consensusTier}
            cost={data.costTier}
            depth={data.phaseDepth}
            variant="compact"
          />
          <div className="flex items-center gap-2">
            {data.rating && <StarRatingDisplay rating={data.rating} size="sm" />}
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(data.createdAt)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      onClick={handleClick}
      className={`
        group p-4 rounded-xl cursor-pointer
        bg-slate-800/40 hover:bg-slate-800/60
        border border-transparent hover:border-slate-700/50
        transition-all duration-200
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Status indicator */}
        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${getStatusColor(data.runStatus)}`} />

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-slate-200 truncate">
              {data.title || 'Untitled Session'}
            </h4>
            {data.rating && <StarRatingDisplay rating={data.rating} size="sm" />}
          </div>

          {/* Prompt preview */}
          <p className="text-xs text-slate-400 line-clamp-2 mb-2">
            {data.promptPreview}
          </p>

          {/* Bottom row */}
          <div className="flex items-center justify-between">
            <CouncilFingerprint members={data.councilMembers} maxVisible={4} size="sm" />
            <OutcomeIndicators
              cost={data.costTier}
              depth={data.phaseDepth}
              variant="compact"
            />
          </div>

          {/* Tags */}
          {data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {data.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="px-1.5 py-0.5 text-[10px] font-medium rounded"
                  style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
              {data.tags.length > 3 && (
                <span className="text-[10px] text-slate-500">+{data.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Date */}
        <span className="text-[10px] text-slate-500 flex-shrink-0">
          {formatDate(data.createdAt)}
        </span>
      </div>
    </div>
  );
}
