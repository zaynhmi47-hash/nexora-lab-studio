import React from 'react';
import { Sparkles, TrendingUp, Clock, Brain, ArrowUpRight } from 'lucide-react';
import { AILearningInsight } from '../../../types/ai';

export interface AIInsightCardProps {
  insight: AILearningInsight;
  onAction?: (route?: string) => void;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({ insight, onAction }) => {
  const getIcon = (type: AILearningInsight['type']) => {
    switch (type) {
      case 'habit':
        return Clock;
      case 'skill_gain':
        return TrendingUp;
      case 'retention':
        return Brain;
      default:
        return Sparkles;
    }
  };

  const Icon = getIcon(insight.type);

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-2xs hover:border-blue-400/80 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5" />
          </div>
          {insight.isPrototypeNote && (
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              AI Diagnostic
            </span>
          )}
        </div>

        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          {insight.title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
          {insight.description}
        </p>

        {insight.metric && (
          <div className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-900">
            {insight.metric}
          </div>
        )}
      </div>

      {insight.actionLabel && (
        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onAction?.(insight.actionRoute)}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            <span>{insight.actionLabel}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
