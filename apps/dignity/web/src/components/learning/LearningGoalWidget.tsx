import React from 'react';
import { Flame, Clock, Trophy, Target, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Achievement, LearningGoal } from '../../types';
import { ProgressRing } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import * as LucideIcons from 'lucide-react';

// ==========================================
// Daily Learning Goal & Streak Widget
// ==========================================
export interface LearningGoalWidgetProps {
  goal: LearningGoal;
  onAdjustGoal?: () => void;
  className?: string;
}

export const LearningGoalWidget: React.FC<LearningGoalWidgetProps> = ({
  goal,
  onAdjustGoal,
  className = '',
}) => {
  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs ${className}`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Daily Learning Goal
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {goal.completedMinutes}
            </span>
            <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">
              / {goal.targetMinutes} mins
            </span>
          </div>
        </div>

        {/* Progress Ring */}
        <ProgressRing
          value={goal.completedMinutes}
          max={goal.targetMinutes}
          size={56}
          strokeWidth={5}
          variant="primary"
          sublabel="goal"
        />
      </div>

      {/* Weekly distribution bars */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2">
          <span>This Week&apos;s Focus</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            {goal.streakDays} Day Streak
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 items-end h-16 pt-2">
          {goal.weeklyHistory.map((item, idx) => {
            const isToday = idx === goal.weeklyHistory.length - 1;
            const heightPercent = Math.min(100, Math.round((item.minutes / 60) * 100));

            return (
              <div key={item.day} className="flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-md h-full flex items-end p-0.5 overflow-hidden">
                  <div
                    className={`w-full rounded-sm transition-all duration-500 ${
                      item.completed
                        ? 'bg-blue-600 dark:bg-blue-500'
                        : item.minutes > 0
                        ? 'bg-blue-300 dark:bg-blue-800'
                        : 'bg-transparent'
                    }`}
                    style={{ height: `${Math.max(12, heightPercent)}%` }}
                    title={`${item.day}: ${item.minutes} mins`}
                  />
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    isToday
                      ? 'font-bold text-blue-600 dark:text-blue-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Achievement Card
// ==========================================
export interface AchievementCardProps {
  achievement: Achievement;
  className?: string;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, className = '' }) => {
  const IconComponent =
    (LucideIcons as Record<string, React.ElementType>)[achievement.iconName] || Trophy;

  return (
    <div
      className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
        achievement.isUnlocked
          ? 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-2xs'
          : 'bg-slate-50/50 dark:bg-slate-950/40 border-dashed border-slate-300 dark:border-slate-800/80 opacity-75'
      } ${className}`}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          achievement.isUnlocked
            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 shadow-2xs'
            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
        }`}
      >
        <IconComponent className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
            {achievement.title}
          </h4>
          {achievement.isUnlocked ? (
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
              Unlocked
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 shrink-0">In Progress</span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {achievement.description}
        </p>

        {achievement.progress !== undefined && achievement.maxProgress && (
          <div className="mt-2.5">
            <div className="flex justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              <span>Progress</span>
              <span>
                {achievement.progress} / {achievement.maxProgress}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
