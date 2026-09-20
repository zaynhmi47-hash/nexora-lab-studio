import React, { useState } from 'react';
import { X, Flag, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from '../../../components/ui/Button';

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { reason: string; details?: string }) => void;
  targetType: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  targetType,
}) => {
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ reason, details });
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-xl overflow-hidden p-6 space-y-4">
        {isSubmitted ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Report Submitted
            </h3>
            <p className="text-xs text-slate-500">
              Thank you for keeping our learning community safe and constructive.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-rose-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Report {targetType}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Please select the primary reason for reporting this contribution:
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                {[
                  { id: 'spam', label: 'Spam, promotional, or repetitive' },
                  { id: 'inappropriate', label: 'Inappropriate or harmful conduct' },
                  { id: 'misleading', label: 'Incorrect or misleading technical advice' },
                  { id: 'harassment', label: 'Harassment or personal attacks' },
                  { id: 'other', label: 'Other issue' },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      reason === item.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={item.id}
                      checked={reason === item.id}
                      onChange={(e) => setReason(e.target.value)}
                      className="hidden"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide any context that will assist moderators..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <SecondaryButton size="sm" onClick={onClose}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton size="sm" type="submit">
                  Submit Report
                </PrimaryButton>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
