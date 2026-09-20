import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  PlusCircle,
  Trash2,
  Settings2,
  ChevronDown,
  Globe,
  Sliders,
  History,
  Check,
  X,
} from 'lucide-react';
import { AITutorSession, AIExplanationDepth, AILanguage } from '../../../types/ai';

export interface AIChatHeaderProps {
  currentSession: AITutorSession;
  allSessions: AITutorSession[];
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onClearSession: () => void;
  explanationDepth: AIExplanationDepth;
  onChangeExplanationDepth: (depth: AIExplanationDepth) => void;
  language: AILanguage;
  onChangeLanguage: (lang: AILanguage) => void;
  onBack?: () => void;
}

export const AIChatHeader: React.FC<AIChatHeaderProps> = ({
  currentSession,
  allSessions,
  onSelectSession,
  onNewSession,
  onClearSession,
  explanationDepth,
  onChangeExplanationDepth,
  language,
  onChangeLanguage,
  onBack,
}) => {
  const [showSessionsMenu, setShowSessionsMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  return (
    <header className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-3 relative z-30 transition-colors">
      {/* Left: Brand, Title, Subtitle */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
          <Bot className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              AI Tutor
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
              <Sparkles className="w-3 h-3" /> Adaptive
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            Your personal learning companion.
          </p>
        </div>
      </div>

      {/* Right: Sessions switcher, Settings, Clear, New Session */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Sessions Dropdown Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowSessionsMenu(!showSessionsMenu);
              setShowSettingsMenu(false);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors max-w-[140px] sm:max-w-[200px]"
          >
            <History className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate text-[11px]">{currentSession.title}</span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          </button>

          {showSessionsMenu && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Recent Learning Sessions</span>
                <button
                  type="button"
                  onClick={() => setShowSessionsMenu(false)}
                  className="p-0.5 rounded text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto py-1 space-y-1">
                {allSessions.map((sess) => (
                  <button
                    key={sess.id}
                    type="button"
                    onClick={() => {
                      onSelectSession(sess.id);
                      setShowSessionsMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors ${
                      sess.id === currentSession.id
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate">{sess.title}</div>
                      <div className="text-[10px] text-slate-400">{sess.updatedAt}</div>
                    </div>
                    {sess.id === currentSession.id && (
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    onNewSession();
                    setShowSessionsMenu(false);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Start New Session</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* AI Preferences Dropdown (Depth & Language) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowSettingsMenu(!showSettingsMenu);
              setShowSessionsMenu(false);
            }}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="AI Settings & Depth"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {showSettingsMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Explanation Depth
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                  {(['short', 'normal', 'detailed'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onChangeExplanationDepth(d)}
                      className={`py-1 rounded-lg font-bold capitalize transition-all ${
                        explanationDepth === d
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Tutor Language
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                  {(
                    [
                      { id: 'en', label: 'English' },
                      { id: 'id', label: 'Indonesia' },
                    ] as const
                  ).map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => onChangeLanguage(l.id)}
                      className={`py-1 rounded-lg font-bold transition-all ${
                        language === l.id
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Clear Conversation */}
        <button
          type="button"
          onClick={onClearSession}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          title="Clear messages in this session"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Start New Session */}
        <button
          type="button"
          onClick={onNewSession}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </div>
    </header>
  );
};
