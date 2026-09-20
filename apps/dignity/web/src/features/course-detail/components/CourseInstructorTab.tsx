import React from 'react';
import { Instructor } from '../../../types';
import { Card } from '../../../components/ui/Card';
import { Star, Users, BookOpen, Award, CheckCircle } from 'lucide-react';

interface CourseInstructorTabProps {
  instructor: Instructor;
}

export const CourseInstructorTab: React.FC<CourseInstructorTabProps> = ({ instructor }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <img
          src={instructor.avatarUrl}
          alt={instructor.name}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
        />

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {instructor.name}
            </h3>
            {instructor.isVerified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3" /> Verified Lead Instructor
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {instructor.headline || instructor.title || 'Staff Software Architect & Course Author'}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400 pt-1">
            <span className="flex items-center gap-1 text-amber-500">
              <Star className="w-4 h-4 fill-current" />
              {instructor.rating} Rating
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4 text-blue-500" />
              {instructor.studentsCount?.toLocaleString()} Students
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              {instructor.coursesCount} Courses
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-base font-bold text-slate-900 dark:text-white">
          About the Instructor
        </h4>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
          {instructor.bio ||
            'A veteran full-stack software engineer and educator with over a decade of industry experience leading distributed systems, modern React frontends, and cloud infrastructures. Dedicated to demystifying complex computer science principles through hands-on, scenario-driven learning engines.'}
        </p>
      </div>

      {instructor.expertise && instructor.expertise.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Areas of Expertise
          </h4>
          <div className="flex flex-wrap gap-2">
            {instructor.expertise.map((exp, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {exp}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
