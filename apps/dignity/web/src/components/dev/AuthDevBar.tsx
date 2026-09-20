import React, { useState } from 'react';
import {
  Wrench,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  User,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../state/auth/AuthContext';
import { AuthStage } from '../../types';

export const AuthDevBar: React.FC = () => {
  const { state, setAuthStage, demoLogin, logout, resetDemoState } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside aria-label="Dev State Switcher" className="fixed bottom-3 right-3 z-50">
      {/* Collapsed Pill */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/95 text-white dark:bg-slate-800/95 border border-slate-700 shadow-xl hover:bg-slate-800 transition-all text-xs font-mono font-medium backdrop-blur-md"
          title="Open Step 2 Prototype State Switcher"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">Auth HUD:</span>
          <span className="text-blue-400 font-bold uppercase">{state.authStage}</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      ) : (
        /* Expanded HUD Panel */
        <div className="w-80 sm:w-96 p-3.5 rounded-2xl bg-slate-950/95 text-white border border-slate-800 shadow-2xl backdrop-blur-lg animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-2.5">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold tracking-tight">
                Step 2 Auth & Flow Controller
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Current State Inspector */}
          <div className="bg-slate-900/90 rounded-xl p-2.5 mb-3 border border-slate-800 text-[11px] font-mono grid grid-cols-2 gap-1.5 text-slate-300">
            <div>
              <span className="text-slate-500">Stage: </span>
              <span className="font-bold text-blue-400">{state.authStage}</span>
            </div>
            <div>
              <span className="text-slate-500">Auth: </span>
              <span className={state.isAuthenticated ? 'text-emerald-400' : 'text-slate-400'}>
                {state.isAuthenticated ? 'Logged In' : 'Logged Out'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Onboarded: </span>
              <span className={state.onboardingCompleted ? 'text-emerald-400' : 'text-amber-400'}>
                {state.onboardingCompleted ? 'Yes' : 'Pending'}
              </span>
            </div>
            <div className="truncate">
              <span className="text-slate-500">User: </span>
              <span className="text-slate-200">{state.user?.name || 'None'}</span>
            </div>
          </div>

          {/* Preset User Switchers */}
          <div className="mb-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Instant Demo Presets
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => demoLogin('alexandria')}
                className="p-1.5 rounded-lg bg-blue-950/60 border border-blue-800 hover:bg-blue-900/60 text-left text-[11px] text-blue-200 transition-colors"
              >
                <div className="font-bold truncate">Alexandria</div>
                <div className="text-[9px] text-blue-400">Returning (Home)</div>
              </button>

              <button
                onClick={() => demoLogin('new_learner')}
                className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-800 hover:bg-amber-900/60 text-left text-[11px] text-amber-200 transition-colors"
              >
                <div className="font-bold truncate">Taylor Chen</div>
                <div className="text-[9px] text-amber-400">New (Onboarding)</div>
              </button>

              <button
                onClick={() => demoLogin('marcus_instructor')}
                className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-800 hover:bg-purple-900/60 text-left text-[11px] text-purple-200 transition-colors"
              >
                <div className="font-bold truncate">Dr. Marcus</div>
                <div className="text-[9px] text-purple-400">Instructor</div>
              </button>
            </div>
          </div>

          {/* Jump to Specific Stage */}
          <div className="mb-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Direct Screen Preview
            </div>
            <div className="grid grid-cols-4 gap-1 text-[11px]">
              {(['splash', 'welcome', 'login', 'register', 'onboarding'] as AuthStage[]).map(
                (stage) => (
                  <button
                    key={stage}
                    onClick={() => setAuthStage(stage)}
                    className={`py-1 px-1.5 rounded-md border text-center font-medium capitalize transition-colors ${
                      state.authStage === stage
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {stage}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Session Reset */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={logout}
              className="text-[11px] font-medium text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800"
            >
              Log Out
            </button>

            <button
              onClick={resetDemoState}
              className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-950/40 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Full Reset Storage</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
