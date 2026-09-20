import React from 'react';
import { Award, Clock, FileCheck, ArrowRight, ShieldCheck } from 'lucide-react';
import { CertificationItem } from '../../../types';

interface CertificationCardProps {
  certification: CertificationItem;
  onSelect?: (cert: CertificationItem) => void;
}

export const CertificationCard: React.FC<CertificationCardProps> = ({
  certification,
  onSelect,
}) => {
  return (
    <div
      id={`cert-card-${certification.id}`}
      onClick={() => onSelect?.(certification)}
      className="group relative flex flex-col justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer hover:border-purple-500/40 dark:hover:border-purple-500/40"
    >
      <div>
        {/* Header: Issuer badge & Level */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80">
            <Award className="w-3.5 h-3.5" />
            <span>Professional Certificate</span>
          </div>

          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {certification.difficulty}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2 leading-snug">
          {certification.name}
        </h4>

        {/* Skill Area & Issuer */}
        <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mt-1">
          {certification.skillArea}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
          <span className="truncate">{certification.issuer}</span>
        </p>

        {/* Prep duration & Assessment type */}
        <div className="mt-3.5 grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/60 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Estimated Prep
            </span>
            <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-purple-500" />
              <span>{certification.estimatedPrepWeeks} weeks</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Assessment
            </span>
            <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
              <FileCheck className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span className="truncate">{certification.assessmentType.split('+')[0]}</span>
            </div>
          </div>
        </div>

        {/* Validated Skills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {certification.skillsValidated.slice(0, 3).map((skill, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300"
            >
              {skill}
            </span>
          ))}
          {certification.skillsValidated.length > 3 && (
            <span className="px-1.5 py-0.5 rounded-md text-[11px] text-slate-400 font-medium">
              +{certification.skillsValidated.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer: Price / Free & CTA */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <div>
          {certification.isFree ? (
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              Free Assessment
            </span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                ${certification.price}
              </span>
              <span className="text-xs text-slate-400">exam fee</span>
            </div>
          )}
          <span className="block text-[11px] text-slate-500 dark:text-slate-400">
            {certification.learnersCount.toLocaleString()} candidates
          </span>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
        >
          <span>Explore</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
