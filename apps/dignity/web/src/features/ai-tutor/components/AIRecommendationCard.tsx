import React, { useState } from 'react';
import { Target, Clock, ArrowRight, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { AIRecommendation } from '../../../types/ai';

export interface AIRecommendationCardProps {
  recommendation: AIRecommendation;
  onStart: (recommendation: AIRecommendation) => void;
}

export const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({
  recommendation,
  onStart,
}) => {
  const [showReason, setShowReason] = useState(false);

  const getUrgencyBadge = (urgency: AIRecommendation['urgency']) => {
    switch (urgency) {
      case 'high':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900';
      case 'medium':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      default:
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900';
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-2xs hover:border-blue-400/80 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${getUrgencyBadge(
              recommendation.urgency
            )}`}
          >
            {recommendation.urgency} Priority
          </span>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>~{recommendation.estimatedMinutes}m</span>
          </div>
        </div>

        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mb-1">
          {recommendation.title}
        </h4>

        <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Skill target:</span>
          <span>{recommendation.skillGap}</span>
        </div>

        {showReason && (
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 mb-3 animate-in fade-in duration-150">
            <div className="font-bold text-slate-700 dark:text-slate-200 mb-0.5 flex items-center gap-1">
              <Info className="w-3 h-3 text-blue-500" />
              Pedagogical Diagnostic
            </div>
            {recommendation.reason}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <button
          type="button"
          onClick={() => setShowReason(!showReason)}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          {showReason ? 'Hide Reason' : 'View Reason'}
        </button>

        <button
          type="button"
          onClick={() => onStart(recommendation)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-2xs"
        >
          <span>Start Recommended</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
