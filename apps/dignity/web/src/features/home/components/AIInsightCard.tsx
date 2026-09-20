import React from 'react';
import { Sparkles, ArrowRight, MessageSquare, Bot, BookOpen, Lightbulb } from 'lucide-react';
import { Card, CardBody } from '../../../components/ui/Card';
import { AIInsight } from '../../../types';

export interface AIInsightCardProps {
  insight: AIInsight;
  onViewRecommendation: () => void;
  onAskAI: () => void;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({
  insight,
  onViewRecommendation,
  onAskAI,
}) => {
  return (
    <Card
      elevation="subtle"
      className="border border-purple-200/80 dark:border-purple-900/50 bg-linear-to-br from-purple-50/40 via-white to-blue-50/30 dark:from-purple-950/20 dark:via-slate-900 dark:to-blue-950/20 shadow-xs"
    >
      <CardBody className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1">
                {insight.badgeText}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {insight.title}
              </h3>
            </div>
          </div>

          <span className="text-[10px] text-slate-400 font-medium">
            {insight.timestamp}
          </span>
        </div>

        {/* Insight Message */}
        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-purple-100/80 dark:border-purple-900/40 mb-3 space-y-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300 shadow-2xs">
          <p className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>{insight.message}</span>
          </p>

          <div className="pt-2 border-t border-purple-50 dark:border-slate-800/80 flex items-center gap-2 text-[11px] font-medium text-purple-700 dark:text-purple-300">
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Recommended: <strong>{insight.recommendedCourseTitle}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onViewRecommendation}
            className="py-2 px-3 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-950/60 hover:bg-purple-200/70 dark:hover:bg-purple-900/60 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>View Course</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onAskAI}
            className="py-2 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <Bot className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Ask AI Tutor</span>
          </button>
        </div>
      </CardBody>
    </Card>
  );
};
