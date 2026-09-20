import React, { useState } from 'react';
import { Sparkles, Layers, BookOpen, CheckCircle, Code } from 'lucide-react';
import { AIExplanationLevel } from '../../../types/ai';

export interface AIExplanationCardProps {
  topic: string;
  initialLevel?: AIExplanationLevel;
  beginnerText?: string;
  intermediateText?: string;
  advancedText?: string;
  exampleSnippet?: string;
  keyTakeaway?: string;
  onAskTutor?: (question: string) => void;
}

export const AIExplanationCard: React.FC<AIExplanationCardProps> = ({
  topic,
  initialLevel = 'intermediate',
  beginnerText,
  intermediateText,
  advancedText,
  exampleSnippet,
  keyTakeaway,
  onAskTutor,
}) => {
  const [level, setLevel] = useState<AIExplanationLevel>(initialLevel);

  const defaultBeginner =
    beginnerText ||
    'Think of this concept like a reusable recipe or kitchen appliance. You provide raw ingredients (parameters), it runs the cooking steps, and delivers a prepared dish (return value).';

  const defaultIntermediate =
    intermediateText ||
    'Functions encapsulate logic with single responsibility. They isolate variable scope, prevent repetitive code, and return deterministic results for predictable application state.';

  const defaultAdvanced =
    advancedText ||
    'Under the hood, JavaScript creates an execution context with an Environment Record. Closures persist lexical environment references on the heap, preventing premature garbage collection.';

  const contentMap: Record<AIExplanationLevel, string> = {
    beginner: defaultBeginner,
    intermediate: defaultIntermediate,
    advanced: defaultAdvanced,
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header & Level Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Explain: {topic}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pedagogical concept breakdown adapted to your comprehension level
          </p>
        </div>

        {/* Level Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs self-start sm:self-auto">
          {(['beginner', 'intermediate', 'advanced'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all ${
                level === l
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Main Explanation Body */}
      <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
        {contentMap[level]}
      </div>

      {/* Code Example (if available) */}
      {exampleSnippet && (
        <div className="rounded-xl overflow-hidden bg-slate-950 text-slate-100 text-xs font-mono border border-slate-800">
          <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-sans">
            <span className="flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-blue-400" />
              Example Code
            </span>
            <span>TypeScript</span>
          </div>
          <pre className="p-3 overflow-x-auto text-[11px] leading-relaxed">
            <code>{exampleSnippet}</code>
          </pre>
        </div>
      )}

      {/* Key Takeaway */}
      <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 flex items-start gap-2 text-xs">
        <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-blue-900 dark:text-blue-200">Key Takeaway: </span>
          <span className="text-blue-800/90 dark:text-blue-300">
            {keyTakeaway ||
              'Always favor clarity and pure input/output design over complex nested side effects.'}
          </span>
        </div>
      </div>

      {/* Footer Ask AI Question */}
      {onAskTutor && (
        <div className="pt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onAskTutor(`Can you explain ${topic} deeper with another example?`)}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Ask AI Tutor a follow-up question</span>
            <span>→</span>
          </button>
        </div>
      )}
    </div>
  );
};
