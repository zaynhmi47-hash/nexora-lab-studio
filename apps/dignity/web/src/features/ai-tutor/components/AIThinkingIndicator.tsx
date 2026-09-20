import React from 'react';
import { Sparkles } from 'lucide-react';

export interface AIThinkingIndicatorProps {
  label?: string;
}

export const AIThinkingIndicator: React.FC<AIThinkingIndicatorProps> = ({
  label = 'AI Tutor is analyzing curriculum context...',
}) => {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 max-w-md animate-pulse">
      <div className="w-7 h-7 rounded-xl bg-blue-600/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-blue-900 dark:text-blue-200 truncate">
          {label}
        </div>
        <div className="flex items-center gap-1 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
        </div>
      </div>
    </div>
  );
};
