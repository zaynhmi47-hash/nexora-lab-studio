import React from 'react';
import { Star, Clock, Globe, ShieldCheck, ArrowRight, Calendar } from 'lucide-react';
import { TutorItem } from '../../../types';

interface TutorCardProps {
  tutor: TutorItem;
  onSelect?: (tutor: TutorItem) => void;
}

export const TutorCard: React.FC<TutorCardProps> = ({ tutor, onSelect }) => {
  return (
    <div
      id={`tutor-card-${tutor.id}`}
      onClick={() => onSelect?.(tutor)}
      className="group relative flex flex-col justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer hover:border-emerald-500/40 dark:hover:border-emerald-500/40"
    >
      <div>
        {/* Header: Avatar, Name, Expertise, Verification */}
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0">
            <img
              src={tutor.avatar}
              alt={tutor.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800"
            />
            {tutor.verified && (
              <span
                title="Verified Tutor"
                className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-white shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {tutor.name}
              </h4>
            </div>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 truncate">
              {tutor.expertise}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {tutor.education}
            </p>
          </div>
        </div>

        {/* Rating & Sessions Stats */}
        <div className="mt-3.5 flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/60 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{tutor.rating.toFixed(2)}</span>
            <span className="text-slate-400 font-normal">({tutor.reviewCount})</span>
          </div>

          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{tutor.sessionsCount} sessions</span>
          </div>
        </div>

        {/* Bio snippet */}
        <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {tutor.bio}
        </p>

        {/* Subjects tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tutor.subjects.slice(0, 3).map((subject, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
            >
              {subject}
            </span>
          ))}
          {tutor.subjects.length > 3 && (
            <span className="px-1.5 py-0.5 rounded-md text-[11px] text-slate-400 font-medium">
              +{tutor.subjects.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer: Price, Availability, CTA */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-extrabold text-slate-900 dark:text-white">
              ${tutor.hourlyPrice}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">/ hour</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{tutor.availability}</span>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
        >
          <span>View Profile</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
