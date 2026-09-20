import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Play,
  Search,
  Sparkles,
  Target,
} from 'lucide-react';
import type { AppRoute, Course, LearningPath } from '../../types';
import type { EngineLesson } from '../../types/learningEngine';

export interface LearningScreenProps {
  courses: Course[];
  learningPaths: LearningPath[];
  onSelectCourse: (course: Course) => void;
  onNavigate: (route: AppRoute, params?: Record<string, unknown>) => void;
  onStartLesson: (lesson: EngineLesson, moduleTitle?: string) => void;
}

export const LearningScreen: React.FC<LearningScreenProps> = ({
  courses,
  learningPaths,
  onSelectCourse,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesQuery =
        !normalizedQuery ||
        course.title.toLowerCase().includes(normalizedQuery) ||
        course.description?.toLowerCase().includes(normalizedQuery);

      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'completed' && course.enrollmentStatus === 'completed') ||
        (activeFilter === 'in-progress' && course.enrollmentStatus === 'in_progress');

      return Boolean(matchesQuery && matchesFilter);
    });
  }, [courses, query, activeFilter]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Sparkles className="h-4 w-4" />
                Adaptive Learning
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Continue building your skills.
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                Follow your learning paths, continue courses, and turn every session
                into measurable progress.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('practice')}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              <Target className="h-4 w-4" />
              Practice skills
            </button>
          </div>
        </section>

        {learningPaths.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Your learning paths</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Structured paths designed around your goals.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {learningPaths.slice(0, 4).map((path) => (
                <article
                  key={path.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-xl bg-slate-100 p-3">
                      <BookOpen className="h-5 w-5 text-slate-700" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      Learning path
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold">{path.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">
                    {path.description}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">My courses</h2>
              <p className="mt-1 text-sm text-slate-500">
                Continue where you left off.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(['all', 'in-progress', 'completed'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    activeFilter === filter
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {filter === 'all'
                    ? 'All'
                    : filter === 'in-progress'
                      ? 'In progress'
                      : 'Completed'}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your courses..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          {filteredCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-slate-400" />
              <h3 className="mt-3 font-semibold">No courses found</h3>
              <p className="mt-1 text-sm text-slate-500">
                Try another search or change the filter.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course) => {
                const completed = course.enrollmentStatus === 'completed';

                return (
                  <article
                    key={course.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex h-36 items-end bg-slate-100 p-5">
                      <div className="rounded-xl bg-white p-3 shadow-sm">
                        <BookOpen className="h-5 w-5 text-slate-700" />
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        {completed ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Clock3 className="h-4 w-4" />
                        )}
                        {completed ? 'Completed' : 'Continue learning'}
                      </div>

                      <h3 className="mt-3 line-clamp-2 font-semibold leading-6">
                        {course.title}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">
                        {course.description}
                      </p>

                      <button
                        type="button"
                        onClick={() => onSelectCourse(course)}
                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        <Play className="h-4 w-4" />
                        Open course
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};
