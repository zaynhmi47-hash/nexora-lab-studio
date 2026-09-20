import React, { useState } from 'react';
import { DetailedCourse, DetailedLesson } from '../../../types/courseExperience';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Badge } from '../../../components/ui/Badge';
import {
  PlayCircle,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  Code,
  Award,
  Clock,
  Zap,
  Layers,
} from 'lucide-react';

interface CourseCurriculumTabProps {
  course: DetailedCourse;
  onSelectLesson: (lesson: DetailedLesson, moduleTitle: string) => void;
  onSelectProject?: (projectId: string) => void;
  onSelectAssessment?: (assessmentId: string) => void;
}

export const CourseCurriculumTab: React.FC<CourseCurriculumTabProps> = ({
  course,
  onSelectLesson,
  onSelectProject,
  onSelectAssessment,
}) => {
  // Toggle states for modules
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    course.detailedModules.forEach((m, idx) => {
      initial[m.id] = idx === 0 || idx === 1 || idx === 2; // Expand first 3 by default
    });
    return initial;
  });

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    course.detailedModules.forEach((m) => {
      all[m.id] = true;
    });
    setExpandedModules(all);
  };

  const collapseAll = () => {
    const none: Record<string, boolean> = {};
    course.detailedModules.forEach((m) => {
      none[m.id] = false;
    });
    setExpandedModules(none);
  };

  const getLessonTypeIcon = (type: DetailedLesson['type']) => {
    switch (type) {
      case 'video':
        return <PlayCircle className="w-4 h-4 text-blue-500" />;
      case 'text':
        return <FileText className="w-4 h-4 text-emerald-500" />;
      case 'interactive':
      case 'practice':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'code':
        return <Code className="w-4 h-4 text-purple-500" />;
      case 'quiz':
      case 'assessment':
        return <Award className="w-4 h-4 text-rose-500" />;
      case 'project':
        return <Layers className="w-4 h-4 text-indigo-500" />;
      default:
        return <PlayCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with expand/collapse all */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Curriculum & Syllabus
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {course.detailedModules.length} modules • {course.courseIncludes.lessonsCount} lessons • {course.durationHours} hours total
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Expand All
          </button>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <button
            type="button"
            onClick={collapseAll}
            className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {course.detailedModules.map((module) => {
          const isExpanded = expandedModules[module.id] ?? false;
          const completedCount = module.lessons.filter((l) => l.status === 'completed').length;

          return (
            <div
              key={module.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                module.isUnlocked
                  ? 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs'
                  : 'border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/40 opacity-75'
              }`}
            >
              {/* Module Header Button */}
              <button
                type="button"
                onClick={() => toggleModule(module.id)}
                className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors text-left"
              >
                <div className="space-y-1.5 min-w-0 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Module {module.order}
                    </span>
                    {!module.isUnlocked && (
                      <Badge variant="neutral" size="sm" className="gap-1 text-[10px]">
                        <Lock className="w-3 h-3" /> Locked
                      </Badge>
                    )}
                    {module.progressPercent === 100 && (
                      <Badge variant="success" size="sm" className="gap-1 text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </Badge>
                    )}
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                    {module.title}
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {module.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span>{module.lessons.length} lessons</span>
                    <span>~{module.durationHours} hours</span>
                    <span>
                      {completedCount} / {module.lessons.length} done
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="hidden sm:block w-24 text-right">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {module.progressPercent}%
                    </span>
                    <ProgressBar value={module.progressPercent} size="sm" className="mt-1" />
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </button>

              {/* Module Lessons Accordion Content */}
              {isExpanded && (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border-t border-slate-100 dark:border-slate-800">
                  {module.lessons.map((lesson) => {
                    const isLocked = lesson.isLocked;
                    const isCompleted = lesson.status === 'completed';
                    const isInProgress = lesson.status === 'in_progress';

                    return (
                      <div
                        key={lesson.id}
                        className={`p-3.5 sm:px-5 sm:py-4 flex items-center justify-between gap-3 transition-colors ${
                          isInProgress
                            ? 'bg-blue-50/40 dark:bg-blue-950/20'
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        {/* Left Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Completion / Status Icon */}
                          <div className="shrink-0">
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : isLocked ? (
                              <Lock className="w-4 h-4 text-slate-400" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-400">
                                #{lesson.order}
                              </span>
                              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                {getLessonTypeIcon(lesson.type)}
                                <span className="text-[11px] font-medium capitalize">
                                  {lesson.type}
                                </span>
                              </div>
                            </div>
                            <h5
                              className={`text-xs sm:text-sm font-semibold truncate ${
                                isCompleted
                                  ? 'text-slate-600 dark:text-slate-400'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {lesson.title}
                            </h5>
                          </div>
                        </div>

                        {/* Right Metadata & Action */}
                        <div className="flex items-center gap-2 sm:gap-4 shrink-0 text-xs">
                          <div className="hidden md:flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                            <Zap className="w-3.5 h-3.5" />
                            <span>+{lesson.xpReward} XP</span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{lesson.durationMinutes}m</span>
                          </div>

                          {/* Action button */}
                          {isLocked ? (
                            <button
                              disabled
                              className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                            >
                              Locked
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (lesson.type === 'project' && lesson.projectId && onSelectProject) {
                                  onSelectProject(lesson.projectId);
                                } else if (lesson.type === 'assessment' && lesson.assessmentId && onSelectAssessment) {
                                  onSelectAssessment(lesson.assessmentId);
                                } else {
                                  onSelectLesson(lesson, module.title);
                                }
                              }}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                isInProgress
                                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
                                  : isCompleted
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                  : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 hover:bg-blue-100'
                              }`}
                            >
                              {isInProgress ? 'Resume' : isCompleted ? 'Review' : 'Start'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
