import React from 'react';

export const ExploreSkeletons: React.FC = () => {
  return (
    <div className="space-y-10 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-4 w-80 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
        <div className="h-12 w-full max-w-2xl bg-slate-200/80 dark:bg-slate-800 rounded-2xl mt-4" />
      </div>

      {/* Categories chips skeleton */}
      <div className="flex gap-2 overflow-x-hidden">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="h-10 w-28 bg-slate-200/70 dark:bg-slate-800 rounded-xl shrink-0"
          />
        ))}
      </div>

      {/* Featured programs grid skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-56 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-72 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800 flex flex-col justify-between p-4"
            >
              <div className="h-32 w-full bg-slate-200 dark:bg-slate-700/60 rounded-xl mb-3" />
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700/60 rounded" />
                <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700/40 rounded" />
              </div>
              <div className="h-8 w-full bg-slate-200/80 dark:bg-slate-700/60 rounded-xl mt-3" />
            </div>
          ))}
        </div>
      </div>

      {/* Education model grid skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800 p-4"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
