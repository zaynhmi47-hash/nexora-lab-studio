import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  RotateCcw,
  SlidersHorizontal,
  X,
  AlertCircle,
  BookOpen,
  Flame,
  Compass,
  GraduationCap,
  Wrench,
  UserCheck,
  Award,
  Video,
} from 'lucide-react';
import {
  Course,
  Category,
  LearningPath,
  AppRoute,
  ProgramItem,
  TutorItem,
  MentorItem,
  CertificationItem,
  WebinarItem,
  LearningGoalItem,
  ExploreFilterState,
  EducationType,
  SortOption,
} from '../../types';
import {
  mockPrograms,
  mockTutors,
  mockMentors,
  mockCertifications,
  mockWebinars,
  mockLearningGoals,
  searchMarketplace,
  getPersonalizedRecommendations,
} from '../../data/mock';
import { EducationTypeExplorer } from './components/EducationTypeExplorer';
import { ProgramCard } from './components/ProgramCard';
import { TutorCard } from './components/TutorCard';
import { MentorCard } from './components/MentorCard';
import { CertificationCard } from './components/CertificationCard';
import { WebinarCard } from './components/WebinarCard';
import { FilterModal } from './components/FilterModal';
import { LearningGoalsSection } from './components/LearningGoalsSection';
import { LearningGoalDetailModal } from './components/LearningGoalDetailModal';
import { FeaturedProgramsSection } from './components/FeaturedProgramsSection';
import { PersonalizedRecommendationsSection } from './components/PersonalizedRecommendationsSection';
import { PopularLearningSection } from './components/PopularLearningSection';
import { TutorsMentorsSection } from './components/TutorsMentorsSection';
import { CertificationsWebinarsSection } from './components/CertificationsWebinarsSection';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ContentDetailModal, DetailItem } from './components/ContentDetailModal';
import { ExploreSkeletons } from './components/ExploreSkeletons';
import { StateSimulatorBar, ExploreSimulatorState } from './components/StateSimulatorBar';
import { CourseCard } from '../../components/course/CourseCard';

