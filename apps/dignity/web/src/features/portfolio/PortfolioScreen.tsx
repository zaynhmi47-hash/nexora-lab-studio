import {
  Award,
  BriefcaseBusiness,
  Eye,
  FolderKanban,
  Plus,
  Star,
} from 'lucide-react';

export interface PortfolioScreenProps {
  onNavigateToProjects: () => void;
  onNavigateToPreview: () => void;
  onSkillClick: () => void;
}

const skills = [
  { name: 'React', level: 86 },
  { name: 'TypeScript', level: 78 },
  { name: 'JavaScript', level: 82 },
  { name: 'PostgreSQL', level: 64 },
];

const projects = [
  {
    id: 'portfolio-project-1',
    title: 'E-commerce API',
    description: 'REST API project demonstrating backend development skills.',
  },
  {
    id: 'portfolio-project-2',
    title: 'Task Management App',
    description: 'Full-stack project focused on productivity workflows.',
  },
];

export function PortfolioScreen({
  onNavigateToProjects,
  onNavigateToPreview,
  onSkillClick,
}: PortfolioScreenProps) {
  return (
    <main className="min-h-full bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl bg-slate-900 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm text-slate-300">
                <BriefcaseBusiness className="h-4 w-4" />
                Professional portfolio
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl">
                Showcase what you can build.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Turn your completed learning projects and demonstrated skills into
                a professional portfolio.
              </p>
            </div>

            <button
              type="button"
              onClick={onNavigateToPreview}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900"
            >
              <Eye className="h-4 w-4" />
              Preview portfolio
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <FolderKanban className="mb-3 h-5 w-5" />
            <p className="text-xs text-slate-500">Projects</p>
            <strong className="mt-1 block text-2xl">8</strong>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <Award className="mb-3 h-5 w-5" />
            <p className="text-xs text-slate-500">Certificates</p>
            <strong className="mt-1 block text-2xl">4</strong>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <Star className="mb-3 h-5 w-5" />
            <p className="text-xs text-slate-500">Profile strength</p>
            <strong className="mt-1 block text-2xl">82%</strong>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold">Featured projects</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your strongest completed work.
                </p>
              </div>

              <button
                type="button"
                onClick={onNavigateToProjects}
                className="text-sm font-semibold"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-2xl bg-slate-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                      <FolderKanban className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{project.title}</h3>
                      <p className="mt-1 text-sm leading-5 text-slate-500">
                        {project.description}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <button
              type="button"
              onClick={onNavigateToProjects}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600"
            >
              <Plus className="h-4 w-4" />
              Add project
            </button>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-5">
              <h2 className="font-bold">Skills</h2>
              <p className="mt-1 text-sm text-slate-500">
                Based on learning and project evidence.
              </p>
            </div>

            <div className="space-y-5">
              {skills.map((skill) => (
                <button
                  key={skill.name}
                  type="button"
                  onClick={onSkillClick}
                  className="block w-full text-left"
                >
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-semibold">{skill.name}</span>
                    <span className="text-slate-500">{skill.level}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-slate-900"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
