import React, { useState } from 'react';
import { Bot, User, Copy, Check, Sparkles } from 'lucide-react';
import { AIMessage, AIAction } from '../../../types/ai';
import { AIActionBar } from './AIActionBar';

export interface AIMessageBubbleProps {
  message: AIMessage;
  onActionClick: (action: AIAction) => void;
}

export const AIMessageBubble: React.FC<AIMessageBubbleProps> = ({
  message,
  onActionClick,
}) => {
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Light-weight Markdown-like parser for educational formatting
  const renderFormattedContent = (rawText: string) => {
    // Split by code blocks first
    const parts = rawText.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const firstLine = lines[0].trim();
        const hasLang = /^[a-z0-9_-]+$/i.test(firstLine);
        const lang = hasLang ? firstLine : '';
        const codeLines = hasLang ? lines.slice(1) : lines;
        const codeText = codeLines.join('\n');

        return (
          <div
            key={index}
            className="my-3 rounded-xl overflow-hidden bg-slate-900 text-slate-100 text-xs font-mono border border-slate-800"
          >
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/80 border-b border-slate-700/60 text-[10px] text-slate-400 font-sans">
              <span>{lang || 'code'}</span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(codeText)}
                className="hover:text-white transition-colors"
                title="Copy code"
              >
                Copy
              </button>
            </div>
            <pre className="p-3 overflow-x-auto leading-relaxed">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }

      // Paragraph lines
      const paragraphs = part.split('\n');
      return (
        <div key={index} className="space-y-2">
          {paragraphs.map((p, pIdx) => {
            const trimmed = p.trim();
            if (!trimmed) return <div key={pIdx} className="h-1.5" />;

            // Headings
            if (trimmed.startsWith('### ')) {
              return (
                <h4
                  key={pIdx}
                  className="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1"
                >
                  {trimmed.replace('### ', '')}
                </h4>
              );
            }
            if (trimmed.startsWith('## ')) {
              return (
                <h3
                  key={pIdx}
                  className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-1"
                >
                  {trimmed.replace('## ', '')}
                </h3>
              );
            }

            // Bullet items
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              return (
                <li key={pIdx} className="ml-4 list-disc text-xs leading-relaxed">
                  {renderInlineFormatting(trimmed.substring(2))}
                </li>
              );
            }

            // Blockquotes
            if (trimmed.startsWith('> ')) {
              return (
                <blockquote
                  key={pIdx}
                  className="border-l-2 border-blue-500 pl-3 italic text-xs text-slate-600 dark:text-slate-300 my-1"
                >
                  {renderInlineFormatting(trimmed.substring(2))}
                </blockquote>
              );
            }

            return (
              <p key={pIdx} className="text-xs sm:text-sm leading-relaxed">
                {renderInlineFormatting(trimmed)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  // Helper for bold and inline code
  const renderInlineFormatting = (text: string) => {
    // Split by inline code and bold
    const segments = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

    return segments.map((seg, i) => {
      if (seg.startsWith('`') && seg.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-pink-600 dark:text-pink-400 font-mono text-[11px]"
          >
            {seg.slice(1, -1)}
          </code>
        );
      }
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-white">
            {seg.slice(2, -2)}
          </strong>
        );
      }
      return seg;
    });
  };

  return (
    <div
      className={`flex gap-3 max-w-3xl ${
        isAssistant ? 'self-start' : 'self-end flex-row-reverse'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
          isAssistant
            ? 'bg-blue-600 text-white shadow-blue-500/20'
            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
        }`}
      >
        {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      {/* Bubble Body */}
      <div
        className={`min-w-0 rounded-2xl p-4 shadow-2xs ${
          isAssistant
            ? 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200'
            : 'bg-blue-600 text-white rounded-br-xs'
        }`}
      >
        {/* Header row for Assistant with timestamp and copy */}
        {isAssistant && (
          <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>AI Tutor</span>
              {message.metadata?.explanationLevel && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] uppercase font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50">
                  {message.metadata.explanationLevel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>{message.timestamp}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                title="Copy response"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="text-slate-800 dark:text-slate-200">
          {renderFormattedContent(message.content)}
        </div>

        {/* Action Bar */}
        {isAssistant && message.metadata?.actions && (
          <AIActionBar
            actions={message.metadata.actions}
            onActionClick={onActionClick}
          />
        )}
      </div>
    </div>
  );
};
