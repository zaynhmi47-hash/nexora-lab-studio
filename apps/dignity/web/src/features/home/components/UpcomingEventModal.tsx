import React from 'react';
import { Video, FileText, HelpCircle, Users, Clock, Calendar, Check, X, ExternalLink, Download } from 'lucide-react';
import { Modal } from '../../../components/ui/Overlay';
import { PrimaryButton, SecondaryButton } from '../../../components/ui/Button';
import { UpcomingEvent } from '../../../types';

export interface UpcomingEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: UpcomingEvent | null;
  onConfirmAction?: (event: UpcomingEvent) => void;
}

export const UpcomingEventModal: React.FC<UpcomingEventModalProps> = ({
  isOpen,
  onClose,
  event,
  onConfirmAction,
}) => {
  if (!event) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Interactive Learning Session
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug mt-0.5">
              {event.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Course & Schedule Details */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Enrolled Course:</span>
            <span className="font-bold text-slate-900 dark:text-white">{event.courseTitle}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Time & Date:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{event.scheduledTime}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Duration:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{event.durationMinutes} minutes</span>
          </div>

          {event.instructorName && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Instructor:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{event.instructorName}</span>
            </div>
          )}
        </div>

        {/* Preparation Guidelines */}
        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
          <span className="font-bold text-slate-900 dark:text-white block">Session Preparation:</span>
          <p className="leading-relaxed">
            Please make sure you have reviewed the reading materials and installed the required development dependencies prior to joining the live classroom.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
          <SecondaryButton size="sm" onClick={onClose}>
            Dismiss
          </SecondaryButton>
          <PrimaryButton
            size="sm"
            onClick={() => {
              onConfirmAction?.(event);
              onClose();
            }}
            leftIcon={<ExternalLink className="w-4 h-4" />}
          >
            {event.linkText}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
};
