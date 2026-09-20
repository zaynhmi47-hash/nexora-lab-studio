import React, { useState } from 'react';
import { HelpCircle, Sparkles, ChevronRight, Lock, Unlock, CheckCircle } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from '../../../components/ui/Button';

export interface AIHintCardProps {
  questionText: string;
  hint1?: string;
  hint2?: string;
  hint3?: string;
  solutionExplanation?: string;
  onClose?: () => void;
  onTryQuestion?: () => void;
}

export const AIHintCard: React.FC<AIHintCardProps> = ({
  questionText,
  hint1,
  hint2,
  hint3,
  solutionExplanation,
  onClose,
  onTryQuestion,
}) => {
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);
  const [showFullSolution, setShowFullSolution] = useState(false);

  const hints = [
    {
      level: 1,
      title: 'Hint 1: Conceptual Clue',
      content:
        hint1 ||
        'Think about how the runtime initializes variables when no value has been supplied. Does JavaScript fail immediately, or does it assign a default placeholder?',
    },
    {
      level: 2,
      title: 'Hint 2: Specific Guidance',
      content:
        hint2 ||
        'In JavaScript, functions accept flexible argument counts. Any parameter in the signature that is omitted during invocation defaults to a specific primitive type.',
    },
    {
      level: 3,
      title: 'Hint 3: Near-Solution Guidance',
      content:
        hint3 ||
        'The unpassed parameter evaluates strictly to `undefined`. It does not evaluate to `null` and does not throw a `ReferenceError`.',
    },
  ];

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              AI Progressive Hint System
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Unlock clues step-by-step to build independent reasoning
            </p>
          </div>
        </div>

        <div className="text-xs font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/60">
          Hint {unlockedLevel} of 3
        </div>
      </div>

      {/* Question context */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 italic border border-slate-200/60 dark:border-slate-700/60">
        "{questionText}"
      </div>

      {/* Hint list */}
      <div className="space-y-3">
        {hints.map((h) => {
          const isUnlocked = unlockedLevel >= h.level;

          return (
            <div
              key={h.level}
              className={`p-3 rounded-xl border transition-all ${
                isUnlocked
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-slate-800 dark:text-slate-200'
                  : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  {isUnlocked ? (
                    <Unlock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  {h.title}
                </span>
                {!isUnlocked && (
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Locked
                  </span>
                )}
              </div>

              {isUnlocked ? (
                <p className="text-xs leading-relaxed mt-1 text-slate-700 dark:text-slate-300">
                  {h.content}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Try solving with the current clue before unlocking more assistance.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Progressive controls */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
        {unlockedLevel < 3 ? (
          <SecondaryButton
            size="sm"
            onClick={() => setUnlockedLevel((prev) => Math.min(prev + 1, 3))}
            className="text-xs font-bold text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-900"
          >
            Unlock Next Hint (Level {unlockedLevel + 1})
          </SecondaryButton>
        ) : (
          !showFullSolution && (
            <button
              type="button"
              onClick={() => setShowFullSolution(true)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
            >
              Still stuck? Reveal complete pedagogical explanation
            </button>
          )
        )}

        {onTryQuestion && (
          <PrimaryButton size="sm" onClick={onTryQuestion}>
            <span>I'm Ready to Answer</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </PrimaryButton>
        )}
      </div>

      {/* Full solution revealed only as last resort */}
      {showFullSolution && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs space-y-1.5 animate-in fade-in duration-200">
          <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            Complete Conceptual Explanation
          </div>
          <p className="text-blue-800/90 dark:text-blue-300 leading-relaxed">
            {solutionExplanation ||
              'JavaScript parameters are optional by default. When arguments are omitted, the function parameters are set to `undefined`. Use default parameter syntax `(param = defaultValue)` when a fallback is required.'}
          </p>
        </div>
      )}
    </div>
  );
};
