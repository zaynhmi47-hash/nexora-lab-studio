import React from 'react';
import { Target, Compass, ChevronRight, Clock, Award } from 'lucide-react';
import { Card, CardBody } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';

export interface LearningGoalCardProps {
  goalTitle: string;
  progressPercent: number;
  currentLevel: string;
  estimatedWeeksRemaining: number;
  onViewPath: () => void;
}

export const LearningGoalCard: React.FC<LearningGoalCardProps> = ({
  goalTitle,
  progressPercent,
  currentLevel,
  estimatedWeeksRemaining,
  onViewPath,
}) => {
  return (
    <Card elevation="subtle" className="overflow-hidden border border-slate-200/90 dark:border-slate-800/90">
      <CardBody className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Primary Learning Goal
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {goalTitle}
              </h2>
            </div>
          </div>

          <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 shrink-0">
            {progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-3.5">
          <ProgressBar
            value={progressPercent}
            max={100}
            variant="primary"
            size="md"
            showValue={false}
          />
        </div>

        {/* Metadata Details */}
        <div className="grid grid-cols-2 gap-2 text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 mb-3.5">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <Award className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px]">Level:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{currentLevel}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px]">Est. Remaining:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{estimatedWeeksRemaining} weeks</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onViewPath}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200/60 dark:border-blue-800/50 transition-colors"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>View Curriculum & Path</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </CardBody>
    </Card>
  );
};
