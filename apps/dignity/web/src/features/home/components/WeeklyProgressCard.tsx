import React from 'react';
import { BarChart3, Clock, CheckCircle2, Award, TrendingUp } from 'lucide-react';
import { Card, CardBody } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { WeeklyLearningProgress } from '../../../types';

export interface WeeklyProgressCardProps {
  progress: WeeklyLearningProgress;
}

export const WeeklyProgressCard: React.FC<WeeklyProgressCardProps> = ({ progress }) => {
  const formatMinutes = (totalMin: number) => {
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };

  const percent = Math.min(
    100,
    Math.round((progress.completedMinutes / progress.weeklyGoalMinutes) * 100)
  );

  return (
    <Card elevation="subtle" className="border border-slate-200/90 dark:border-slate-800/90">
      <CardBody className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Weekly Metric
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                Weekly Progress
              </h3>
            </div>
          </div>

          <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
            {percent}%
          </span>
        </div>

        {/* Time Comparison */}
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <span className="text-xs text-slate-400 dark:text-slate-500">Completed: </span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white">
              {formatMinutes(progress.completedMinutes)}
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Target: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatMinutes(progress.weeklyGoalMinutes)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <ProgressBar value={percent} max={100} variant="primary" size="md" showValue={false} />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block leading-tight">Lessons Done</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {progress.lessonsCompletedCount} Lessons
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
            <Award className="w-4 h-4 text-blue-500 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block leading-tight">Avg Quiz Score</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {progress.averageQuizScore}%
              </span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
