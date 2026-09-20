import React from 'react';
import { Calendar, Clock, Video, Users, ArrowRight, Radio } from 'lucide-react';
import { WebinarItem } from '../../../types';

interface WebinarCardProps {
  webinar: WebinarItem;
  onSelect?: (webinar: WebinarItem) => void;
}

export const WebinarCard: React.FC<WebinarCardProps> = ({ webinar, onSelect }) => {
  return (
    <div
      id={`webinar-card-${webinar.id}`}
      onClick={() => onSelect?.(webinar)}
      className="group relative flex flex-col justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer hover:border-rose-500/40 dark:hover:border-rose-500/40"
    >
      <div>
        {/* Live / Recorded Badge & Topic */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {webinar.isLive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Live Interactive</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Video className="w-3.5 h-3.5 text-slate-400" />
              <span>Recorded Masterclass</span>
            </span>
          )}

          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
            {webinar.topic}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2 leading-snug">
          {webinar.title}
        </h4>

        {/* Speaker Profile */}
        <div className="mt-3.5 flex items-center gap-3">
          <img
            src={webinar.speakerAvatar}
            alt={webinar.speaker}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-500/20"
          />
          <div className="min-w-0 flex-1">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {webinar.speaker}
            </h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {webinar.speakerRole} • {webinar.speakerCompany}
            </p>
          </div>
        </div>

        {/* Schedule & Duration details */}
        <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/60 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">{webinar.date}</span>
          </div>

          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{webinar.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{webinar.attendeesCount} enrolled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Price & CTA */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <div>
          {webinar.isFree ? (
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              Free Access
            </span>
          ) : (
            <span className="text-base font-extrabold text-slate-900 dark:text-white">
              ${webinar.price}
            </span>
          )}
          <span className="block text-[11px] text-slate-400">{webinar.time}</span>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
        >
          <span>View Webinar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
