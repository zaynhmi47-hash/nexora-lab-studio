import React from 'react';
import { CheckCircle2, Circle, Sparkles, Award, Zap, HelpCircle } from 'lucide-react';
import { DailyMission } from '../../../types';
import { Card, CardBody } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';

export interface DailyMissionCardProps {
  missions: DailyMission[];
  onToggleMission: (missionId: string) => void;
}

export const DailyMissionCard: React.FC<DailyMissionCardProps> = ({
  missions,
  onToggleMission,
}) => {
  const completedCount = missions.filter((m) => m.completed).length;
  const totalMissions = missions.length;
  const progressPercent = totalMissions > 0 ? Math.round((completedCount / totalMissions) * 100) : 0;
  const totalXp = missions.reduce((acc, m) => acc + (m.completed ? m.xp : 0), 0);
  const potentialXp = missions.reduce((acc, m) => acc + m.xp, 0);

  return (
    <Card elevation="subtle" className="border border-slate-200/90 dark:border-slate-800/90">
      <CardBody className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Daily Focus
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                Today&apos;s Missions
              </h3>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {completedCount} / {totalMissions}
            </span>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center justify-end gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>+{totalXp} XP</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <ProgressBar
            value={progressPercent}
            max={100}
            variant="warning"
            size="sm"
            showValue={false}
          />
        </div>

        {/* Interactive Mission Checklist */}
        <div className="space-y-2">
          {missions.map((mission) => {
            return (
              <button
                key={mission.id}
                onClick={() => onToggleMission(mission.id)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-3 group focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
                  mission.completed
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40 text-slate-700 dark:text-slate-300'
                    : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700/60 text-slate-800 dark:text-slate-200'
                }`}
                aria-pressed={mission.completed}
              >
                <div className="mt-0.5 shrink-0">
                  {mission.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-medium leading-snug transition-colors ${
                      mission.completed
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400'
                    }`}
                  >
                    {mission.title}
                  </p>
                  {mission.targetCourseTitle && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate mt-0.5">
                      {mission.targetCourseTitle}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded shrink-0 ${
                    mission.completed
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  +{mission.xp} XP
                </span>
              </button>
            );
          })}
        </div>

        {/* Motivational Footer */}
        {completedCount === totalMissions && (
          <div className="mt-3 p-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-center text-[11px] font-semibold flex items-center justify-center gap-1.5 animate-in fade-in duration-200">
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>All missions complete! Daily target achieved.</span>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
