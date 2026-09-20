import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Trophy,
  Zap,
} from 'lucide-react';
import type { EngineLesson } from '../../../types/learningEngine';

export interface LessonScreenProps {
  lesson: EngineLesson;
  moduleTitle: string;
  onExit: () => void;
}

export const LessonScreen: React.FC<LessonScreenProps> = ({
  lesson,
  moduleTitle,
  onExit,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | boolean | null>(null);
  const [completed, setCompleted] = useState(false);

  const activity = lesson.activities[activeIndex];

  const progress = useMemo(
    () => ((activeIndex + (completed ? 1 : 0)) / Math.max(lesson.activities.length, 1)) * 100,
    [activeIndex, completed, lesson.activities.length],
  );

  const handleContinue = () => {
    if (activeIndex < lesson.activities.length - 1) {
      setActiveIndex((current) => current + 1);
      setSelectedAnswer(null);
      return;
    }

    setCompleted(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit lesson
          </button>

          <div className="mt-5">
            <p className="text-sm font-medium text-slate-500">{moduleTitle}</p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold sm:text-3xl">{lesson.title}</h1>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
                <Zap className="h-3.5 w-3.5" />
                +{lesson.xpReward} XP
              </span>
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </header>

        {completed ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Trophy className="h-8 w-8 text-slate-800" />
            </div>
            <h2 className="mt-5 text-2xl font-bold">Lesson completed</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              You completed all activities in this lesson and earned the lesson XP reward.
            </p>

            <button
              type="button"
              onClick={onExit}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Back to learning
              <ChevronRight className="h-4 w-4" />
            </button>
          </section>
        ) : (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <CircleHelp className="h-4 w-4" />
              Activity {activeIndex + 1} of {lesson.activities.length}
            </div>

            <h2 className="mt-5 text-xl font-bold leading-8">
              {activity.question}
            </h2>

            {activity.options && activity.options.length > 0 ? (
              <div className="mt-6 grid gap-3">
                {activity.options.map((option) => {
                  const value = String(option);

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedAnswer(value)}
                      className={`rounded-2xl border p-4 text-left text-sm font-medium transition ${
                        selectedAnswer === value
                          ? 'border-slate-900 bg-slate-100'
                          : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                Complete this activity and continue when you are ready.
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={handleContinue}
                disabled={Boolean(activity.options?.length) && selectedAnswer === null}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {activeIndex === lesson.activities.length - 1 ? 'Complete lesson' : 'Continue'}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
};
