import React, { useRef, useEffect } from 'react';
import { Bot, Sparkles, HelpCircle, Code, Brain, BookOpen } from 'lucide-react';
import { AIMessage, AIAction } from '../../../types/ai';
import { AIMessageBubble } from './AIMessageBubble';
import { AIThinkingIndicator } from './AIThinkingIndicator';

export interface AIConversationProps {
  messages: AIMessage[];
  isThinking: boolean;
  onActionClick: (action: AIAction) => void;
  onSelectPrompt: (prompt: string) => void;
}

export const AIConversation: React.FC<AIConversationProps> = ({
  messages,
  isThinking,
  onActionClick,
  onSelectPrompt,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-sm">
          <Bot className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Ask me anything about what you're learning.
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          I understand your enrolled courses, current lesson concepts, and recent practice mistakes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-left">
          {[
            { title: 'Explain JavaScript Closures', desc: 'Concept breakdown with analogies', prompt: 'Explain JavaScript closures simply' },
            { title: 'Help Me With a Formula', desc: 'Quadratic & derivative steps', prompt: 'Help me understand the quadratic formula' },
            { title: 'Quiz Me on Functions', desc: 'Adaptive comprehension check', prompt: 'Quiz me on JavaScript function parameters' },
            { title: 'Review My Weak Skills', desc: 'Targeted practice diagnostic', prompt: 'What are my weakest skills right now?' },
          ].map((card, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectPrompt(card.prompt)}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-left transition-all group shadow-2xs"
            >
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {card.title}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                {card.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      {messages.map((msg) => (
        <AIMessageBubble
          key={msg.id}
          message={msg}
          onActionClick={onActionClick}
        />
      ))}

      {isThinking && (
        <div className="self-start">
          <AIThinkingIndicator />
        </div>
      )}

      <div ref={bottomRef} className="h-2" />
    </div>
  );
};
