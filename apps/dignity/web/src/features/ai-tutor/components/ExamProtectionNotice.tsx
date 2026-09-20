import React from 'react';
import { ShieldAlert, ArrowLeft, Clock } from 'lucide-react';
import { PrimaryButton } from '../../../components/ui/Button';

export interface ExamProtectionNoticeProps {
  examTitle?: string;
  timeRemainingSecs?: number;
  onReturnToExam: () => void;
}

export const ExamProtectionNotice: React.FC<ExamProtectionNoticeProps> = ({
  examTitle = 'Midterm Certification Exam',
  timeRemainingSecs,
  onReturnToExam,
}) => {
  const formatTime = (secs?: number) => {
    if (!secs) return 'Active';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 p-5 text-center max-w-lg mx-auto my-6 space-y-4 shadow-sm">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
        <ShieldAlert className="w-6 h-6" />
      </div>

      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 mb-2">
          Academic Honor Code Active
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          AI Tutor is Restricted During Active Exams
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
          Direct solution answers and quiz shortcuts are temporarily disabled for{' '}
          <strong className="text-slate-900 dark:text-white">{examTitle}</strong> to protect academic
          integrity and credential validity.
        </p>
      </div>

      {timeRemainingSecs !== undefined && (
        <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/80 px-3 py-1.5 rounded-xl">
          <Clock className="w-3.5 h-3.5" />
          <span>Timer Running: {formatTime(timeRemainingSecs)}</span>
        </div>
      )}

      <div className="pt-2">
        <PrimaryButton onClick={onReturnToExam} className="w-full justify-center">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Return to Active Assessment</span>
        </PrimaryButton>
      </div>

      <p className="text-[11px] text-slate-400">
        AI Mistake Diagnostics and Skill Remediations will unlock automatically once your exam is submitted.
      </p>
    </div>
  );
};
