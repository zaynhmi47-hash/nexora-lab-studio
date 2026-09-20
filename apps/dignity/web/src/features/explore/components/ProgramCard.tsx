import React from 'react';
import { Star, Clock, Calendar, Users, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { ProgramItem } from '../../../types';
import { Badge } from '../../../components/ui/Badge';
import { SecondaryButton } from '../../../components/ui/Button';

interface ProgramCardProps {
  program: ProgramItem;
  onSelect?: (program: ProgramItem) => void;
  featured?: boolean;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  bootcamp: { label: 'Bootcamp', color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
  bimbel: { label: 'Bimbel / Prep', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  academy: { label: 'Academy', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  workshop: { label: 'Workshop', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  certification: { label: 'Certification', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  webinar: { label: 'Webinar', color: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
};

export const ProgramCard: React.FC<ProgramCardProps> = ({
  program,
  onSelect,
  featured = false,
}) => {
  const typeConfig = typeLabels[program.type] || {
    label: program.type.toUpperCase(),
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };

  return (
    <div
      id={`program-card-${program.id}`}
      onClick={() => onSelect?.(program)}
      className={`group relative flex flex-col justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer hover:border-blue-500/40 dark:hover:border-blue-500/40 ${
        featured ? 'ring-1 ring-blue-500/20' : ''
      }`}
    >
      {/* Thumbnail Header */}
      <div className="relative aspect-16/9 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={program.thumbnail}
          alt={program.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md border ${typeConfig.color}`}
          >
            {typeConfig.label}
          </span>

          {program.seatsLeft !== undefined && program.seatsLeft <= 10 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white shadow-xs">
              <Users className="w-3 h-3" />
              {program.seatsLeft} seats left
            </span>
          )}
        </div>

        {/* Bottom Banner inside Image */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white/90">
          <span className="font-medium truncate">{program.provider}</span>
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full text-amber-300 font-semibold text-xs">
            <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
            <span>{program.rating.toFixed(2)}</span>
            <span className="text-white/70">({program.reviewCount})</span>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {program.duration}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span>{program.format}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="font-medium text-slate-700 dark:text-slate-300">{program.level}</span>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {program.title}
          </h3>

          {/* Description snippet */}
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {program.description}
          </p>

          {/* Skills tags */}
          {program.skills && program.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {program.skills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  {skill}
                </span>
              ))}
              {program.skills.length > 3 && (
                <span className="px-1.5 py-0.5 rounded-md text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  +{program.skills.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer: Pricing & CTA */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
          <div>
            {program.isFree ? (
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                Free Program
              </span>
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  ${program.price}
                </span>
                {program.originalPrice && program.originalPrice > program.price && (
                  <span className="text-xs text-slate-400 line-through">
                    ${program.originalPrice}
                  </span>
                )}
              </div>
            )}
            {program.startDate && (
              <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                Starts {program.startDate}
              </span>
            )}
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors group-hover:translate-x-0.5"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
