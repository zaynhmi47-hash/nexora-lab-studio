import React from 'react';
import { CheckCircle2, Circle, Disc, Compass, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardBody } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { LearningPathStep } from '../../../types';

export interface LearningPathPreviewProps {
  pathTitle: string;
  progressPercent: number;
  steps: LearningPathStep[];
  onViewFullPath: () => void;
}

export const LearningPathPreview: React.FC<LearningPathPreviewProps> = ({
  pathTitle,
  progressPercent,
  steps,
  onViewFullPath,
}) => {
  return (
    <section aria-labelledby="learning-path-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Roadmap
          </span>
          <h2
            id="learning-path-heading"
            className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight"
          >
            Curriculum Learning Path
          </h2>
        </div>

        <button
          onClick={onViewFullPath}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <span>View full path</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <Card elevation="subtle" className="border border-slate-200/90 dark:border-slate-800/90 overflow-hidden">
        <CardBody className="p-5 sm:p-6">
          {/* Header & Goal Progress */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                  Career Track
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {pathTitle}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                7 Core Milestones • Comprehensive Engineering Competency
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="text-right">
                <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                  {progressPercent}%
                </span>
                <span className="text-[10px] text-slate-400 block">Completed</span>
              </div>
              <div className="w-24">
                <ProgressBar value={progressPercent} max={100} variant="primary" size="sm" showValue={false} />
              </div>
            </div>
          </div>

          {/* Visual Step Timeline */}
          <div className="mt-5 space-y-4">
            <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {steps.map((step, idx) => {
                const isCompleted = step.status === 'completed';
                const isCurrent = step.status === 'current';
                const isUpcoming = step.status === 'upcoming';

                return (
                  <div key={step.id} className="relative group">
                    {/* Node Indicator */}
                    <div className="absolute -left-6 sm:-left-8 top-0.5">
                      {isCompleted && (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                        </div>
                      )}
                      {isCurrent && (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 text-white flex items-center justify-center ring-4 ring-blue-100 dark:ring-blue-950 animate-pulse shadow-sm">
                          <Disc className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
                        </div>
                      )}
                      {isUpcoming && (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center">
                          <Circle className="w-2 h-2 text-slate-400 dark:text-slate-600" />
                        </div>
                      )}
                    </div>

                    {/* Step Content */}
                    <div
                      className={`p-3 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 shadow-xs'
                          : isCompleted
                          ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/80'
                          : 'bg-white/40 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800/40 opacity-75'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                            0{idx + 1}
                          </span>
                          <h4
                            className={`text-xs sm:text-sm font-bold ${
                              isCurrent
                                ? 'text-blue-700 dark:text-blue-300'
                                : isCompleted
                                ? 'text-slate-800 dark:text-slate-200'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {step.title}
                          </h4>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCurrent
                              ? 'bg-blue-600 text-white'
                              : isCompleted
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isCurrent ? 'Current Milestone' : isCompleted ? 'Completed' : 'Upcoming'}
                        </span>
                      </div>

                      {step.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-5">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action to explore the roadmap */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={onViewFullPath}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Detailed Syllabus & Projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </CardBody>
      </Card>
    </section>
  );
};
