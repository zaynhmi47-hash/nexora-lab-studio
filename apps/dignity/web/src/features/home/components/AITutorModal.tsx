import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Send, X, ExternalLink, HelpCircle, Code, Brain } from 'lucide-react';
import { Modal } from '../../../components/ui/Overlay';
import { aiTutorService } from '../../../services/ai/aiTutorService';
import { AIMessage } from '../../../types/ai';

export interface AITutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPrompt?: string;
  onOpenFullWorkspace?: () => void;
  onExploreCourse?: (courseTitle: string) => void;
}

export const AITutorModal: React.FC<AITutorModalProps> = ({
  isOpen,
  onClose,
  defaultPrompt,
  onOpenFullWorkspace,
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputVal, setInputVal] = useState(defaultPrompt || '');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const active = aiTutorService.getActiveSession();
      setMessages([...active.messages]);
      if (defaultPrompt) {
        setInputVal(defaultPrompt);
      }
    }
  }, [isOpen, defaultPrompt]);

  const samplePrompts = [
    'Explain JavaScript Closures simply',
    'How do React 19 Server Actions work?',
    'Help me understand the Quadratic Formula',
    'What is Customer Acquisition Cost (CAC)?',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputVal;
    if (!query.trim() || isTyping) return;

    setInputVal('');
    setIsTyping(true);

    try {
      await aiTutorService.askTutor(query);
      const updated = aiTutorService.getActiveSession();
      setMessages([...updated.messages]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex flex-col h-[540px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  AI Personal Learning Tutor
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  Adaptive
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Connected to your active courses & learning goals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenFullWorkspace && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullWorkspace();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                title="Open full AI workspace with study plans and diagnostics"
              >
                <span>Full Screen</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${
                m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {m.role === 'user' ? (
                  <span className="text-xs font-bold">You</span>
                ) : (
                  <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
              </div>

              <div
                className={`max-w-[82%] p-3 rounded-2xl leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200/80 dark:border-slate-800 shadow-2xs'
                }`}
              >
                <div className="whitespace-pre-line">{m.content}</div>
                <span
                  className={`text-[9px] block mt-1 ${
                    m.role === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic pl-9">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-500" />
              <span>AI Tutor is analyzing curriculum context...</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 transition-colors truncate max-w-xs"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question about your curriculum, formulas, or projects..."
            className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputVal.trim() || isTyping}
            className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all focus:outline-none"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
