import React from 'react';
import { Flame, Check, Sparkles } from 'lucide-react';
import { Card, CardBody } from '../../../components/ui/Card';
import { LearningGoal } from '../../../types';

export interface LearningStreakCardProps {
  goal: LearningGoal;
}

export const LearningStreakCard: React.FC<LearningStreakCardProps> = ({ goal }) => {
  const days = [
    { label: 'M', name: 'Mon', completed: true, isToday: false },
    { label: 'T', name: 'Tue', completed: true, isToday: false },
    { label: 'W', name: 'Wed', completed: true, isToday: false },
    { label: 'T', name: 'Thu', completed: true, isToday: false },
    { label: 'F', name: 'Fri', completed: true, isToday: false },
    { label: 'S', name: 'Sat', completed: false, isToday: false },
    { label: 'S', name: 'Sun', completed: true, isToday: true },
  ];

  const completedCount = days.filter((d) => d.completed).length;

  return (
    <Card elevation="subtle" className="border border-slate-200/90 dark:border-slate-800/90">
      <CardBody className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Consistency
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {goal.streakDays}-Day Streak
              </h3>
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            This week: <strong className="text-slate-900 dark:text-white">{completedCount} / 7 days</strong>
          </span>
        </div>

        {/* Small Weekly Calendar */}
        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {days.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                {day.name}
              </span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                  day.completed
                    ? 'bg-amber-500 text-white shadow-2xs shadow-amber-500/30 ring-2 ring-amber-400/20'
                    : day.isToday
                    ? 'border-2 border-dashed border-amber-500/60 bg-amber-50/50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500'
                }`}
                title={`${day.name}: ${day.completed ? 'Completed' : 'Rest day'}`}
              >
                {day.completed ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <span className="text-[11px] font-normal">{day.label}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Study today to maintain your streak for tomorrow!</span>
        </p>
      </CardBody>
    </Card>
  );
};
