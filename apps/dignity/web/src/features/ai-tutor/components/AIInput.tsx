import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Sparkles } from 'lucide-react';

export interface AIInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  initialValue?: string;
}

export const AIInput: React.FC<AIInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'What would you like to learn?',
  initialValue = '',
}) => {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
    }
  }, [initialValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-grow
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent px-3 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none max-h-28"
      />

      <div className="flex items-center justify-between pt-1 px-1 border-t border-slate-100 dark:border-slate-800/60 mt-1">
        {/* Voice Prep: clearly disabled / coming soon */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed"
            title="Voice input coming soon in future releases"
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Voice coming soon</span>
          </button>
        </div>

        {/* Send Button */}
        <button
          type="button"
          disabled={!value.trim() || disabled}
          onClick={handleSubmit}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
