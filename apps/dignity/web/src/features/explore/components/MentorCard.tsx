import React from 'react';
import { Star, Briefcase, Calendar, ArrowRight, Award } from 'lucide-react';
import { MentorItem } from '../../../types';

interface MentorCardProps {
  mentor: MentorItem;
  onSelect?: (mentor: MentorItem) => void;
}

export const MentorCard: React.FC<MentorCardProps> = ({ mentor, onSelect }) => {
  return (
    <div
      id={`mentor-card-${mentor.id}`}
      onClick={() => onSelect?.(mentor)}
      className="group relative flex flex-col justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer hover:border-indigo-500/40 dark:hover:border-indigo-500/40"
    >
      <div>
        {/* Top Header: Avatar + Title & Company */}
        <div className="flex items-start gap-3.5">
          <img
            src={mentor.avatar}
            alt={mentor.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover ring-2 ring-indigo-500/20"
          />

          <div className="flex-1 min-w-0">
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {mentor.name}
            </h4>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate mt-0.5">
              {mentor.title}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5 truncate">
              <Briefcase className="w-3.5 h-3.5 shrink-0" />
              <span>{mentor.company}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 dark:text-slate-400">{mentor.experienceYears}y exp</span>
            </div>
          </div>
        </div>

        {/* Rating & Sessions banner */}
        <div className="mt-3.5 flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/60 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{mentor.rating.toFixed(2)}</span>
            <span className="text-slate-400 font-normal">({mentor.reviewCount} reviews)</span>
          </div>

          <div className="text-slate-500 dark:text-slate-400 font-medium">
            {mentor.sessionsCompleted} sessions booked
          </div>
        </div>

        {/* Bio snippet */}
        <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {mentor.bio}
        </p>

        {/* Skills Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {mentor.skills.slice(0, 3).map((skill, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
            >
              {skill}
            </span>
          ))}
          {mentor.skills.length > 3 && (
            <span className="px-1.5 py-0.5 rounded-md text-[11px] text-slate-400 font-medium">
              +{mentor.skills.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer: Price, Availability, CTA */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-extrabold text-slate-900 dark:text-white">
              ${mentor.sessionPrice}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">/ 45-min</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            <Calendar className="w-3 h-3 text-indigo-500" />
            <span>{mentor.availability}</span>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
        >
          <span>View Mentor</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
