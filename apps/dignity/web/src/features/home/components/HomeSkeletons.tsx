import React from 'react';
import { Card, CardBody } from '../../../components/ui/Card';

export const HomeSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading dashboard">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-2">
            <div className="w-44 h-5 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="w-60 h-3.5 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-24 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Main Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Continue Learning Skeleton */}
          <div className="space-y-3">
            <div className="w-36 h-4 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Learning Path Preview Skeleton */}
          <div className="space-y-3">
            <div className="w-48 h-4 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Recommended Learning Skeleton */}
          <div className="space-y-3">
            <div className="w-40 h-4 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-60 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-60 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        </div>

        {/* Right / Sidebar Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
};
