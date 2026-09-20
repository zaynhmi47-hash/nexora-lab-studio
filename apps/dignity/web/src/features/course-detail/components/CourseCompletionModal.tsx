import React from 'react';
import { DetailedCourse } from '../../../types/courseExperience';
import { PrimaryButton, SecondaryButton } from '../../../components/ui/Button';
import { Award, CheckCircle2, Sparkles, Share2, Download, ArrowRight, Zap, BookOpen } from 'lucide-react';

interface CourseCompletionModalProps {
  course: DetailedCourse;
  isOpen: boolean;
  onClose: () => void;
  onViewCertificate?: () => void;
  onExploreNext?: () => void;
}

export const CourseCompletionModal: React.FC<CourseCompletionModalProps> = ({
  course,
  isOpen,
  onClose,
  onViewCertificate,
  onExploreNext,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        {/* Celebration Badge Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
          <Award className="w-10 h-10" />
          <div className="absolute -top-2 -right-2 p-1.5 rounded-full bg-emerald-500 text-white border-2 border-white dark:border-slate-900">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Course Completed!
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Congratulations, Learner!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            You have mastered all modules, interactive drills, and capstone challenges in{' '}
            <span className="font-semibold text-slate-900 dark:text-white">{course.title}</span>.
          </p>
        </div>

        {/* Metric highlights */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-amber-500 font-extrabold text-lg sm:text-xl">
              <Zap className="w-4 h-4 fill-current" />
              <span>+{course.xpReward || 500}</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">XP Earned</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-emerald-500 font-extrabold text-lg sm:text-xl">
              <BookOpen className="w-4 h-4" />
              <span>{course.courseIncludes.lessonsCount}</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Lessons Completed</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-blue-500 font-extrabold text-lg sm:text-xl">
              <CheckCircle2 className="w-4 h-4" />
              <span>{course.skills.length}</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Skills Leveled Up</div>
          </div>
        </div>

        {/* Certificate Card Preview */}
        {course.courseIncludes.certificateEligible && (
          <div className="p-4 rounded-2xl bg-linear-to-r from-blue-50/80 to-indigo-50/70 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-800/60 text-left flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Official Credential
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Certificate of Competency Ready
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Verified with unique serial code & LinkedIn credential integration.
              </p>
            </div>
            {onViewCertificate && (
              <button
                type="button"
                onClick={onViewCertificate}
                className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors"
              >
                View
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <PrimaryButton fullWidth size="lg" onClick={onExploreNext || onClose} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Continue Your Journey
          </PrimaryButton>
          <SecondaryButton fullWidth size="md" onClick={onClose}>
            Back to Course Overview
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
};
