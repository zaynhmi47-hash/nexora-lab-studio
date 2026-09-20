import React from 'react';
import { PlayCircle, Clock, BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { Course } from '../../../types';
import { Card } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { PrimaryButton } from '../../../components/ui/Button';

export interface ContinueLearningCardProps {
  course: Course;
  onResume: (course: Course) => void;
  onViewAll?: () => void;
  activeCoursesCount?: number;
}

export const ContinueLearningCard: React.FC<ContinueLearningCardProps> = ({
  course,
  onResume,
  onViewAll,
  activeCoursesCount = 1,
}) => {
  // Derive module & lesson information
  const currentModuleTitle = course.modules?.[1]?.title || course.modules?.[0]?.title || 'Core Architecture';
  const currentLessonTitle = course.currentLessonTitle || 'Raft State Machine Replication & Heartbeats';
  const progress = course.progressPercent ?? 68;

  return (
    <section aria-labelledby="continue-learning-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Next Up
          </span>
          <h2
            id="continue-learning-heading"
            className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight"
          >
            Continue Learning
          </h2>
        </div>

        {onViewAll && activeCoursesCount > 1 && (
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Active courses ({activeCoursesCount})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <Card
        elevation="medium"
        className="overflow-hidden border border-blue-200/80 dark:border-blue-900/40 bg-linear-to-br from-white via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 shadow-md group hover:shadow-lg transition-all"
      >
        <div className="flex flex-col md:flex-row items-stretch">
          {/* Thumbnail & Video Badge */}
          <div className="relative w-full md:w-56 lg:w-64 h-44 md:h-auto shrink-0 overflow-hidden bg-slate-900">
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-black/20" />

            {/* Category tag */}
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md">
                {course.categoryName}
              </span>
            </div>

            {/* Play Overlay */}
            <button
              onClick={() => onResume(course)}
              className="absolute inset-0 flex items-center justify-center group/btn"
              aria-label={`Resume lesson: ${currentLessonTitle}`}
            >
              <div className="w-12 h-12 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg group-hover/btn:scale-110 group-hover/btn:bg-blue-600 transition-all backdrop-blur-xs">
                <PlayCircle className="w-6 h-6 fill-white text-blue-600 ml-0.5" />
              </div>
            </button>

            {/* Duration Tag */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded bg-black/70 text-slate-200 text-[11px] font-mono backdrop-blur-xs">
              <Clock className="w-3 h-3 text-blue-400" />
              <span>18 min</span>
            </div>
          </div>

          {/* Content & Action Area */}
          <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between space-y-4">
            <div>
              {/* Course and Instructor Meta */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {course.title}
                </span>
                <span>•</span>
                <span>Instructor: {course.instructor.name}</span>
              </div>

              {/* Current Lesson Title */}
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {currentLessonTitle}
              </h3>

              {/* Module context */}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Module: {currentModuleTitle}</span>
              </p>
            </div>

            {/* Progress Bar & Status */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Lesson 8 of 12
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {progress}% Completed
                </span>
              </div>
              <ProgressBar value={progress} max={100} variant="primary" size="md" showValue={false} />
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>+40 XP upon completion</span>
              </div>

              <PrimaryButton
                size="md"
                onClick={() => onResume(course)}
                leftIcon={<PlayCircle className="w-4 h-4 fill-white text-blue-600" />}
                className="shadow-sm font-bold"
              >
                Continue Lesson
              </PrimaryButton>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
};
