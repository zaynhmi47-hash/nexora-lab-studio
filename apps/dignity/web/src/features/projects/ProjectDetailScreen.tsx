import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Play,
  Target,
} from 'lucide-react';
import type { Project } from '../../types/project';

export interface ProjectDetailScreenProps {
  project: Project;
  onBack: () => void;
  onOpenWorkspace: (project: Project) => void;
}

export function ProjectDetailScreen({
  project,
  onBack,
  onOpenWorkspace,
}: ProjectDetailScreenProps) {
  return (
    <main className="min-h-full bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </button>

        <section className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm text-slate-300">
                <FolderKanban className="h-4 w-4" />
                Project
              </div>

              <h1 className="text-3xl font-bold tracking-tight">
                {project.title}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                {project.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenWorkspace(project)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900"
            >
              <Play className="h-4 w-4" />
              Open workspace
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <Clock3 className="mb-3 h-5 w-5 text-slate-500" />
            <p className="text-xs font-medium text-slate-500">Difficulty</p>
            <p className="mt-1 font-bold">{project.difficulty}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <Target className="mb-3 h-5 w-5 text-slate-500" />
            <p className="text-xs font-medium text-slate-500">Type</p>
            <p className="mt-1 font-bold">{project.projectType}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <CheckCircle2 className="mb-3 h-5 w-5 text-slate-500" />
            <p className="text-xs font-medium text-slate-500">Status</p>
            <p className="mt-1 font-bold">{project.status}</p>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-bold">Project overview</h2>

          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold">Skills</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Objectives</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {project.learningObjectives.map((objective) => (
                  <li key={objective} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    {objective}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
