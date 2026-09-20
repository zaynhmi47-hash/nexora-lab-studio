import React from 'react';
import {
  BookOpen,
  GraduationCap,
  Flame,
  Building2,
  Wrench,
  UserCheck,
  Compass,
  Award,
  Video,
  ArrowUpRight,
} from 'lucide-react';
import { EducationType } from '../../../types';

interface EducationTypeExplorerProps {
  selectedType: EducationType | 'all';
  onSelectType: (type: EducationType | 'all') => void;
  counts?: Record<string, number>;
}

interface TypeModelDefinition {
  id: EducationType;
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  borderHover: string;
  bgLight: string;
}

const educationModels: TypeModelDefinition[] = [
  {
    id: 'course',
    title: 'Self-Paced Courses',
    badge: 'Video & Guided',
    description: 'Structured video modules, interactive coding exercises, and knowledge benchmarks.',
    icon: BookOpen,
    accentColor: 'text-blue-600 dark:text-blue-400',
    borderHover: 'hover:border-blue-500/50',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
  },
  {
    id: 'bootcamp',
    title: 'Career Bootcamps',
    badge: 'Cohort & Projects',
    description: 'Multi-week intensive cohorts with live mentorship, code reviews, and career outcomes.',
    icon: Flame,
    accentColor: 'text-indigo-600 dark:text-indigo-400',
    borderHover: 'hover:border-indigo-500/50',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/40',
  },
  {
    id: 'bimbel',
    title: 'Bimbel & Exam Prep',
    badge: 'UTBK & Academic',
    description: 'Intensive university entrance drills (SNBT), CBT simulation tryouts, and school subjects.',
    icon: GraduationCap,
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    borderHover: 'hover:border-emerald-500/50',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
  {
    id: 'academy',
    title: 'Specialized Academies',
    badge: 'Deep Curriculum',
    description: 'Multi-tiered institutional programs designed for mastery in languages and domain tracks.',
    icon: Building2,
    accentColor: 'text-cyan-600 dark:text-cyan-400',
    borderHover: 'hover:border-cyan-500/50',
    bgLight: 'bg-cyan-50 dark:bg-cyan-950/40',
  },
  {
    id: 'workshop',
    title: 'Hands-On Workshops',
    badge: '1-2 Week Deep Dives',
    description: 'Focused tactical workshops solving specific production challenges with domain experts.',
    icon: Wrench,
    accentColor: 'text-amber-600 dark:text-amber-400',
    borderHover: 'hover:border-amber-500/50',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
  },
  {
    id: 'tutor',
    title: '1-on-1 Tutors',
    badge: 'Private Coaching',
    description: 'Personalized hourly tutoring for math, physics, coding syntax, and test mastery.',
    icon: UserCheck,
    accentColor: 'text-teal-600 dark:text-teal-400',
    borderHover: 'hover:border-teal-500/50',
    bgLight: 'bg-teal-50 dark:bg-teal-950/40',
  },
  {
    id: 'mentor',
    title: 'Industry Mentors',
    badge: 'Career Strategy',
    description: 'Direct 45-minute advisories with senior staff engineers and directors from top tech firms.',
    icon: Compass,
    accentColor: 'text-purple-600 dark:text-purple-400',
    borderHover: 'hover:border-purple-500/50',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40',
  },
  {
    id: 'certification',
    title: 'Accredited Certs',
    badge: 'Verified Proof',
    description: 'Standardized exams and capstone defenses validating competency for career advancement.',
    icon: Award,
    accentColor: 'text-violet-600 dark:text-violet-400',
    borderHover: 'hover:border-violet-500/50',
    bgLight: 'bg-violet-50 dark:bg-violet-950/40',
  },
  {
    id: 'webinar',
    title: 'Live Webinars',
    badge: 'Interactive Panels',
    description: 'Expert keynotes, live Q&A sessions, and recorded masterclasses on industry developments.',
    icon: Video,
    accentColor: 'text-rose-600 dark:text-rose-400',
    borderHover: 'hover:border-rose-500/50',
    bgLight: 'bg-rose-50 dark:bg-rose-950/40',
  },
];

export const EducationTypeExplorer: React.FC<EducationTypeExplorerProps> = ({
  selectedType,
  onSelectType,
  counts,
}) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Explore by Education Model
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Choose the learning format that matches your schedule, pace, and academic goals.
          </p>
        </div>

        {selectedType !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectType('all')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Show All Models
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {educationModels.map((model) => {
          const Icon = model.icon;
          const isSelected = selectedType === model.id;
          const count = counts?.[model.id];

          return (
            <div
              key={model.id}
              id={`edu-model-${model.id}`}
              onClick={() => onSelectType(isSelected ? 'all' : model.id)}
              className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md ' +
                    model.borderHover
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className={`p-2.5 rounded-xl ${model.bgLight} ${model.accentColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {model.badge}
                    </span>
                    {count !== undefined && (
                      <span className="text-xs font-bold text-slate-400">
                        ({count})
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{model.title}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" />
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {model.description}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {isSelected ? 'Active Filter' : 'Browse ' + model.title.split(' ')[0]}
                </span>
                <span className={`text-[11px] font-bold ${model.accentColor}`}>
                  {isSelected ? 'Click to Clear' : 'Explore →'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
