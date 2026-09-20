import React from 'react';
import { Star, Users, BookOpen, CheckCircle2 } from 'lucide-react';
import { Instructor, Category } from '../../types';
import * as LucideIcons from 'lucide-react';

// ==========================================
// Instructor Card
// ==========================================
export interface InstructorCardProps {
  instructor: Instructor;
  onClick?: (instructor: Instructor) => void;
  className?: string;
}

export const InstructorCard: React.FC<InstructorCardProps> = ({
  instructor,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={() => onClick?.(instructor)}
      className={`group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-start gap-3.5 mb-3.5">
          <div className="relative shrink-0">
            <img
              src={instructor.avatarUrl}
              alt={instructor.name}
              className="w-14 h-14 rounded-xl object-cover"
              referrerPolicy="no-referrer"
            />
            {instructor.verified && (
              <CheckCircle2 className="w-4 h-4 text-blue-500 fill-white dark:fill-slate-900 absolute -bottom-1 -right-1" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {instructor.name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{instructor.title}</p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium truncate mt-0.5">
              {instructor.organization}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {instructor.bio}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1 font-semibold text-amber-500">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          {instructor.rating.toFixed(2)}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {instructor.studentsCount.toLocaleString()} learners
        </span>
        <span className="flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5" />
          {instructor.coursesCount} courses
        </span>
      </div>
    </div>
  );
};

// ==========================================
// Category Card
// ==========================================
export interface CategoryCardProps {
  category: Category;
  isSelected?: boolean;
  onSelect?: (category: Category) => void;
  className?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSelected = false,
  onSelect,
  className = '',
}) => {
  // Dynamically resolve lucide icon safely
  const IconComponent = (LucideIcons as Record<string, React.ElementType>)[category.iconName] || LucideIcons.BookOpen;

  return (
    <div
      onClick={() => onSelect?.(category)}
      className={`group p-4 sm:p-5 rounded-2xl border transition-all duration-150 cursor-pointer flex items-center gap-4 ${
        isSelected
          ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 shadow-xs'
          : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs'
      } ${className}`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${category.colorClass}`}
      >
        <IconComponent className="w-6 h-6" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
          {category.name}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {category.courseCount} courses available
        </p>
      </div>
    </div>
  );
};
