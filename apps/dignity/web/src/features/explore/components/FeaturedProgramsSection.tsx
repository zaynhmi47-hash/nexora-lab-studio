import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { ProgramItem } from '../../../types';
import { ProgramCard } from './ProgramCard';

interface FeaturedProgramsSectionProps {
  programs: ProgramItem[];
  onSelectProgram: (program: ProgramItem) => void;
  onViewAll?: () => void;
}

export const FeaturedProgramsSection: React.FC<FeaturedProgramsSectionProps> = ({
  programs,
  onSelectProgram,
  onViewAll,
}) => {
  const featuredList = programs.filter((p) => p.isFeatured).slice(0, 4);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>High-Impact Learning</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Featured Intensive Programs
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Curated cohorts, bootcamps, and prep academies with proven career and academic track records.
          </p>
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
          >
            <span>Browse All Programs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {featuredList.map((program) => (
          <ProgramCard
            key={program.id}
            program={program}
            featured
            onSelect={onSelectProgram}
          />
        ))}
      </div>
    </section>
  );
};
