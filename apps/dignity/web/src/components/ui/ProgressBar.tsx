import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercentText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning' | 'info';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentText = false,
  size = 'md',
  variant = 'primary',
  className = '',
}) => {
  const percentage = Math.min(Math.max(0, Math.round((value / max) * 100)), 100);

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  const fillColors = {
    primary: 'bg-blue-600 dark:bg-blue-500',
    success: 'bg-emerald-600 dark:bg-emerald-500',
    warning: 'bg-amber-500 dark:bg-amber-400',
    info: 'bg-cyan-500 dark:bg-cyan-400',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentText) && (
        <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
          {label && <span>{label}</span>}
          {showPercentText && <span className="font-semibold text-slate-900 dark:text-white">{percentage}%</span>}
        </div>
      )}
      <div
        className={`w-full bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden ${heightStyles[size]}`}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress bar'}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${fillColors[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'primary' | 'success' | 'warning';
  label?: React.ReactNode;
  sublabel?: string;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  max = 100,
  size = 72,
  strokeWidth = 6,
  variant = 'primary',
  label,
  sublabel,
  className = '',
}) => {
  const percentage = Math.min(Math.max(0, Math.round((value / max) * 100)), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const strokeColors = {
    primary: 'text-blue-600 dark:text-blue-500',
    success: 'text-emerald-600 dark:text-emerald-500',
    warning: 'text-amber-500 dark:text-amber-400',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-800"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-700 ease-out ${strokeColors[variant]}`}
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {label ? (
          typeof label === 'string' || typeof label === 'number' ? (
            <span className="text-xs font-bold text-slate-900 dark:text-white">{label}</span>
          ) : (
            label
          )
        ) : (
          <span className="text-xs font-bold text-slate-900 dark:text-white">{percentage}%</span>
        )}
        {sublabel && (
          <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};
