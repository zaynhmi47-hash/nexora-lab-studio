import React, { useState } from 'react';
import { X, Check, RotateCcw, Filter } from 'lucide-react';
import {
  ExploreFilterState,
  EducationType,
  EducationLevel,
  EducationFormat,
} from '../../../types';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ExploreFilterState;
  onApply: (newFilters: ExploreFilterState) => void;
  onReset: () => void;
  totalMatchesCount?: number;
}

const educationTypes: { value: EducationType; label: string }[] = [
  { value: 'course', label: 'Courses' },
  { value: 'bootcamp', label: 'Bootcamps' },
  { value: 'bimbel', label: 'Bimbel / Prep' },
  { value: 'academy', label: 'Academies' },
  { value: 'workshop', label: 'Workshops' },
  { value: 'tutor', label: '1-on-1 Tutors' },
  { value: 'mentor', label: 'Mentors' },
  { value: 'certification', label: 'Certifications' },
  { value: 'webinar', label: 'Webinars' },
  { value: 'learning_path', label: 'Learning Paths' },
];

const levels: EducationLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

const formats: EducationFormat[] = [
  'Video',
  'Live',
  'Self-paced',
  'Hybrid',
  '1-on-1',
  'Group',
];

const durations = [
  { value: 'under_1h', label: 'Under 1 hour' },
  { value: '1_to_5h', label: '1 to 5 hours' },
  { value: '5_to_20h', label: '5 to 20 hours' },
  { value: '20h_plus', label: '20+ hours (Intensive)' },
];

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
  totalMatchesCount,
}) => {
  const [draft, setDraft] = useState<ExploreFilterState>({ ...filters });

  if (!isOpen) return null;

  const toggleType = (type: EducationType) => {
    setDraft((prev) => {
      const exists = prev.types.includes(type);
      return {
        ...prev,
        types: exists ? prev.types.filter((t) => t !== type) : [...prev.types, type],
      };
    });
  };

  const toggleLevel = (lvl: EducationLevel) => {
    setDraft((prev) => {
      const exists = prev.levels.includes(lvl);
      return {
        ...prev,
        levels: exists ? prev.levels.filter((l) => l !== lvl) : [...prev.levels, lvl],
      };
    });
  };

  const toggleFormat = (fmt: EducationFormat) => {
    setDraft((prev) => {
      const exists = prev.formats.includes(fmt);
      return {
        ...prev,
        formats: exists ? prev.formats.filter((f) => f !== fmt) : [...prev.formats, fmt],
      };
    });
  };

  const toggleDuration = (dur: string) => {
    setDraft((prev) => {
      const exists = prev.durations.includes(dur);
      return {
        ...prev,
        durations: exists ? prev.durations.filter((d) => d !== dur) : [...prev.durations, dur],
      };
    });
  };

  const toggleLanguage = (lang: 'Indonesian' | 'English' | 'Other') => {
    setDraft((prev) => {
      const exists = prev.languages.includes(lang);
      return {
        ...prev,
        languages: exists ? prev.languages.filter((l) => l !== lang) : [...prev.languages, lang],
      };
    });
  };

  const handleClearAll = () => {
    const cleared: ExploreFilterState = {
      types: [],
      levels: [],
      formats: [],
      durations: [],
      priceType: 'all',
      minRating: 0,
      languages: [],
      category: 'all',
    };
    setDraft(cleared);
    onReset();
  };

  const activeCount =
    draft.types.length +
    draft.levels.length +
    draft.formats.length +
    draft.durations.length +
    (draft.priceType !== 'all' ? 1 : 0) +
    (draft.minRating > 0 ? 1 : 0) +
    draft.languages.length;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh] z-10 animate-in slide-in-from-bottom duration-200">
        {/* Mobile handle indicator */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Filter Marketplace
            </h3>
            {activeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-blue-600 text-white">
                {activeCount}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Body with Sections */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* 1. Education Model / Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Education Type
            </label>
            <div className="flex flex-wrap gap-2">
              {educationTypes.map((t) => {
                const isSelected = draft.types.includes(t.value);
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => toggleType(t.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Difficulty Level */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Experience Level
            </label>
            <div className="flex flex-wrap gap-2">
              {levels.map((lvl) => {
                const isSelected = draft.levels.includes(lvl);
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => toggleLevel(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Learning Format */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Delivery Format
            </label>
            <div className="flex flex-wrap gap-2">
              {formats.map((fmt) => {
                const isSelected = draft.formats.includes(fmt);
                return (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => toggleFormat(fmt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {fmt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Estimated Duration */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Duration
            </label>
            <div className="grid grid-cols-2 gap-2">
              {durations.map((dur) => {
                const isSelected = draft.durations.includes(dur.value);
                return (
                  <button
                    key={dur.value}
                    type="button"
                    onClick={() => toggleDuration(dur.value)}
                    className={`px-3 py-2 rounded-xl text-xs text-left font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-500 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{dur.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Pricing & Ratings Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Pricing
              </label>
              <div className="flex gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                {(['all', 'free', 'paid'] as const).map((pType) => (
                  <button
                    key={pType}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, priceType: pType }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      draft.priceType === pType
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {pType}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Minimum Rating
              </label>
              <div className="flex gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                {[
                  { value: 0, label: 'Any' },
                  { value: 4.0, label: '4.0+ ★' },
                  { value: 4.5, label: '4.5+ ★' },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, minRating: r.value }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      draft.minRating === r.value
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 6. Language */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Instruction Language
            </label>
            <div className="flex flex-wrap gap-2">
              {(['Indonesian', 'English', 'Other'] as const).map((lang) => {
                const isSelected = draft.languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer: Reset & Apply */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onApply(draft);
                onClose();
              }}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
            >
              Apply Filters {totalMatchesCount !== undefined ? `(${totalMatchesCount})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
