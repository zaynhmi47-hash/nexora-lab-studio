import React from 'react';
import { Sparkles, BrainCircuit, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Course } from '../../../types';
import { CourseCard } from '../../../components/course/CourseCard';

interface PersonalizedRecommendationsSectionProps {
  recommendations: { course: Course; reason: string }[];
  onSelectCourse: (course: Course) => void;
  learnerGoal?: string;
}

export const PersonalizedRecommendationsSection: React.FC<PersonalizedRecommendationsSectionProps> = ({
  recommendations,
  onSelectCourse,
  learnerGoal = 'Full-Stack Developer',
}) => {
  return (
    <section className="space-y-4">
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-transparent border border-blue-200/60 dark:border-blue-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Smart Recommendation Engine</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Recommended For Your Growth
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Personalized based on your career goal (<strong className="font-semibold text-slate-700 dark:text-slate-300">{learnerGoal}</strong>) and your current skill progression gaps.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Targeting 3 skill gaps</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map(({ course, reason }) => (
          <div key={course.id} className="flex flex-col justify-between space-y-2">
            <div className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center gap-2 text-xs text-blue-800 dark:text-blue-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-medium line-clamp-1">{reason}</span>
            </div>

            <CourseCard
              course={course}
              variant="discovery"
              onSelect={onSelectCourse}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
