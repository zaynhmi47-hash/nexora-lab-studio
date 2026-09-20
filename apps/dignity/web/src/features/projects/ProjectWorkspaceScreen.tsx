import { useState } from 'react';
import type { Project } from '../../types/project';
import { mockProjects } from '../../data/mock/projectData';
import {
  ArrowLeft,
  CheckCircle2,
  Code2,
  FileText,
  Send,
} from 'lucide-react';

export interface ProjectWorkspaceScreenProps {
  projectId: string;
  onBack: () => void;
  onSubmitProject: (project: Project) => void;
  onOpenReview: (project: Project) => void;
  onAddToPortfolio: () => void;
  onNavigateToCourse: (courseId?: string) => void;
}

const initialChecklist = [
  'Define the project requirements',
  'Implement the main functionality',
  'Add validation and error handling',
  'Test the completed project',
];

export function ProjectWorkspaceScreen({
  projectId,
  onBack,
  onSubmitProject,
  onOpenReview,
  onAddToPortfolio,
  onNavigateToCourse,
}: ProjectWorkspaceScreenProps) {
  const [code, setCode] = useState(
    '// Start implementing your project here.\\n\\nfunction main() {\\n  return true;\\n}',
  );
  const [completedItems, setCompletedItems] = useState<string[]>([]);

  const project = mockProjects.find((item) => item.id === projectId);

  if (!project) {
    return (
      <main className="min-h-full bg-slate-950 px-4 py-8 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <h1 className="text-2xl font-bold">Project not found</h1>
          <p className="mt-2 text-sm text-slate-400">
            The requested project could not be loaded.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-5 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-900"
          >
            Back
          </button>
        </div>
      </main>
    );
  }

  const toggleItem = (item: string) => {
    setCompletedItems((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item],
    );
  };

  return (
    <main className="min-h-full bg-slate-950 px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onOpenReview(project)}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold"
            >
              Review
            </button>
            <button
              type="button"
              onClick={onAddToPortfolio}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold"
            >
              Add to portfolio
            </button>
            <button
              type="button"
              onClick={() => onSubmitProject(project)}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900"
            >
              <Send className="h-4 w-4" />
              Submit
            </button>
          </div>
        </header>

        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Project workspace
          </p>
          <h1 className="mt-1 text-2xl font-bold">Project {projectId}</h1>
        </section>

        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-bold">Checklist</h2>

            <div className="mt-4 space-y-2">
              {initialChecklist.map((item) => {
                const completed = completedItems.includes(item);

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleItem(item)}
                    className="flex w-full items-start gap-3 rounded-2xl p-3 text-left hover:bg-slate-800"
                  >
                    <CheckCircle2
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        completed ? 'opacity-100' : 'opacity-30'
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        completed ? 'text-slate-400 line-through' : 'text-slate-200'
                      }`}
                    >
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onNavigateToCourse()}
              className="mt-5 w-full rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold"
            >
              Return to course
            </button>
          </aside>

          <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
              <Code2 className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-semibold">Workspace</span>
              <span className="ml-auto flex items-center gap-2 text-xs text-slate-500">
                <FileText className="h-3.5 w-3.5" />
                main.ts
              </span>
            </div>

            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              spellCheck={false}
              className="min-h-[420px] w-full resize-y bg-slate-950 p-5 font-mono text-sm leading-7 text-slate-200 outline-none"
            />
          </section>
        </div>
      </div>
    </main>
  );
}
