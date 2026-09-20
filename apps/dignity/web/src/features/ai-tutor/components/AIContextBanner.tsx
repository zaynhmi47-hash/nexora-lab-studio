import React, { useState } from 'react';
import { BookOpen, Sparkles, CheckCircle2, ChevronDown, ChevronUp, X, Target } from 'lucide-react';
import { AIContext } from '../../../types/ai';

export interface AIContextBannerProps {
  context: AIContext;
  onClearContext?: () => void;
  onSelectSubject?: (subject: AIContext['subjectDomain']) => void;
}

export const AIContextBanner: React.FC<AIContextBannerProps> = ({
  context,
  onClearContext,
  onSelectSubject,
}) => {
  const [expanded, setExpanded] = useState(false);

  const hasCourseContext = Boolean(context.courseTitle || context.lessonTitle);
  const mastery = context.currentMastery || 76;

  return (
    <div className="rounded-2xl border border-blue-200/70 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 px-3 py-2 text-xs transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-blue-600/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-xs">
                {context.lessonTitle || context.courseTitle || 'Interactive Learning'}
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                Mastery {mastery}%
              </span>
              {context.recentMistakes && context.recentMistakes.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                  1 Recent Mistake
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {context.courseTitle ? `${context.courseTitle} • ` : ''}
              {context.skillNames?.[0] || 'Core Competency'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-lg hover:bg-blue-100/60 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium text-[11px] flex items-center gap-0.5"
          >
            <span>{expanded ? 'Hide Context' : 'Context Details'}</span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          {onClearContext && (
            <button
              type="button"
              onClick={onClearContext}
              className="p-1 rounded-lg hover:bg-rose-100/60 dark:hover:bg-rose-900/40 text-slate-400 hover:text-rose-600 transition-colors"
              title="Clear context to general mode"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded context panel */}
      {expanded && (
        <div className="mt-3 pt-2.5 border-t border-blue-200/60 dark:border-blue-900/40 space-y-2 text-[11px] text-slate-600 dark:text-slate-300 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="text-slate-400">Target Goal:</span>{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {context.learningGoal || 'Full-Stack Developer'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Active Module:</span>{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {context.moduleTitle || 'Fundamental Concepts'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Level:</span>{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {context.learningLevel || 'Intermediate'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Explanation Style:</span>{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                {context.preferredExplanationStyle || 'Normal'}
              </span>
            </div>
          </div>

          {/* Quick subject domain switcher */}
          {onSelectSubject && (
            <div className="pt-1.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400">Switch Subject Demo:</span>
              {(['programming', 'mathematics', 'english', 'business'] as const).map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => onSelectSubject(sub)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-colors ${
                    context.subjectDomain === sub
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
