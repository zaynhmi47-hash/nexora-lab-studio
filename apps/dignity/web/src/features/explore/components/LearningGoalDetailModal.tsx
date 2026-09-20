import React from 'react';
import {
  X,
  Target,
  Sparkles,
  Award,
  BookOpen,
  Briefcase,
  ArrowRight,
  Compass,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { LearningGoalItem, Course, LearningPath, MentorItem } from '../../../types';
import { CourseCard } from '../../../components/course/CourseCard';
import { MentorCard } from './MentorCard';

interface LearningGoalDetailModalProps {
  goal: LearningGoalItem | null;
  isOpen: boolean;
  onClose: () => void;
  recommendedCourses: Course[];
  recommendedPath?: LearningPath;
  recommendedMentors: MentorItem[];
  onSelectCourse: (course: Course) => void;
  onSelectMentor: (mentor: MentorItem) => void;
  onSelectPath?: (path: LearningPath) => void;
}

export const LearningGoalDetailModal: React.FC<LearningGoalDetailModalProps> = ({
  goal,
  isOpen,
  onClose,
  recommendedCourses,
  recommendedPath,
  recommendedMentors,
  onSelectCourse,
  onSelectMentor,
  onSelectPath,
}) => {
  if (!isOpen || !goal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close goal modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-blue-100 mb-3">
            <Target className="w-3.5 h-3.5" />
            <span>Curated Learning Blueprint</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {goal.title}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-blue-100/90 max-w-2xl leading-relaxed">
            {goal.description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-xs px-3 py-1.5 rounded-xl">
              <Briefcase className="w-3.5 h-3.5 text-blue-300" />
              <span>Target Career: <strong className="font-semibold text-white">{goal.targetCareer}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-xs px-3 py-1.5 rounded-xl">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>{goal.certificationTitle}</span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto">
          {/* Key Competencies Acquired */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Core Skills & Benchmarks You Will Master</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {goal.skillsGained.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Recommended Learning Path */}
          {recommendedPath && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Recommended Career Path</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {recommendedPath.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {recommendedPath.description}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>{recommendedPath.estimatedWeeks} weeks roadmap</span>
                    <span>•</span>
                    <span>{recommendedPath.courseIds.length} progressive courses</span>
                    <span>•</span>
                    <span>{recommendedPath.projectsCount} capstone projects</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectPath?.(recommendedPath);
                  }}
                  className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  <span>View Path</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Recommended Courses for this goal */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span>Recommended Courses ({recommendedCourses.length})</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendedCourses.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  variant="discovery"
                  onSelect={(course) => {
                    onClose();
                    onSelectCourse(course);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Available Industry Mentors */}
          {recommendedMentors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>Connect with Mentors in this Track</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recommendedMentors.slice(0, 2).map((m) => (
                  <MentorCard
                    key={m.id}
                    mentor={m}
                    onSelect={(mentor) => {
                      onClose();
                      onSelectMentor(mentor);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Includes progress tracking, practical projects, and verified certification exam.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
          >
            Done Exploring Goal
          </button>
        </div>
      </div>
    </div>
  );
};
