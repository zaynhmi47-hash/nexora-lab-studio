import {
  ArrowLeft,
  CheckCircle2,
  MessageSquare,
  Share2,
  Sparkles,
} from 'lucide-react';

export interface ProjectReviewScreenProps {
  projectId: string;
  onBack: () => void;
  onNavigateToPortfolio: () => void;
  onShareToCommunity: () => void;
}

const criteria = [
  { label: 'Requirements completed', value: 92 },
  { label: 'Code quality', value: 88 },
  { label: 'Problem solving', value: 90 },
  { label: 'Documentation', value: 84 },
];

export function ProjectReviewScreen({
  projectId,
  onBack,
  onNavigateToPortfolio,
  onShareToCommunity,
}: ProjectReviewScreenProps) {
  return (
    <main className="min-h-full bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to workspace
        </button>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Project review</p>
              <h1 className="mt-1 text-3xl font-bold">Project {projectId}</h1>
            </div>

            <div className="rounded-3xl bg-slate-900 px-6 py-4 text-center text-white">
              <span className="block text-3xl font-bold">89%</span>
              <span className="text-xs text-slate-300">Review score</span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h2 className="font-bold">Evaluation</h2>
          </div>

          <div className="mt-5 space-y-4">
            {criteria.map((criterion) => (
              <div key={criterion.label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium">{criterion.label}</span>
                  <span className="font-bold">{criterion.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-slate-900"
                    style={{ width: `${criterion.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-bold">Feedback</h2>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <div className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
              <CheckCircle2 className="h-4 w-4" />
              Strong project completion
            </div>
            Your implementation demonstrates good understanding of the required
            concepts. Consider improving documentation and adding more edge-case tests.
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={onNavigateToPortfolio}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
          >
            Add to portfolio
          </button>

          <button
            type="button"
            onClick={onShareToCommunity}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>

          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"
          >
            <MessageSquare className="h-4 w-4" />
            Continue
          </button>
        </div>
      </div>
    </main>
  );
}
