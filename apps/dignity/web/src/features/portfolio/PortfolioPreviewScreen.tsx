import {
  ArrowLeft,
  ExternalLink,
  Github,
  Mail,
  MapPin,
} from 'lucide-react';

export interface PortfolioPreviewScreenProps {
  onBack: () => void;
}

export function PortfolioPreviewScreen({
  onBack,
}: PortfolioPreviewScreenProps) {
  return (
    <main className="min-h-full bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to portfolio
        </button>

        <article className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200">
          <header className="bg-slate-900 px-6 py-12 text-white sm:px-10">
            <p className="text-sm font-medium text-slate-400">Dignity Portfolio</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">
              Full-Stack Developer
            </h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Building practical digital products with modern web technologies,
              thoughtful UX, and maintainable engineering practices.
            </p>

            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-300">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Indonesia
              </span>
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Available for opportunities
              </span>
            </div>
          </header>

          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_280px]">
            <section className="space-y-8">
              <div>
                <h2 className="text-xl font-bold">About</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  A learning-driven developer portfolio demonstrating completed
                  projects, technical skills, and continuous professional growth.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold">Selected work</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {['E-commerce API', 'Task Management App'].map((title) => (
                    <div
                      key={title}
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                      <h3 className="font-bold">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Completed project demonstrating practical development
                        and problem-solving skills.
                      </p>
                      <button
                        type="button"
                        className="mt-4 flex items-center gap-2 text-sm font-semibold"
                      >
                        View project
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside>
              <div className="rounded-3xl bg-slate-50 p-5">
                <h2 className="font-bold">Core skills</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['React', 'TypeScript', 'JavaScript', 'PostgreSQL', 'Git'].map(
                    (skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
                      >
                        {skill}
                      </span>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
                >
                  <Github className="h-4 w-4" />
                  View GitHub
                </button>
              </div>
            </aside>
          </div>
        </article>
      </div>
    </main>
  );
}
