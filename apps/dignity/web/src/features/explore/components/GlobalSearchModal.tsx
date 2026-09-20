import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Sparkles,
  BookOpen,
  Flame,
  GraduationCap,
  Wrench,
  Compass,
  UserCheck,
  Award,
  Video,
  Filter,
  ArrowRight,
} from 'lucide-react';
import {
  Course,
  ProgramItem,
  LearningPath,
  TutorItem,
  MentorItem,
  CertificationItem,
  WebinarItem,
  ExploreFilterState,
  SortOption,
} from '../../../types';
import {
  searchMarketplace,
  mockRecentSearches,
  mockPopularSearches,
  mockSuggestedTopics,
} from '../../../data/mock/marketplaceIndex';
import { CourseCard } from '../../../components/course/CourseCard';
import { ProgramCard } from './ProgramCard';
import { TutorCard } from './TutorCard';
import { MentorCard } from './MentorCard';
import { CertificationCard } from './CertificationCard';
import { WebinarCard } from './WebinarCard';
import { DetailItem } from './ContentDetailModal';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  courses: Course[];
  programs: ProgramItem[];
  learningPaths: LearningPath[];
  tutors: TutorItem[];
  mentors: MentorItem[];
  certifications: CertificationItem[];
  webinars: WebinarItem[];
  onOpenFilter: () => void;
  filterState: ExploreFilterState;
  onSelectItem: (detail: DetailItem) => void;
  onSelectPath?: (path: LearningPath) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  courses,
  programs,
  learningPaths,
  tutors,
  mentors,
  certifications,
  webinars,
  onOpenFilter,
  filterState,
  onSelectItem,
  onSelectPath,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>(mockRecentSearches);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('recommended');

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  if (!isOpen) return null;

  const handleClearQuery = () => setQuery('');

  const handleSelectRecentOrPopular = (term: string) => {
    setQuery(term);
    // Add to recent searches if not present
    if (!recentSearches.includes(term)) {
      setRecentSearches([term, ...recentSearches.slice(0, 4)]);
    }
  };

  const handleRemoveRecent = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(recentSearches.filter((s) => s !== term));
  };

  const handleClearAllRecent = () => {
    setRecentSearches([]);
  };

  // Run unified search engine
  const results = searchMarketplace(
    query,
    filterState,
    sortOption,
    courses,
    programs,
    learningPaths,
    tutors,
    mentors,
    certifications,
    webinars
  );

  const activeFiltersCount =
    filterState.types.length +
    filterState.levels.length +
    filterState.formats.length +
    filterState.durations.length +
    (filterState.priceType !== 'all' ? 1 : 0) +
    (filterState.minRating > 0 ? 1 : 0) +
    filterState.languages.length;

  const hasSearchInput = query.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 md:p-6 overflow-hidden bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[94vh] z-10">
        {/* Search Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses, bootcamps, UTBK bimbel, tutors, mentors..."
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border-none transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={handleClearQuery}
                className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                aria-label="Clear search input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter button with counter */}
          <button
            type="button"
            onClick={onOpenFilter}
            className={`inline-flex items-center gap-1.5 px-3.5 py-3 rounded-2xl text-xs font-semibold border transition-all ${
              activeFiltersCount > 0
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-3 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Query Pills & Result Tabs */}
        {hasSearchInput && (
          <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs overflow-x-auto">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Found {results.totalMatches} matches for "{query}"
              </span>
            </div>

            {/* Quick Sorting */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-400">Sort by:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="recommended">Relevance</option>
                <option value="highest_rated">Highest Rated</option>
                <option value="popular">Popular</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 space-y-8 overflow-y-auto flex-1">
          {/* If no query is typed yet: show recent searches, popular keywords, suggested topics */}
          {!hasSearchInput && (
            <div className="space-y-8 max-w-3xl mx-auto py-2">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Recent Searches</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleClearAllRecent}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handleSelectRecentOrPopular(term)}
                        className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <span>{term}</span>
                        <X
                          className="w-3 h-3 text-slate-400 hover:text-rose-500 transition-colors"
                          onClick={(e) => handleRemoveRecent(term, e)}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                  <span>Popular Searches</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mockPopularSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleSelectRecentOrPopular(term)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-100 dark:border-blue-900/40 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggested Topics */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Suggested Topics & Skills</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mockSuggestedTopics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleSelectRecentOrPopular(topic)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      #{topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* If query typed but NO matches: Empty State with suggestions */}
          {hasSearchInput && results.totalMatches === 0 && (
            <div className="py-12 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No educational results for "{query}"
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Try checking for spelling variations, resetting your filters, or exploring popular learning topics below.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                {['React', 'UTBK', 'English', 'Python', 'Mathematics'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSelectRecentOrPopular(s)}
                    className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-xs font-semibold text-blue-600 dark:text-blue-400"
                  >
                    Try "{s}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* If query has matches: Show Grouped Results */}
          {hasSearchInput && results.totalMatches > 0 && (
            <div className="space-y-10">
              {/* Group 1: Self-Paced Courses */}
              {results.courses.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <span>Courses ({results.courses.length})</span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.courses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        variant="discovery"
                        onSelect={(c) => onSelectItem({ type: 'course', data: c })}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Group 2: Bootcamps & Academies */}
              {(results.bootcamps.length > 0 || results.academies.length > 0) && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Flame className="w-4 h-4 text-indigo-500" />
                      <span>Bootcamps & Academies ({results.bootcamps.length + results.academies.length})</span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...results.bootcamps, ...results.academies].map((program) => (
                      <ProgramCard
                        key={program.id}
                        program={program}
                        onSelect={(p) => onSelectItem({ type: 'program', data: p })}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Group 3: Bimbel & Exam Prep */}
              {results.bimbel.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-500" />
                      <span>Bimbel & Exam Prep ({results.bimbel.length})</span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.bimbel.map((program) => (
                      <ProgramCard
                        key={program.id}
                        program={program}
                        onSelect={(p) => onSelectItem({ type: 'program', data: p })}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Group 4: Hands-On Workshops */}
              {results.workshops.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-amber-500" />
                      <span>Workshops ({results.workshops.length})</span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.workshops.map((program) => (
                      <ProgramCard
                        key={program.id}
                        program={program}
                        onSelect={(p) => onSelectItem({ type: 'program', data: p })}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Group 5: Learning Paths */}
              {results.learningPaths.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Compass className="w-4 h-4 text-indigo-500" />
                      <span>Learning Paths ({results.learningPaths.length})</span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {results.learningPaths.map((path) => (
                      <div
                        key={path.id}
                        onClick={() => {
                          onClose();
                          onSelectPath?.(path);
                        }}
                        className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 cursor-pointer shadow-xs transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                            {path.categoryName} • {path.estimatedWeeks} Weeks
                          </div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                            {path.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {path.description}
                          </p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Target: {path.careerTarget}</span>
                          <span className="text-indigo-600 font-bold flex items-center gap-1">
                            <span>View Path</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Group 6: 1-on-1 Tutors */}
              {results.tutors.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-teal-500" />
                      <span>Verified Tutors ({results.tutors.length})</span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.tutors.map((tutor) => (
                      <TutorCard
                        key={tutor.id}
                        tutor={tutor}
                        onSelect={(t) => onSelectItem({ type: 'tutor', data: t })}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Group 7: Industry Mentors */}
              {results.mentors.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Compass className="w-4 h-4 text-purple-500" />
                      <span>Industry Mentors ({results.mentors.length})</span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.mentors.map((mentor) => (
                      <MentorCard
                        key={mentor.id}
                        mentor={mentor}
                        onSelect={(m) => onSelectItem({ type: 'mentor', data: m })}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Group 8: Certifications */}
              {results.certifications.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-500" />
                      <span>Certifications ({results.certifications.length})</span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.certifications.map((cert) => (
                      <CertificationCard
                        key={cert.id}
                        certification={cert}
                        onSelect={(c) => onSelectItem({ type: 'certification', data: c })}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Group 9: Webinars */}
              {results.webinars.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Video className="w-4 h-4 text-rose-500" />
                      <span>Webinars & Live Masterclasses ({results.webinars.length})</span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.webinars.map((webinar) => (
                      <WebinarCard
                        key={webinar.id}
                        webinar={webinar}
                        onSelect={(w) => onSelectItem({ type: 'webinar', data: w })}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
