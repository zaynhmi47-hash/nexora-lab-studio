import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, RefreshCw, Sparkles } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from './Button';

// ==========================================
// Empty State
// ==========================================
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mb-4 shadow-2xs">
        {icon || <Sparkles className="w-6 h-6" />}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      <div className="flex items-center gap-3">
        {actionLabel && onAction && (
          <PrimaryButton size="sm" onClick={onAction}>
            {actionLabel}
          </PrimaryButton>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <SecondaryButton size="sm" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </SecondaryButton>
        )}
      </div>
    </div>
  );
};

// ==========================================
// Loading State
// ==========================================
export interface LoadingStateProps {
  message?: string;
  submessage?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading your learning...',
  submessage = 'Preparing syllabus, active streaks, and assignments.',
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-12 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/40 backdrop-blur-xs ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border-3 border-blue-500/20" />
        <div className="absolute inset-0 rounded-full border-3 border-blue-600 border-t-transparent animate-spin" />
      </div>
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{message}</p>
      {submessage && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">{submessage}</p>
      )}
    </div>
  );
};

// ==========================================
// Error State
// ==========================================
export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Unable to fetch data from the educational registry. Please try again or check your connectivity.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 ${className}`}
      role="alert"
    >
      <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <PrimaryButton size="sm" onClick={onRetry} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Try Again
        </PrimaryButton>
      )}
    </div>
  );
};

// ==========================================
// Alert Banner
// ==========================================
export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onDismiss,
  className = '',
}) => {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800/80 dark:text-blue-200',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800/80 dark:text-emerald-200',
    warning: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800/80 dark:text-amber-200',
    error: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-800/80 dark:text-red-200',
  };

  const icons = {
    info: <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />,
  };

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border text-xs sm:text-sm ${styles[variant]} ${className}`}
    >
      <div className="mt-0.5">{icons[variant]}</div>
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-0.5">{title}</h4>}
        <div className="leading-relaxed opacity-90">{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
          aria-label="Dismiss alert"
        >
          ×
        </button>
      )}
    </div>
  );
};

// ==========================================
// Toast Notification
// ==========================================
export interface ToastProps {
  title: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  title,
  message,
  type = 'info',
  onClose,
  className = '',
}) => {
  return (
    <div
      role="status"
      className={`fixed bottom-5 right-5 z-50 flex items-start gap-3 max-w-sm p-4 rounded-xl shadow-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-bottom-3 duration-200 ${className}`}
    >
      <div className="mt-0.5">
        {type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        {type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
        {type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
        {type === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
      </div>
      <div className="flex-1">
        <h5 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">{title}</h5>
        {message && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          aria-label="Close notification"
        >
          ×
        </button>
      )}
    </div>
  );
};
