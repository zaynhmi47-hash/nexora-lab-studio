import React from 'react';
import {
  ArrowLeft,
  BookOpen,
  ClipboardCheck,
  FolderKanban,
} from 'lucide-react';

export interface LessonPlayerScreenProps {
  courseId: string;
  initialLessonId?: string;
  onBackToCourse: () => void;
  onOpenProject: (projectId: string, courseTitle?: string) => void;
  onOpenAssessment: (assessmentId: string, courseTitle?: string) => void;
}

export const LessonPlayerScreen: React.FC<LessonPlayerScreenProps> = ({
  courseId,
  initialLessonId,
  onBackToCourse,
  onOpenProject,
  onOpenAssessment,
}) => {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={onBackToCourse}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to course
        </button>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="aspect-video bg-slate-900 p-6 text-white sm:p-10">
              <div className="flex h-full flex-col justify-end">
                <span className="text-sm text-slate-400">Course {courseId}</span>
                <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                  {initialLessonId ? 'Lesson player' : 'Course lesson'}
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                  Your course experience is ready. Video, reading, interactive activities,
                  projects, and assessments can share this player foundation.
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-slate-700" />
                <h2 className="font-semibold">Lesson content</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Select a lesson from the course experience or continue with the current
                lesson.
              </p>
            </div>
          </section>

          <aside className="space-y-4">
            <button
              type="button"
              onClick={() => onOpenProject('proj-ecommerce-api', 'Course Project')}
              className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-400"
            >
              <span className="rounded-xl bg-slate-100 p-3">
                <FolderKanban className="h-5 w-5" />
              </span>
              <span>
                <strong className="block text-sm">Open project</strong>
                <span className="mt-1 block text-xs text-slate-500">
                  Apply what you learned.
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => onOpenAssessment('exam-ts-arch-midterm', 'Course Assessment')}
              className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-400"
            >
              <span className="rounded-xl bg-slate-100 p-3">
                <ClipboardCheck className="h-5 w-5" />
              </span>
              <span>
                <strong className="block text-sm">Take assessment</strong>
                <span className="mt-1 block text-xs text-slate-500">
                  Check your current mastery.
                </span>
              </span>
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
};
