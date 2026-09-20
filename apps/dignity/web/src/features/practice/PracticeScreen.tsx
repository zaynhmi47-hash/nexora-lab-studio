import { useMemo, useState } from 'react';
import { CheckCircle2, Flame, Play, Search, Target, Trophy } from 'lucide-react';
import type { EngineLesson } from '../../types/learningEngine';

export interface PracticeScreenProps {
  onStartLesson: (lesson: EngineLesson, moduleTitle?: string) => void;
}

const practiceLessons: EngineLesson[] = [
  {
    id: 'practice-react-1',
    moduleId: 'practice-react',
    title: 'React Fundamentals Practice',
    description: 'Practice components, props, state, and rendering.',
    estimatedMinutes: 15,
    xpReward: 50,
    skillIds: ['react'],
    isCompleted: false,
    activities: [],
  },
  {
    id: 'practice-js-1',
    moduleId: 'practice-javascript',
    title: 'JavaScript Core Practice',
    description: 'Strengthen your JavaScript fundamentals.',
    estimatedMinutes: 12,
    xpReward: 40,
    skillIds: ['javascript'],
    isCompleted: false,
    activities: [],
  },
  {
    id: 'practice-db-1',
    moduleId: 'practice-database',
    title: 'Database Fundamentals Practice',
    description: 'Review SQL, relationships, indexes, and queries.',
    estimatedMinutes: 18,
    xpReward: 60,
    skillIds: ['database'],
    isCompleted: false,
    activities: [],
  },
];

export function PracticeScreen({ onStartLesson }: PracticeScreenProps) {
  const [query, setQuery] = useState('');
  const [activeSkill, setActiveSkill] = useState('All');

  const skills = ['All', 'React', 'JavaScript', 'Database'];

  const filteredLessons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return practiceLessons.filter((lesson) => {
      const skill = lesson.skillIds[0]?.toLowerCase() ?? '';
      const matchesSkill =
        activeSkill === 'All' || skill === activeSkill.toLowerCase();
      const matchesQuery =
        !normalizedQuery ||
        lesson.title.toLowerCase().includes(normalizedQuery) ||
        lesson.description.toLowerCase().includes(normalizedQuery);

      return matchesSkill && matchesQuery;
    });
  }, [activeSkill, query]);

  return (
    <main className="min-h-full bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-300">Practice Arena</p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Turn knowledge into skill.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Practice the skills you are currently learning with focused exercises
                and short sessions.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/10 p-4 text-center">
                <Flame className="mx-auto mb-2 h-5 w-5" />
                <strong className="block text-xl">7</strong>
                <span className="text-xs text-slate-300">Day streak</span>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 text-center">
                <Target className="mx-auto mb-2 h-5 w-5" />
                <strong className="block text-xl">86%</strong>
                <span className="text-xs text-slate-300">Accuracy</span>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 text-center">
                <Trophy className="mx-auto mb-2 h-5 w-5" />
                <strong className="block text-xl">420</strong>
                <span className="text-xs text-slate-300">XP</span>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search practice..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-slate-400"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {skills.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => setActiveSkill(skill)}
                className={`whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-medium ${
                  activeSkill === skill
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLessons.map((lesson) => (
            <article
              key={lesson.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-5 flex items-start justify-between">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                  {lesson.skillIds[0]}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  +{lesson.xpReward} XP
                </span>
              </div>

              <h2 className="text-lg font-bold">{lesson.title}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                {lesson.description}
              </p>

              <button
                type="button"
                onClick={() => onStartLesson(lesson, 'Practice')}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              >
                <Play className="h-4 w-4" />
                Start practice
              </button>
            </article>
          ))}
        </section>

        {filteredLessons.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-semibold">No practice sessions found.</p>
            <p className="mt-1 text-sm text-slate-500">
              Try another search or skill.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
