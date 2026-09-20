import React from 'react';
import { DetailedCourse } from '../../../types/courseExperience';
import { Card } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import {
  CheckCircle2,
  Compass,
  ArrowRight,
  BookOpen,
  Code,
  Award,
  Sparkles,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface CourseOverviewTabProps {
  course: DetailedCourse;
  onNavigateToCourse?: (courseId: string) => void;
  onNavigateToPath?: () => void;
}

export const CourseOverviewTab: React.FC<CourseOverviewTabProps> = ({
  course,
  onNavigateToCourse,
  onNavigateToPath,
}) => {
  return (
    <div className="space-y-8">
      {/* Learning Path Contributor Banner */}
      {course.learningPathTitle && (
        <Card padding="md" className="bg-linear-to-r from-blue-50/80 to-indigo-50/60 dark:from-blue-950/30 dark:to-indigo-950/20 border-blue-200/60 dark:border-blue-800/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <Compass className="w-4 h-4" />
                <span>Learning Path Integration</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Part of: {course.learningPathTitle}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Completing this course advances your career track by +35% toward certified competency.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {course.learningPathProgress || 34}% Path Complete
                </span>
                <ProgressBar value={course.learningPathProgress || 34} size="sm" className="w-28 mt-1" />
              </div>
              {onNavigateToPath && (
                <button
                  type="button"
                  onClick={onNavigateToPath}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors"
                  aria-label="View learning path"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* What You'll Learn Section */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            What You'll Learn
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Key outcomes verified through automated test suites and interactive challenges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {course.whatYouWillLearn.map((outcome, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                {outcome}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Why It Matters & How You Know You Mastered It */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md" className="space-y-2 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Why This Matters</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {course.whyItMatters}
          </p>
        </Card>

        <Card padding="md" className="space-y-2 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Award className="w-4 h-4" />
            <span>How You'll Know You Mastered It</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {course.howYouKnowMastered}
          </p>
        </Card>
      </div>

      {/* Course Includes Matrix */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          This Course Includes
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-center space-y-1">
            <BookOpen className="w-5 h-5 mx-auto text-blue-500" />
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">
              {course.courseIncludes.lessonsCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Structured Lessons</div>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-center space-y-1">
            <Sparkles className="w-5 h-5 mx-auto text-amber-500" />
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">
              {course.courseIncludes.practiceCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Practice Drills</div>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-center space-y-1">
            <Award className="w-5 h-5 mx-auto text-purple-500" />
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">
              {course.courseIncludes.assessmentsCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Assessments</div>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-center space-y-1">
            <Code className="w-5 h-5 mx-auto text-emerald-500" />
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">
              {course.courseIncludes.projectsCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Hands-on Projects</div>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-center space-y-1">
            <FileText className="w-5 h-5 mx-auto text-indigo-500" />
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">
              {course.courseIncludes.downloadableResourcesCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Resources & Files</div>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-center space-y-1">
            <CheckCircle2 className="w-5 h-5 mx-auto text-teal-500" />
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">
              {course.courseIncludes.certificateEligible ? 'Yes' : 'No'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Certificate Prep</div>
          </div>
        </div>
      </section>

      {/* Prerequisites & Requirements */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Prerequisites & Requirements
        </h3>

        <div className="space-y-3">
          {course.prerequisites.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Recommended Prior Knowledge
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {course.prerequisites.map((prereq) => (
                  <div
                    key={prereq.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-2.5">
                      {prereq.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <div className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                          {prereq.title}
                        </div>
                        {prereq.completed ? (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            Completed in your profile
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                            Recommended before starting
                          </span>
                        )}
                      </div>
                    </div>

                    {!prereq.completed && prereq.recommendedCourseId && onNavigateToCourse && (
                      <button
                        type="button"
                        onClick={() => onNavigateToCourse(prereq.recommendedCourseId!)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                      >
                        Learn First
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              General Requirements
            </span>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 list-disc list-inside">
              {course.requirements.map((req, idx) => (
                <li key={idx} className="leading-relaxed">
                  {req}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
