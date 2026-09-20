import React from 'react';
import { XCircle, CheckCircle2, Lightbulb, RotateCcw, Brain } from 'lucide-react';
import { RecentMistakeContext } from '../../../types/ai';
import { PrimaryButton, SecondaryButton } from '../../../components/ui/Button';

export interface AIMistakeReviewProps {
  mistake: RecentMistakeContext;
  onTrySimilarQuestion?: () => void;
  onPracticeSkill?: (skillName: string) => void;
  onClose?: () => void;
}

export const AIMistakeReview: React.FC<AIMistakeReviewProps> = ({
  mistake,
  onTrySimilarQuestion,
  onPracticeSkill,
  onClose,
}) => {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              AI Mistake Diagnostic
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Targeted analysis of {mistake.skillName || 'this concept'}
            </p>
          </div>
        </div>

        {mistake.skillName && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
            {mistake.skillName}
          </span>
        )}
      </div>

      {/* Question Prompt */}
      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
        "{mistake.questionText}"
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {/* User Answer */}
        <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold mb-1">
            <XCircle className="w-3.5 h-3.5" />
            Your Answer
          </div>
          <p className="text-slate-700 dark:text-slate-300 font-medium">
            {String(mistake.userAnswer)}
          </p>
        </div>

        {/* Correct Answer */}
        <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Correct Answer
          </div>
          <p className="text-slate-700 dark:text-slate-300 font-medium">
            {String(mistake.correctAnswer)}
          </p>
        </div>
      </div>

      {/* Root Misconception Explanation */}
      <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs space-y-1.5">
        <div className="font-bold text-blue-900 dark:text-blue-200">
          Root Misconception & Mental Model:
        </div>
        <p className="text-blue-800/90 dark:text-blue-300 leading-relaxed">
          {mistake.explanation ||
            'Many developers coming from statically typed languages expect strict arity enforcement. In JavaScript, parameters are purely identifiers mapped to undefined if omitted, allowing optional arguments by design.'}
        </p>
      </div>

      {/* Actions */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
        {onPracticeSkill && mistake.skillName && (
          <SecondaryButton
            size="sm"
            onClick={() => onPracticeSkill(mistake.skillName!)}
            className="text-xs"
          >
            <Brain className="w-3.5 h-3.5 mr-1 text-blue-600" />
            <span>Practice {mistake.skillName}</span>
          </SecondaryButton>
        )}

        {onTrySimilarQuestion && (
          <PrimaryButton size="sm" onClick={onTrySimilarQuestion} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>Try Another Question</span>
          </PrimaryButton>
        )}
      </div>
    </div>
  );
};
