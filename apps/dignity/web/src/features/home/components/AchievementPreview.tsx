import React from 'react';
import { Award, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card, CardBody } from '../../../components/ui/Card';
import { Achievement } from '../../../types';

export interface AchievementPreviewProps {
  achievements: Achievement[];
  onViewAll: () => void;
}

export const AchievementPreview: React.FC<AchievementPreviewProps> = ({
  achievements,
  onViewAll,
}) => {
  const recentAchievements = achievements.slice(0, 4);

  const getIconEmoji = (iconName: string) => {
    const lower = iconName.toLowerCase();
    if (lower.includes('flame') || lower.includes('streak')) return '🔥';
    if (lower.includes('award') || lower.includes('trophy') || lower.includes('course')) return '🏆';
    if (lower.includes('target') || lower.includes('quiz')) return '🎯';
    if (lower.includes('rocket') || lower.includes('project')) return '🚀';
    if (lower.includes('code')) return '💻';
    return '⭐';
  };

  return (
    <Card elevation="subtle" className="border border-slate-200/90 dark:border-slate-800/90">
      <CardBody className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Milestones
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                Recent Achievements
              </h3>
            </div>
          </div>

          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {recentAchievements.map((ach) => (
            <div
              key={ach.id}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg shrink-0">
                {getIconEmoji(ach.iconName)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {ach.title}
                  </h4>
                  {ach.isUnlocked && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Unlocked
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {ach.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};
