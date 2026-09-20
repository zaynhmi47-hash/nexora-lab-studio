import React from 'react';
import { Compass, CheckCircle2, Disc, Circle, Clock, Award, X, ArrowRight } from 'lucide-react';
import { Modal } from '../../../components/ui/Overlay';
import { PrimaryButton, SecondaryButton } from '../../../components/ui/Button';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { LearningPathStep } from '../../../types';

export interface LearningPathModalProps {
  isOpen: boolean;
  onClose: () => void;
  pathTitle: string;
  progressPercent: number;
  steps: LearningPathStep[];
  onSelectStep?: (step: LearningPathStep) => void;
}

export const LearningPathModal: React.FC<LearningPathModalProps> = ({
  isOpen,
  onClose,
  pathTitle,
  progressPercent,
  steps,
  onSelectStep,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Career Roadmap Syllabus
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                {pathTitle}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress summary bar */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-slate-600 dark:text-slate-300">
              Overall Track Completion: <strong>{progressPercent}%</strong>
            </span>
          </div>

          <div className="w-32">
            <ProgressBar value={progressPercent} max={100} variant="primary" size="sm" showValue={false} />
          </div>
        </div>

        {/* Steps Timeline List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {steps.map((step, idx) => {
              const isCompleted = step.status === 'completed';
              const isCurrent = step.status === 'current';
              const isUpcoming = step.status === 'upcoming';

              return (
                <div key={step.id} className="relative">
                  {/* Node icon */}
                  <div className="absolute -left-6 sm:-left-8 top-1">
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

                  {/* Step Card */}
                  <div
                    className={`p-4 rounded-xl border ${
                      isCurrent
                        ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60'
                        : isCompleted
                        ? 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800'
                        : 'bg-white dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/60 opacity-80'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">Milestone 0{idx + 1}</span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {step.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        {step.estimatedWeeks && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {step.estimatedWeeks} wks
                          </span>
                        )}

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCurrent
                              ? 'bg-blue-600 text-white'
                              : isCompleted
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isCurrent ? 'Current' : isCompleted ? 'Mastered' : 'Locked'}
                        </span>
                      </div>
                    </div>

                    {step.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        {step.description}
                      </p>
                    )}

                    {isCurrent && (
                      <div className="mt-3 pt-2 border-t border-blue-200/60 dark:border-blue-900/40 flex justify-end">
                        <PrimaryButton
                          size="sm"
                          onClick={() => {
                            onSelectStep?.(step);
                            onClose();
                          }}
                          leftIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          Resume Active Lessons
                        </PrimaryButton>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <SecondaryButton size="sm" onClick={onClose}>
            Close Roadmap
          </SecondaryButton>
        </div>
      </div>
    </Modal>
  );
};