export interface ExploreScreenProps {
  courses: Course[];
  categories: Category[];
  learningPaths: LearningPath[];
  programs?: ProgramItem[];
  tutors?: TutorItem[];
  mentors?: MentorItem[];
  certifications?: CertificationItem[];
  webinars?: WebinarItem[];
  learningGoals?: LearningGoalItem[];
  onSelectCourse: (course: Course) => void;
  onNavigate: (route: AppRoute, params?: any) => void;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  courses,
  categories,
  learningPaths,
  programs = mockPrograms,
  tutors = mockTutors,
  mentors = mockMentors,
  certifications = mockCertifications,
  webinars = mockWebinars,
  learningGoals = mockLearningGoals,
  onSelectCourse,
  onNavigate,
}) => {
  // Prototype simulator state ('normal', 'loading', 'empty', 'error')
  const [simulatorState, setSimulatorState] = useState<ExploreSimulatorState>('normal');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<EducationType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('recommended');

  const [filterState, setFilterState] = useState<ExploreFilterState>({
    types: [],
    levels: [],
    formats: [],
    durations: [],
    priceType: 'all',
    minRating: 0,
    languages: [],
    category: 'all',
  });

  // Selected Detail Modal State
  const [selectedDetailItem, setSelectedDetailItem] = useState<DetailItem | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<LearningGoalItem | null>(null);

  // Synchronize category selection with filter state
  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setFilterState((prev) => ({ ...prev, category: catId }));
  };

  // Synchronize education model selection
  const handleTypeSelect = (type: EducationType | 'all') => {
    setSelectedType(type);
    if (type === 'all') {
      setFilterState((prev) => ({ ...prev, types: [] }));
    } else {
      setFilterState((prev) => ({ ...prev, types: [type] }));
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCategory('all');
    setSortOption('recommended');
    setFilterState({
      types: [],
      levels: [],
      formats: [],
      durations: [],
      priceType: 'all',
      minRating: 0,
      languages: [],
      category: 'all',
    });
  };

  // Total active filters count (excluding category if all)
  const activeFiltersCount =
    filterState.types.length +
    filterState.levels.length +
    filterState.formats.length +
    filterState.durations.length +
    (filterState.priceType !== 'all' ? 1 : 0) +
    (filterState.minRating > 0 ? 1 : 0) +
    filterState.languages.length +
    (filterState.category !== 'all' ? 1 : 0);

  const hasActiveQueryOrFilters =
    searchQuery.trim().length > 0 ||
    selectedType !== 'all' ||
    activeFiltersCount > 0 ||
    selectedCategory !== 'all';

  // Search results calculation
  const searchResults = useMemo(() => {
    if (simulatorState === 'empty') {
      return {
        totalMatches: 0,
        courses: [],
        bootcamps: [],
        academies: [],
        bimbel: [],
        workshops: [],
        learningPaths: [],
        tutors: [],
        mentors: [],
        certifications: [],
        webinars: [],
      };
    }

    return searchMarketplace(
      searchQuery,
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
  }, [
    simulatorState,
    searchQuery,
    filterState,
    sortOption,
    courses,
    programs,
    learningPaths,
    tutors,
    mentors,
    certifications,
    webinars,
  ]);

  // Personalized recommendations (derived from mock learner profile: Full-Stack Dev)
  const personalizedRecs = useMemo(() => {
    return getPersonalizedRecommendations(
      'Full-Stack Developer',
      [
        { name: 'JavaScript', level: 88 },
        { name: 'React', level: 76 },
        { name: 'Backend', level: 58 },
        { name: 'Database', level: 46 },
        { name: 'DevOps', level: 28 },
      ],
      courses
    );
  }, [courses]);

  // Goal modal dependencies
  const goalCourses = useMemo(() => {
    if (!selectedGoal) return [];
    return courses.filter((c) => selectedGoal.recommendedCourseIds.includes(c.id));
  }, [selectedGoal, courses]);

  const goalPath = useMemo(() => {
    if (!selectedGoal) return undefined;
    return learningPaths.find((p) => p.id === selectedGoal.recommendedPathId);
  }, [selectedGoal, learningPaths]);

  const goalMentors = useMemo(() => {
    if (!selectedGoal) return [];
    return mentors.filter((m) =>
      selectedGoal.skillsGained.some((sk) => m.skills.includes(sk))
    );
  }, [selectedGoal, mentors]);

  return (
    <div className="space-y-10 pb-16">
      {/* Prototype State Simulator Control Bar */}
      <StateSimulatorBar
        currentState={simulatorState}
        onStateChange={setSimulatorState}
      />

      {/* Simulator Error Boundary State */}
      {simulatorState === 'error' ? (
        <div className="p-8 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-center max-w-lg mx-auto space-y-4 my-12">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Marketplace Connection Timed Out
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            The discovery index could not retrieve live cohorts. You can test recovery by returning to Default / Normal state.
          </p>
          <button
            type="button"
            onClick={() => setSimulatorState('normal')}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
          >
            Retry Marketplace Index
          </button>
        </div>
      ) : simulatorState === 'loading' ? (
        /* Loading Skeleton State */
        <ExploreSkeletons />
      ) : (
        <>
          {/* Header & Main Search Section */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Explore Learning & Education Marketplace
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Discover courses, intensive bootcamps, UTBK bimbel, 1-on-1 tutors, industry mentors, and certified roadmaps.
              </p>
            </div>

            {/* Universal Search Bar with Filter Trigger */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-3xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by topic, skill, instructor, bootcamp, or exam (e.g. React, UTBK, IELTS)..."
                  className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(true)}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-xs font-semibold border transition-all ${
                    activeFiltersCount > 0
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsSearchModalOpen(true)}
                  className="px-4 py-3.5 rounded-2xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-95 shadow-xs transition-all whitespace-nowrap"
                >
                  Deep Search
                </button>
              </div>
            </div>

            {/* Active Filter Chips Pill Bar (If any filters or search query are applied) */}
            {hasActiveQueryOrFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-slate-400 font-medium">Active filters:</span>

                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
                    Query: "{searchQuery}"
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-blue-900"
                      onClick={() => setSearchQuery('')}
                    />
                  </span>
                )}

                {selectedType !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60 capitalize">
                    Type: {selectedType.replace('_', ' ')}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-indigo-900"
                      onClick={() => handleTypeSelect('all')}
                    />
                  </span>
                )}

                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60">
                    Category: {categories.find((c) => c.id === selectedCategory)?.name || selectedCategory}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-purple-900"
                      onClick={() => handleCategorySelect('all')}
                    />
                  </span>
                )}

                {filterState.priceType !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 capitalize">
                    Price: {filterState.priceType}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-emerald-900"
                      onClick={() => setFilterState((prev) => ({ ...prev, priceType: 'all' }))}
                    />
                  </span>
                )}

                {filterState.minRating > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                    Rating: {filterState.minRating}+ ★
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-amber-900"
                      onClick={() => setFilterState((prev) => ({ ...prev, minRating: 0 }))}
                    />
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-semibold ml-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              </div>
            )}
          </div>

          {/* Education Model Navigation Explorer (Section 3 & 4) */}
          <EducationTypeExplorer
            selectedType={selectedType}
            onSelectType={handleTypeSelect}
          />

          {/* Category Chips Scroll Bar (Section 13) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Browse Academic & Professional Domains
              </span>
              <span className="text-xs text-slate-400">{categories.length} Categories</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => handleCategorySelect('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {cat.name} ({cat.courseCount})
                </button>
              ))}
            </div>
          </div>

          {/* FILTERED / SEARCHED RESULTS VIEW (When query or filter applied) */}
          {hasActiveQueryOrFilters ? (
            <section className="space-y-8">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    Marketplace Results ({searchResults.totalMatches})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Showing matched items across courses, bootcamps, bimbel, tutors, and certifications.
                  </p>
                </div>

                {/* Sort Option */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 hidden sm:inline">Sort:</span>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="recommended">Relevance</option>
                    <option value="highest_rated">Highest Rated</option>
                    <option value="popular">Most Popular</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {searchResults.totalMatches === 0 ? (
                <div className="p-12 text-center max-w-md mx-auto space-y-4 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Search className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    No learning experiences match your filter criteria
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Try broadening your search keywords, switching education models, or clearing rating and price filters.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-10">
                  {/* Courses */}
                  {searchResults.courses.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span>Courses ({searchResults.courses.length})</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchResults.courses.map((course) => (
                          <CourseCard
                            key={course.id}
                            course={course}
                            variant="discovery"
                            onSelect={(c) => setSelectedDetailItem({ type: 'course', data: c })}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bootcamps & Academies */}
                  {(searchResults.bootcamps.length > 0 || searchResults.academies.length > 0) && (
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-indigo-500" />
                        <span>Bootcamps & Academies ({searchResults.bootcamps.length + searchResults.academies.length})</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...searchResults.bootcamps, ...searchResults.academies].map((program) => (
                          <ProgramCard
                            key={program.id}
                            program={program}
                            onSelect={(p) => setSelectedDetailItem({ type: 'program', data: p })}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bimbel & Exam Prep */}
                  {searchResults.bimbel.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-emerald-500" />
                        <span>Bimbel & Exam Prep ({searchResults.bimbel.length})</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchResults.bimbel.map((program) => (
                          <ProgramCard
                            key={program.id}
                            program={program}
                            onSelect={(p) => setSelectedDetailItem({ type: 'program', data: p })}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Workshops */}
                  {searchResults.workshops.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-amber-500" />
                        <span>Workshops ({searchResults.workshops.length})</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchResults.workshops.map((program) => (
                          <ProgramCard
                            key={program.id}
                            program={program}
                            onSelect={(p) => setSelectedDetailItem({ type: 'program', data: p })}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tutors */}
                  {searchResults.tutors.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-teal-500" />
                        <span>1-on-1 Tutors ({searchResults.tutors.length})</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {searchResults.tutors.map((tutor) => (
                          <TutorCard
                            key={tutor.id}
                            tutor={tutor}
                            onSelect={(t) => setSelectedDetailItem({ type: 'tutor', data: t })}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mentors */}
                  {searchResults.mentors.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-purple-500" />
                        <span>Career Mentors ({searchResults.mentors.length})</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {searchResults.mentors.map((mentor) => (
                          <MentorCard
                            key={mentor.id}
                            mentor={mentor}
                            onSelect={(m) => setSelectedDetailItem({ type: 'mentor', data: m })}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {searchResults.certifications.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-purple-500" />
                        <span>Certifications ({searchResults.certifications.length})</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {searchResults.certifications.map((cert) => (
                          <CertificationCard
                            key={cert.id}
                            certification={cert}
                            onSelect={(c) => setSelectedDetailItem({ type: 'certification', data: c })}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Webinars */}
                  {searchResults.webinars.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-rose-500" />
                        <span>Webinars ({searchResults.webinars.length})</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {searchResults.webinars.map((webinar) => (
                          <WebinarCard
                            key={webinar.id}
                            webinar={webinar}
                            onSelect={(w) => setSelectedDetailItem({ type: 'webinar', data: w })}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          ) : (
            /* DEFAULT EXPLORE SECTIONS (Progressive Discovery) */
            <div className="space-y-12">
              {/* Section 9: What do you want to achieve? (Ambitions) */}
              <LearningGoalsSection
                goals={learningGoals}
                onSelectGoal={(goal) => setSelectedGoal(goal)}
              />

              {/* Section 10: Featured Intensive Programs */}
              <FeaturedProgramsSection
                programs={programs}
                onSelectProgram={(program) => setSelectedDetailItem({ type: 'program', data: program })}
                onViewAll={() => handleTypeSelect('bootcamp')}
              />

              {/* Section 11 & 24: Personalized Recommendations */}
              <PersonalizedRecommendationsSection
                recommendations={personalizedRecs}
                onSelectCourse={(course) => setSelectedDetailItem({ type: 'course', data: course })}
              />

              {/* Section 12: Popular This Week */}
              <PopularLearningSection
                courses={courses}
                programs={programs}
                onSelectItem={(item) => setSelectedDetailItem(item)}
              />

              {/* Section 17 & 18: Personal Guidance & Mentorship */}
              <TutorsMentorsSection
                tutors={tutors}
                mentors={mentors}
                onSelectTutor={(tutor) => setSelectedDetailItem({ type: 'tutor', data: tutor })}
                onSelectMentor={(mentor) => setSelectedDetailItem({ type: 'mentor', data: mentor })}
              />

              {/* Section 19 & 20: Verified Certifications & Live Webinars */}
              <CertificationsWebinarsSection
                certifications={certifications}
                webinars={webinars}
                onSelectCertification={(cert) => setSelectedDetailItem({ type: 'certification', data: cert })}
                onSelectWebinar={(webinar) => setSelectedDetailItem({ type: 'webinar', data: webinar })}
              />
            </div>
          )}
        </>
      )}

      {/* FILTER BOTTOM SHEET / MODAL */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filterState}
        onApply={(newFilters) => setFilterState(newFilters)}
        onReset={handleResetFilters}
        totalMatchesCount={searchResults.totalMatches}
      />

      {/* GLOBAL SEARCH MODAL */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        initialQuery={searchQuery}
        courses={courses}
        programs={programs}
        learningPaths={learningPaths}
        tutors={tutors}
        mentors={mentors}
        certifications={certifications}
        webinars={webinars}
        onOpenFilter={() => {
          setIsSearchModalOpen(false);
          setIsFilterModalOpen(true);
        }}
        filterState={filterState}
        onSelectItem={(item) => {
          setIsSearchModalOpen(false);
          setSelectedDetailItem(item);
        }}
        onSelectPath={(path) => {
          setIsSearchModalOpen(false);
          onSelectCourse(path.courses[0]);
        }}
      />

      {/* LEARNING GOAL DETAIL MODAL */}
      <LearningGoalDetailModal
        goal={selectedGoal}
        isOpen={!!selectedGoal}
        onClose={() => setSelectedGoal(null)}
        recommendedCourses={goalCourses}
        recommendedPath={goalPath}
        recommendedMentors={goalMentors}
        onSelectCourse={(course) => setSelectedDetailItem({ type: 'course', data: course })}
        onSelectMentor={(mentor) => setSelectedDetailItem({ type: 'mentor', data: mentor })}
        onSelectPath={(path) => onSelectCourse(path.courses[0])}
      />

      {/* CONCEPTUAL DETAIL MODAL (Course, Program, Tutor, Mentor, Cert, Webinar) */}
      <ContentDetailModal
        item={selectedDetailItem}
        isOpen={!!selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        onEnrollOrBook={(item) => {
          if (item.type === 'course') {
            onSelectCourse(item.data);
          }
        }}
      />
    </div>
  );
};
