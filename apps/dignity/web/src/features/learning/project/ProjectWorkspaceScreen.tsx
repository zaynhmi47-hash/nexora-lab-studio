import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Code2,
  FileText,
  Play,
  Send,
} from 'lucide-react';

export interface ProjectWorkspaceScreenProps {
  projectId: string;
  courseTitle: string;
  onBack: () => void;
}

export const ProjectWorkspaceScreen: React.FC<ProjectWorkspaceScreenProps> = ({
  projectId,
  courseTitle,
  onBack,
}) => {
  const [code, setCode] = useState(
    `function solve(input) {\n  // Implement your solution here.\n  return input;\n}`,
  );
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-5 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to course
            </button>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {courseTitle}
            </p>
            <h1 className="mt-1 text-2xl font-bold">Project workspace</h1>
            <p className="mt-1 text-sm text-slate-400">Project ID: {projectId}</p>
          </div>

          {submitted && (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              Submitted
            </span>
          )}
        </header>

        <div className="mt-6 grid gap-5 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-4">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-300" />
                <h2 className="font-semibold">Project brief</h2>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Build a working solution that satisfies the project requirements.
                Use the workspace to experiment, test, and submit your implementation.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="font-semibold">Checklist</h2>
              <div className="mt-4 space-y-3">
                {[
                  'Understand requirements',
                  'Implement solution',
                  'Test edge cases',
                  'Submit project',
                ].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-slate-400">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 text-xs">
                      {index + 1}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Code2 className="h-4 w-4" />
                Solution
              </div>

              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15"
              >
                <Play className="h-3.5 w-3.5" />
                Run
              </button>
            </div>

            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              spellCheck={false}
              className="min-h-[420px] w-full resize-y bg-slate-950 p-5 font-mono text-sm leading-6 text-slate-200 outline-none"
            />

            <div className="flex justify-end border-t border-white/10 p-4">
              <button
                type="button"
                onClick={() => setSubmitted(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                <Send className="h-4 w-4" />
                Submit project
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};
