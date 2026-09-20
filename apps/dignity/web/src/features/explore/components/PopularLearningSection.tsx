import React, { useState } from 'react';
import { TrendingUp, Flame, Star, Clock, Users, ArrowRight } from 'lucide-react';
import { Course, ProgramItem } from '../../../types';
import { CourseCard } from '../../../components/course/CourseCard';
import { ProgramCard } from './ProgramCard';
import { DetailItem } from './ContentDetailModal';

interface PopularLearningSectionProps {
  courses: Course[];
  programs: ProgramItem[];
  onSelectItem: (detail: DetailItem) => void;
}

export const PopularLearningSection: React.FC<PopularLearningSectionProps> = ({
  courses,
  programs,
  onSelectItem,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'courses' | 'programs'>('all');

  const popularCourses = courses.filter((c) => c.isPopular).slice(0, 2);
  const popularPrograms = programs.filter((p) => p.isPopular).slice(0, 2);

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">
            <Flame className="w-3.5 h-3.5" />
            <span>Trending Across Platform</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Popular This Week
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Most active cohorts and high-velocity courses chosen by ambitious learners this week.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterType('courses')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'courses'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Courses
          </button>
          <button
            type="button"
            onClick={() => setFilterType('programs')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'programs'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Cohorts & Bimbel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(filterType === 'all' || filterType === 'courses') &&
          popularCourses.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              variant="discovery"
              onSelect={(course) => onSelectItem({ type: 'course', data: course })}
            />
          ))}

        {(filterType === 'all' || filterType === 'programs') &&
          popularPrograms.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              onSelect={(program) => onSelectItem({ type: 'program', data: program })}
            />
          ))}
      </div>
    </section>
  );
};
