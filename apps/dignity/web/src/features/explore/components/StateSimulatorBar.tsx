import React from 'react';
import { Eye, Check, AlertTriangle, RefreshCw, Layers } from 'lucide-react';

export type ExploreSimulatorState = 'normal' | 'loading' | 'empty' | 'error';

interface StateSimulatorBarProps {
  currentState: ExploreSimulatorState;
  onStateChange: (state: ExploreSimulatorState) => void;
}

export const StateSimulatorBar: React.FC<StateSimulatorBarProps> = ({
  currentState,
  onStateChange,
}) => {
  return (
    <aside
      aria-label="Prototype state simulator"
      className="mb-6 p-3 rounded-2xl bg-slate-900 text-white dark:bg-slate-950 dark:border dark:border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs"
    >
      <div className="flex items-center gap-2">
        <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400">
          <Eye className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-slate-200">Prototype State Simulator</span>
          <span className="text-slate-400 text-[11px] ml-1.5 hidden sm:inline">
            (Evaluate loading skeletons, empty queries & error boundaries)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl">
        {(
          [
            { id: 'normal', label: 'Default / Normal' },
            { id: 'loading', label: 'Loading Skeleton' },
            { id: 'empty', label: 'Empty Results' },
            { id: 'error', label: 'Network Error' },
          ] as const
        ).map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => onStateChange(st.id)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              currentState === st.id
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>
    </aside>
  );
};
