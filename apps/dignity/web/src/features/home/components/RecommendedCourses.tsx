import React from 'react';
import { Sparkles, Star, Clock, ChevronRight, BookOpen } from 'lucide-react';
import { Course } from '../../../types';
import { Card } from '../../../components/ui/Card';

export interface RecommendedCoursesProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  onExploreMore: () => void;
}

export const RecommendedCourses: React.FC<RecommendedCoursesProps> = ({
  courses,
  onSelectCourse,
  onExploreMore,
}) => {
  return (
    <section aria-labelledby="recommended-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Curated Next Steps
          </span>
          <h2
            id="recommended-heading"
            className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight"
          >
            Recommended for You
          </h2>
        </div>

        <button
          onClick={onExploreMore}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <span>Explore all</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {courses.map((course) => (
          <Card
            key={course.id}
            elevation="subtle"
            className="overflow-hidden border border-slate-200/90 dark:border-slate-800/90 hover:border-blue-300 dark:hover:border-blue-800/80 transition-all group flex flex-col justify-between"
          >
            <div>
              {/* Thumbnail Container */}
              <div className="relative h-36 w-full overflow-hidden bg-slate-900">
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />

                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/70 text-white backdrop-blur-xs">
                    {course.categoryName}
                  </span>
                </div>

                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs text-white">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold">{course.rating.toFixed(1)}</span>
                    <span className="text-slate-300 text-[10px]">({course.ratingCount})</span>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-600/80 backdrop-blur-xs">
                    {course.difficulty}
                  </span>
                </div>
              </div>

              {/* Course Info */}
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                  {course.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {course.shortDescription}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{course.durationHours} hrs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-slate-400" />
                    <span>{course.lessonCount} lessons</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer & Action */}
            <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {course.priceType === 'free' ? (
                  <span className="text-emerald-600 dark:text-emerald-400 uppercase font-bold">Free</span>
                ) : (
                  <span>${course.priceAmount || 89} USD</span>
                )}
              </span>

              <button
                onClick={() => onSelectCourse(course)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-blue-200 dark:border-blue-900 transition-colors flex items-center gap-1"
              >
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
