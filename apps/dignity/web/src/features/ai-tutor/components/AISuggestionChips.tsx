import React from 'react';
import { Sparkles, HelpCircle, Code, Brain, BookOpen, Lightbulb } from 'lucide-react';

export interface AISuggestionChipsProps {
  onSelectSuggestion: (prompt: string) => void;
  disabled?: boolean;
}

export const AISuggestionChips: React.FC<AISuggestionChipsProps> = ({
  onSelectSuggestion,
  disabled = false,
}) => {
  const suggestions = [
    { label: 'Explain JavaScript closures', icon: Code },
    { label: 'Help me understand this formula', icon: HelpCircle },
    { label: 'Give me a practice question', icon: Brain },
    { label: 'Why did I get this answer wrong?', icon: Lightbulb },
    { label: "Summarize today's lesson", icon: BookOpen },
    { label: 'Explain recursion simply', icon: Sparkles },
    { label: 'How does Customer Acquisition Cost (CAC) work?', icon: Brain },
    { label: 'Explain English conditionals', icon: BookOpen },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 scrollbar-none">
      {suggestions.map((item, idx) => {
        const Icon = item.icon;
        return (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectSuggestion(item.label)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/70 dark:border-slate-700/60 whitespace-nowrap transition-all duration-150 disabled:opacity-50"
          >
            <Icon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
