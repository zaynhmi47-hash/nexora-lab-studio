import React from 'react';
import {
  Brain,
  Sparkles,
  BookOpen,
  HelpCircle,
  RotateCcw,
  ArrowRight,
  Code,
  Zap,
  Calendar,
} from 'lucide-react';
import { AIAction } from '../../../types/ai';

export interface AIActionBarProps {
  actions: AIAction[];
  onActionClick: (action: AIAction) => void;
  disabled?: boolean;
}

export const AIActionBar: React.FC<AIActionBarProps> = ({
  actions,
  onActionClick,
  disabled = false,
}) => {
  if (!actions || actions.length === 0) return null;

  const getActionIcon = (type: AIAction['actionType']) => {
    switch (type) {
      case 'practice_skill':
        return Brain;
      case 'quiz_me':
        return Zap;
      case 'give_example':
        return Code;
      case 'simplify':
        return Sparkles;
      case 'explain_deeper':
        return HelpCircle;
      case 'try_another_question':
        return RotateCcw;
      case 'open_lesson':
        return BookOpen;
      case 'view_study_plan':
        return Calendar;
      default:
        return ArrowRight;
    }
  };

  return (
    <div className="flex flex-wrap gap-2 pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/80">
      {actions.map((act) => {
        const Icon = getActionIcon(act.actionType);
        const isPrimary = act.variant === 'primary';

        return (
          <button
            key={act.id}
            type="button"
            disabled={disabled}
            onClick={() => onActionClick(act)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs ${
              isPrimary
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span>{act.label}</span>
          </button>
        );
      })}
    </div>
  );
};
