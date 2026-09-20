import React from 'react';
import { BookOpen, Clock, PlayCircle, Star, Award, CheckCircle2 } from 'lucide-react';
import { Course } from '../../types';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { PrimaryButton } from '../ui/Button';

export interface CourseCardProps {
  course: Course;
  variant?: 'discovery' | 'continueLearning' | 'compact';
  onSelect?: (course: Course) => void;
  onResumeLesson?: (course: Course) => void;
  className?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  variant = 'discovery',
  onSelect,
  onResumeLesson,
  className = '',
}) => {
  const isEnrolled = course.enrollmentStatus !== 'not_enrolled';
  const isCompleted = course.enrollmentStatus === 'completed';

  // =========================================================
  // Continue Learning Variant (Horizontal / Focused progress)
  // =========================================================
  if (variant === 'continueLearning') {
    return (
      <div
        onClick={() => onSelect?.(course)}
        className={`group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-blue-400/60 dark:hover:border-blue-500/50 transition-all cursor-pointer flex flex-col md:flex-row gap-4 sm:gap-5 items-stretch ${className}`}
      >
        {/* Thumbnail with overlay badge */}
        <div className="relative w-full md:w-48 h-32 md:h-auto rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
          <span className="absolute bottom-2 left-2 text-[10px] font-semibold text-white/95 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-xs">
            {course.categoryName}
          </span>
        </div>

        {/* Content & Progress */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant={isCompleted ? 'success' : 'primary'} size="sm">
                {isCompleted ? 'Completed' : `${course.progressPercent || 0}% Complete`}
              </Badge>
              {course.lastStudiedAt && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Active {course.lastStudiedAt}
                </span>
              )}
            </div>

            <h4 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {course.title}
            </h4>

            {course.currentLessonTitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 flex items-center gap-1.5">
                <PlayCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Next: {course.currentLessonTitle}</span>
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="w-full sm:w-1/2">
              <ProgressBar
                value={course.progressPercent || 0}
                size="sm"
                variant={isCompleted ? 'success' : 'primary'}
              />
            </div>
            <PrimaryButton
              size="sm"
              leftIcon={<PlayCircle className="w-3.5 h-3.5" />}
              onClick={(e) => {
                e.stopPropagation();
                onResumeLesson ? onResumeLesson(course) : onSelect?.(course);
              }}
            >
              {isCompleted ? 'Review Course' : 'Resume'}
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // Compact Variant (Lists, sidebars, small widgets)
  // =========================================================
  if (variant === 'compact') {
    return (
      <div
        onClick={() => onSelect?.(course)}
        className={`group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3 shadow-2xs hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex items-center gap-3 ${className}`}
      >
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-tight">
              {course.categoryName}
            </span>
            <span className="text-[10px] text-slate-400">•</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {course.difficulty}
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {course.title}
          </h4>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 font-medium text-amber-500">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {course.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {course.durationHours}h
            </span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // Standard Discovery Variant (Catalog, Recommendations)
  // =========================================================
  return (
    <div
      onClick={() => onSelect?.(course)}
      className={`group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col cursor-pointer ${className}`}
    >
      {/* Media Box */}
      <div className="relative aspect-16/9 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img
          src={course.thumbnailUrl}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
          <Badge variant="default" size="sm" className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs font-semibold">
            {course.categoryName}
          </Badge>
          {course.isNew && (
            <Badge variant="primary" size="sm">
              New
            </Badge>
          )}
        </div>
        <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {course.durationHours}h
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata Row */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {course.difficulty}
            </span>
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{course.rating.toFixed(2)}</span>
              <span className="text-[11px] text-slate-400 font-normal">
                ({course.ratingCount})
              </span>
            </div>
          </div>

          {/* Title */}
          <h4 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
            {course.title}
          </h4>

          {/* Short description */}
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
            {course.shortDescription}
          </p>
        </div>

        {/* Instructor & Price Row */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={course.instructor.avatarUrl}
              alt={course.instructor.name}
              className="w-6 h-6 rounded-full object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
              {course.instructor.name}
            </span>
          </div>

          <div className="shrink-0 text-right">
            {isEnrolled ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isCompleted ? 'Done' : 'Enrolled'}
              </span>
            ) : course.priceType === 'free' ? (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                Free
              </span>
            ) : (
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                ${course.priceAmount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
