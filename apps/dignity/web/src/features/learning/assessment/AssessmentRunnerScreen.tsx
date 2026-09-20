import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export interface AssessmentMistakeContext {
  questionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  skillName: string;
}

export interface AssessmentRunnerScreenProps {
  assessmentId: string;
  courseTitle: string;
  onBack: () => void;
  onPracticeSkill: () => void;
  onOpenAITutor: (mistakeContext: AssessmentMistakeContext) => void;
}

interface AssessmentQuestion {
  id: string;
  question: string;
  skillName: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'assessment-q1',
    question: 'Which approach keeps a React component predictable when rendering derived data?',
    skillName: 'React fundamentals',
    options: [
      'Derive it during render from current props/state',
      'Mutate the DOM directly',
      'Store every derived value separately',
      'Reload the page after every change',
    ],
    correctAnswer: 'Derive it during render from current props/state',
    explanation: 'Derived UI data should normally be calculated from the current component inputs rather than duplicated as mutable state.',
  },
  {
    id: 'assessment-q2',
    question: 'What is the primary purpose of a database index?',
    skillName: 'Database fundamentals',
    options: [
      'Speed up suitable queries',
      'Encrypt every database record',
      'Replace database backups',
      'Prevent all duplicate records',
    ],
    correctAnswer: 'Speed up suitable queries',
    explanation: 'Indexes provide data structures that can make suitable lookups and ordering operations faster, at the cost of storage and write overhead.',
  },
  {
    id: 'assessment-q3',
    question: 'Which HTTP method is conventionally used to partially update an existing resource?',
    skillName: 'API design',
    options: ['GET', 'PATCH', 'HEAD', 'OPTIONS'],
    correctAnswer: 'PATCH',
    explanation: 'PATCH is conventionally used for partial modifications to an existing resource.',
  },
];

export const AssessmentRunnerScreen: React.FC<AssessmentRunnerScreenProps> = ({
  assessmentId,
  courseTitle,
  onBack,
  onPracticeSkill,
  onOpenAITutor,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const question = QUESTIONS[currentIndex];

  const score = useMemo(() => {
    return QUESTIONS.reduce(
      (total, item) => total + (answers[item.id] === item.correctAnswer ? 1 : 0),
      0,
    );
  }, [answers]);

  const handleAnswer = (answer: string) => {
    setAnswers((current) => ({ ...current, [question.id]: answer }));
  };

  const handleNext = () => {
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex((current) => current + 1);
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    const percentage = Math.round((score / QUESTIONS.length) * 100);
    const firstMistake = QUESTIONS.find((item) => answers[item.id] !== item.correctAnswer);

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Sparkles className="h-8 w-8" />
            </div>

            <p className="mt-5 text-sm font-medium text-slate-500">{courseTitle}</p>
            <h1 className="mt-2 text-3xl font-bold">Assessment complete</h1>
            <p className="mt-4 text-5xl font-bold">{percentage}%</p>
            <p className="mt-2 text-sm text-slate-500">
              {score} of {QUESTIONS.length} questions correct.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
              >
                Back to course
              </button>

              <button
                type="button"
                onClick={onPracticeSkill}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                Practice skill
              </button>

              {firstMistake && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenAITutor({
                      questionId: firstMistake.id,
                      questionText: firstMistake.question,
                      userAnswer: answers[firstMistake.id] ?? '',
                      correctAnswer: firstMistake.correctAnswer,
                      explanation: firstMistake.explanation,
                      skillName: firstMistake.skillName,
                    })
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
                >
                  Explain mistake
                </button>
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  const selectedAnswer = answers[question.id];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="mt-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">{courseTitle}</p>
              <h1 className="mt-1 text-2xl font-bold">Assessment</h1>
              <p className="mt-1 text-xs text-slate-400">{assessmentId}</p>
            </div>
            <span className="text-sm font-semibold text-slate-500">
              {currentIndex + 1}/{QUESTIONS.length}
            </span>
          </div>

          <div className="mt-5 h-2 rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{
                width: `${((currentIndex + 1) / QUESTIONS.length) * 100}%`,
              }}
            />
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <CircleHelp className="h-4 w-4" />
            {question.skillName}
          </div>

          <h2 className="mt-5 text-xl font-bold leading-8">{question.question}</h2>

          <div className="mt-6 space-y-3">
            {question.options.map((option) => {
              const selected = selectedAnswer === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleAnswer(option)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left text-sm font-medium transition ${
                    selected
                      ? 'border-slate-900 bg-slate-100'
                      : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {selected ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                  ) : (
                    <span className="h-5 w-5 shrink-0 rounded-full border border-slate-300" />
                  )}
                  {option}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentIndex((current) => Math.max(current - 1, 0))}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold disabled:opacity-30"
            >
              <RotateCcw className="h-4 w-4" />
              Previous
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!selectedAnswer}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {currentIndex === QUESTIONS.length - 1 ? 'Submit' : 'Next'}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
};
