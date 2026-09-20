import React, { useState } from 'react';
import {
  Sparkles,
  Award,
  CheckCircle2,
  X,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import {
  User,
  Course,
  LearningGoal,
  Achievement,
  UpcomingEvent,
  AppRoute,
  DailyMission,
  WeeklyLearningProgress,
  LearningPathStep,
  AIInsight,
} from '../../types';
import { mockHomeDashboardData } from '../../data/mock/homeDashboard';
import {
  HomeHeader,
  LearningGoalCard,
  ContinueLearningCard,
  DailyMissionCard,
  LearningStreakCard,
  WeeklyProgressCard,
  UpcomingActivities,
  RecommendedCourses,
  LearningPathPreview,
  SkillProgressSection,
  AchievementPreview,
  AIInsightCard,
  AITutorModal,
  SkillDetailModal,
  UpcomingEventModal,
  LearningPathModal,
  HomeSkeleton,
  SkillItem,
} from './components';
import { EmptyState, ErrorState } from '../../components/ui/FeedbackStates';
import { SecondaryButton } from '../../components/ui/Button';

export interface HomeScreenProps {
  user: User;
  courses: Course[];
  learningGoal: LearningGoal;
  achievements: Achievement[];
  upcomingEvents: UpcomingEvent[];
  onNavigate: (route: AppRoute, params?: any) => void;
  onSelectCourse: (course: Course) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  courses,
  learningGoal,
  achievements,
  upcomingEvents,
  onNavigate,
  onSelectCourse,
}) => {
  // Prototype State Simulator for testing UX states (Normal, Loading, Empty, Error)
  const [viewState, setViewState] = useState<'normal' | 'loading' | 'empty' | 'error'>('normal');

  // Interactive Daily Missions State
  const [missions, setMissions] = useState<DailyMission[]>(mockHomeDashboardData.dailyMissions);

  // Active toast feedback for gamification / XP
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isAITutorOpen, setIsAITutorOpen] = useState(false);
  const [isLearningPathOpen, setIsLearningPathOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent | null>(null);

  // In-progress courses & Recommended courses
  const activeCourses = courses.filter((c) => c.enrollmentStatus === 'in_progress');
  const primaryCourse =
    activeCourses.find((c) => c.id === 'course-107') ||
    activeCourses[0] ||
    courses[0];

  const recommendedCourseIds = ['course-108', 'course-109', 'course-110', 'course-102'];
  const recommendedCourses = recommendedCourseIds
    .map((id) => courses.find((c) => c.id === id))
    .filter((c): c is Course => Boolean(c));

  // Core skills: derive from user or provide full-stack benchmark radar
  const learnerSkills: SkillItem[] =
    user.skills && user.skills.length > 0
      ? user.skills
      : [
          { name: 'JavaScript & TypeScript', level: 88 },
          { name: 'React & Frontend Architecture', level: 76 },
          { name: 'Backend & API Engineering', level: 58 },
          { name: 'Database & SQL Indexing', level: 46 },
          { name: 'DevOps & Containers', level: 28 },
        ];

  // Toggle mission completion with XP toast
  const handleToggleMission = (missionId: string) => {
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id === missionId) {
          const nextCompleted = !m.completed;
          if (nextCompleted) {
            setToastMessage(`🎉 Mission completed! +${m.xp} XP added to your daily progress.`);
            setTimeout(() => setToastMessage(null), 3500);
          }
          return { ...m, completed: nextCompleted };
        }
        return m;
      })
    );
  };

  // Handler to view recommended course from AI Insight
  const handleViewAIRecommendation = () => {
    const rec = courses.find((c) => c.id === mockHomeDashboardData.aiInsight.recommendedCourseId) || courses[0];
    onSelectCourse(rec);
  };

  // ----------------------------------------------------
  // Render Loading State (Section 19)
  // ----------------------------------------------------
  if (viewState === 'loading') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex justify-end">
          <SecondaryButton size="sm" onClick={() => setViewState('normal')}>
            Reset to Normal Dashboard
          </SecondaryButton>
        </div>
        <HomeSkeleton />
      </div>
    );
  }

  // ----------------------------------------------------
  // Render Error State (Section 19)
  // ----------------------------------------------------
  if (viewState === 'error') {
    return (
      <div className="p-4 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-end">
          <SecondaryButton size="sm" onClick={() => setViewState('normal')}>
            Reset to Normal Dashboard
          </SecondaryButton>
        </div>
        <ErrorState
          title="Could not sync learner dashboard"
          message="An error occurred while fetching your active curriculum nodes and upcoming sessions. Please verify your connection."
          onRetry={() => setViewState('normal')}
        />
      </div>
    );
  }

  // ----------------------------------------------------
  // Render Empty State (Section 19)
  // ----------------------------------------------------
  if (viewState === 'empty') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex justify-end">
          <SecondaryButton size="sm" onClick={() => setViewState('normal')}>
            Reset to Normal Dashboard
          </SecondaryButton>
        </div>
        <HomeHeader
          user={user}
          goal={learningGoal}
          unreadNotificationsCount={0}
          onNavigate={(route) => onNavigate(route as AppRoute)}
        />
        <EmptyState
          title="No active courses enrolled yet"
          description="You haven't enrolled in any courses or learning paths. Discover our high-impact curriculum to begin your engineering journey."
          actionLabel="Explore Course Catalog"
          onAction={() => onNavigate('explore')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 max-w-7xl mx-auto">
      {/* State Simulator Bar (Section 19 validation) */}
      <div className="bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          Dashboard Simulator:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setViewState('normal')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              viewState === 'normal'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setViewState('loading')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              viewState === 'loading'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            Loading Skeleton
          </button>
          <button
            onClick={() => setViewState('empty')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              viewState === 'empty'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            Empty State
          </button>
          <button
            onClick={() => setViewState('error')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              viewState === 'error'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            Error State
          </button>
        </div>
      </div>

      {/* Floating XP / Mission Celebration Toast */}
      {toastMessage && (
        <div
          role="alert"
          className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50 p-3.5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl border border-slate-700 dark:border-slate-200 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 text-slate-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Header (Section 4) */}
      <HomeHeader
        user={user}
        goal={learningGoal}
        unreadNotificationsCount={2}
        onNavigate={(route) => onNavigate(route as AppRoute)}
        onOpenNotifications={() => onNavigate('community')}
      />

      {/* ========================================================================= */}
      {/* Mobile & Tablet Vertical Hierarchy (Sections 3 & 19: lg:hidden) */}
      {/* ========================================================================= */}
      <div className="lg:hidden space-y-6 sm:space-y-8">
        {/* 3. Primary Learning Goal Card (Section 5) */}
        <LearningGoalCard
          goalTitle={mockHomeDashboardData.goal.title}
          progressPercent={mockHomeDashboardData.goal.progressPercent}
          currentLevel={mockHomeDashboardData.goal.currentLevel}
          estimatedWeeksRemaining={mockHomeDashboardData.goal.estimatedWeeksRemaining}
          onViewPath={() => setIsLearningPathOpen(true)}
        />

        {/* 4. Continue Learning: The Most Prominent Action (Section 6) */}
        {primaryCourse && (
          <ContinueLearningCard
            course={primaryCourse}
            onResume={(course) => onSelectCourse(course)}
            onViewAll={() => onNavigate('learning')}
            activeCoursesCount={activeCourses.length}
          />
        )}

        {/* 5. Daily Learning Mission (Section 7) */}
        <DailyMissionCard
          missions={missions}
          onToggleMission={handleToggleMission}
        />

        {/* 6 & 7. Learning Streak & Weekly Progress (Side-by-side on tablet) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <LearningStreakCard goal={learningGoal} />
          <WeeklyProgressCard progress={mockHomeDashboardData.weeklyProgress} />
        </div>

        {/* 8. Upcoming Learning Activities (Section 10) */}
        <UpcomingActivities
          events={upcomingEvents}
          onSelectEvent={(event) => setSelectedEvent(event)}
        />

        {/* 9. Recommended Learning (Section 11) */}
        <RecommendedCourses
          courses={recommendedCourses}
          onSelectCourse={onSelectCourse}
          onExploreMore={() => onNavigate('explore')}
        />

        {/* 10. Curriculum Learning Path Preview (Section 12) */}
        <LearningPathPreview
          pathTitle={mockHomeDashboardData.goal.title}
          progressPercent={mockHomeDashboardData.goal.progressPercent}
          steps={mockHomeDashboardData.pathSteps}
          onViewFullPath={() => setIsLearningPathOpen(true)}
        />

        {/* 11. Skill Progress / Competency Radar (Section 13) */}
        <SkillProgressSection
          skills={learnerSkills}
          onSelectSkill={(skill) => setSelectedSkill(skill)}
        />

        {/* 12 & 13. Achievements Preview & AI Recommendation (Side-by-side on tablet) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <AchievementPreview
            achievements={achievements}
            onViewAll={() => onNavigate('profile')}
          />
          <AIInsightCard
            insight={mockHomeDashboardData.aiInsight}
            onViewRecommendation={handleViewAIRecommendation}
            onAskAI={() => setIsAITutorOpen(true)}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Desktop Dashboard Grid (Section 19: hidden lg:grid) */}
      {/* ========================================================================= */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-8">
        {/* Main Content (Left on Desktop: col-span-7 or 8) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          {/* Primary Learning Goal Card */}
          <LearningGoalCard
            goalTitle={mockHomeDashboardData.goal.title}
            progressPercent={mockHomeDashboardData.goal.progressPercent}
            currentLevel={mockHomeDashboardData.goal.currentLevel}
            estimatedWeeksRemaining={mockHomeDashboardData.goal.estimatedWeeksRemaining}
            onViewPath={() => setIsLearningPathOpen(true)}
          />

          {/* Continue Learning: The Most Prominent Action */}
          {primaryCourse && (
            <ContinueLearningCard
              course={primaryCourse}
              onResume={(course) => onSelectCourse(course)}
              onViewAll={() => onNavigate('learning')}
              activeCoursesCount={activeCourses.length}
            />
          )}

          {/* Curriculum Learning Path Preview */}
          <LearningPathPreview
            pathTitle={mockHomeDashboardData.goal.title}
            progressPercent={mockHomeDashboardData.goal.progressPercent}
            steps={mockHomeDashboardData.pathSteps}
            onViewFullPath={() => setIsLearningPathOpen(true)}
          />

          {/* Recommended Learning */}
          <RecommendedCourses
            courses={recommendedCourses}
            onSelectCourse={onSelectCourse}
            onExploreMore={() => onNavigate('explore')}
          />

          {/* Skill Progress / Competency Radar */}
          <SkillProgressSection
            skills={learnerSkills}
            onSelectSkill={(skill) => setSelectedSkill(skill)}
          />
        </div>

        {/* Dashboard Sidebar (Right on Desktop: col-span-5 or 4) */}
        <aside className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Daily Learning Mission */}
          <DailyMissionCard
            missions={missions}
            onToggleMission={handleToggleMission}
          />

          {/* Learning Streak */}
          <LearningStreakCard goal={learningGoal} />

          {/* Weekly Progress */}
          <WeeklyProgressCard progress={mockHomeDashboardData.weeklyProgress} />

          {/* AI Learning Recommendation / Insight Card */}
          <AIInsightCard
            insight={mockHomeDashboardData.aiInsight}
            onViewRecommendation={handleViewAIRecommendation}
            onAskAI={() => setIsAITutorOpen(true)}
          />

          {/* Upcoming Learning Activities */}
          <UpcomingActivities
            events={upcomingEvents}
            onSelectEvent={(event) => setSelectedEvent(event)}
          />

          {/* Achievements Preview */}
          <AchievementPreview
            achievements={achievements}
            onViewAll={() => onNavigate('profile')}
          />
        </aside>
      </div>

      {/* ========================================================================= */}
      {/* Interactive Modals */}
      {/* ========================================================================= */}
      {/* AI Tutor Dialog */}
      <AITutorModal
        isOpen={isAITutorOpen}
        onClose={() => setIsAITutorOpen(false)}
        onOpenFullWorkspace={() => onNavigate('ai-tutor')}
        defaultPrompt="How do database indexes and B-trees work in high-concurrency systems?"
      />

      {/* Skill Benchmark & Practice Modal */}
      <SkillDetailModal
        isOpen={!!selectedSkill}
        onClose={() => setSelectedSkill(null)}
        skill={selectedSkill}
        onStartPractice={(skillName) => {
          setToastMessage(`🚀 Practice assessment launched for ${skillName}!`);
          setTimeout(() => setToastMessage(null), 3000);
        }}
      />

      {/* Upcoming Event RSVP / Classroom Modal */}
      <UpcomingEventModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
        onConfirmAction={(event) => {
          setToastMessage(`✅ Your attendance for "${event.title}" is confirmed.`);
          setTimeout(() => setToastMessage(null), 3000);
        }}
      />

      {/* Full Learning Path Roadmap Modal */}
      <LearningPathModal
        isOpen={isLearningPathOpen}
        onClose={() => setIsLearningPathOpen(false)}
        pathTitle={mockHomeDashboardData.goal.title}
        progressPercent={mockHomeDashboardData.goal.progressPercent}
        steps={mockHomeDashboardData.pathSteps}
        onSelectStep={(step) => {
          if (step.courseId) {
            const c = courses.find((item) => item.id === step.courseId);
            if (c) onSelectCourse(c);
          }
        }}
      />
    </div>
  );
};
