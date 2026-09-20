import React from 'react';
import {
  Code2,
  Languages,
  GraduationCap,
  Briefcase,
  TrendingUp,
  BookOpen,
  Sparkles,
  Award,
  ArrowRight,
} from 'lucide-react';
import { LearningGoalItem } from '../../../types';

interface LearningGoalsSectionProps {
  goals: LearningGoalItem[];
  onSelectGoal: (goal: LearningGoalItem) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Code2,
  Languages,
  GraduationCap,
  Briefcase,
  TrendingUp,
  BookOpen,
  Sparkles,
  Award,
};

export const LearningGoalsSection: React.FC<LearningGoalsSectionProps> = ({
  goals,
  onSelectGoal,
}) => {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
          What do you want to achieve?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Select your primary learning ambition for tailored roadmaps, courses, and mentor pairings.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {goals.map((goal) => {
          const Icon = iconMap[goal.iconName] || Sparkles;

          return (
            <div
              key={goal.id}
              id={`goal-card-${goal.id}`}
              onClick={() => onSelectGoal(goal)}
              className="group relative p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {goal.category}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {goal.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {goal.subtitle}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">
                  {goal.recommendedCoursesCount} programs
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Explore Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
