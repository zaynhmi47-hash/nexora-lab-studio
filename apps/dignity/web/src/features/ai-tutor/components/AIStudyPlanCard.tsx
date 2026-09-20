import React, { useState } from 'react';
import { Calendar, Clock, Target, CheckCircle2, Circle, ChevronRight, Sparkles } from 'lucide-react';
import { AIStudyPlan, AIStudyPlanItem } from '../../../types/ai';

export interface AIStudyPlanCardProps {
  studyPlan: AIStudyPlan;
  onItemToggle?: (itemId: string) => void;
  onLaunchItem?: (item: AIStudyPlanItem) => void;
  onAdjustCommitment?: () => void;
}

export const AIStudyPlanCard: React.FC<AIStudyPlanCardProps> = ({
  studyPlan,
  onItemToggle,
  onLaunchItem,
  onAdjustCommitment,
}) => {
  const [items, setItems] = useState<AIStudyPlanItem[]>(studyPlan.todaySchedule.items);

  const handleToggle = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isCompleted: !item.isCompleted } : item))
    );
    onItemToggle?.(id);
  };

  const completedCount = items.filter((i) => i.isCompleted).length;
  const todayProgress = Math.round((completedCount / items.length) * 100);

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Personalized AI Study Plan
              </h3>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                Week 3 of {studyPlan.targetWeeks}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Goal: {studyPlan.goal}
            </p>
          </div>
        </div>

        {onAdjustCommitment && (
          <button
            type="button"
            onClick={onAdjustCommitment}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline self-start sm:self-auto"
          >
            Adjust Commitment
          </button>
        )}
      </div>

      {/* Meta Stats Badges */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Daily Goal</div>
          <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>{studyPlan.dailyCommitmentMinutes}m</span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Current Level</div>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
            {studyPlan.currentLevel}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Plan Completion</div>
          <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            {studyPlan.progressPercent}%
          </div>
        </div>
      </div>

      {/* Today's Schedule Checklist */}
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
          <span>Today's Recommended Actions ({studyPlan.todaySchedule.date})</span>
          <span className="text-slate-500 font-normal">{todayProgress}% done</span>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                item.isCompleted
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-slate-500'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400'
              }`}
            >
              <button
                type="button"
                onClick={() => handleToggle(item.id)}
                className="flex items-center gap-2.5 text-left min-w-0 flex-1"
              >
                {item.isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <div
                    className={`text-xs font-semibold truncate ${
                      item.isCompleted ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {item.title}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                    <span className="capitalize">{item.type}</span>
                    <span>•</span>
                    <span>{item.durationMinutes} mins</span>
                    <span>•</span>
                    <span>{item.skillName}</span>
                  </div>
                </div>
              </button>

              {onLaunchItem && !item.isCompleted && (
                <button
                  type="button"
                  onClick={() => onLaunchItem(item)}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-bold transition-colors shrink-0"
                >
                  Start
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Milestones Overview */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
          Weekly Milestone Track
        </div>
        <div className="space-y-1.5">
          {studyPlan.weeklyMilestones.slice(0, 4).map((m) => (
            <div
              key={m.weekNumber}
              className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300"
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    m.status === 'completed'
                      ? 'bg-emerald-500'
                      : m.status === 'in_progress'
                      ? 'bg-blue-500'
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
                <span className="font-semibold">Week {m.weekNumber}:</span>
                <span className="truncate text-slate-600 dark:text-slate-400">{m.theme}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0 ml-2">
                {m.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
