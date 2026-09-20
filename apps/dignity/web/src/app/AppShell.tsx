import React, { useState, useMemo } from 'react';
import {
  UserRole,
  AppRoute,
  Course,
  Lesson,
} from '../types';
import {
  mockCurrentUser,
  mockCourses,
  mockCategories,
  mockLearningPaths,
  mockLearningGoal,
  mockAchievements,
  mockCertificates,
  mockUpcomingEvents,
  mockNotifications,
} from '../data/mock';
import { useAuth } from '../state/auth/AuthContext';
import { SplashScreen } from '../features/auth/SplashScreen';
import { WelcomeScreen } from '../features/auth/WelcomeScreen';
import { LoginScreen } from '../features/auth/LoginScreen';
import { RegisterScreen } from '../features/auth/RegisterScreen';
import { OnboardingFlow } from '../features/auth/onboarding/OnboardingFlow';
import { AuthDevBar } from '../components/dev/AuthDevBar';
import { Header } from '../components/navigation/Header';
import { SidebarNavigation } from '../components/navigation/SidebarNavigation';
import { BottomNavigation } from '../components/navigation/BottomNavigation';
import { HomeScreen } from '../features/home/HomeScreen';
import { ExploreScreen } from '../features/explore/ExploreScreen';
import { LearningScreen } from '../features/learning/LearningScreen';
import { PracticeScreen } from '../features/practice/PracticeScreen';
import { CommunityScreen } from '../features/community/CommunityScreen';
import { CertificatesScreen } from '../features/certificates/CertificatesScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { CourseDetailScreen } from '../features/course-detail/CourseDetailScreen';
import { DesignSystemShowcase } from '../features/design-system/DesignSystemShowcase';
import { EngineLesson } from '../types/learningEngine';
import { LessonScreen } from '../features/learning/engine/LessonScreen';
import { LessonPlayerScreen } from '../features/learning-player/LessonPlayerScreen';
import { ProjectWorkspaceScreen } from '../features/learning/project/ProjectWorkspaceScreen';
import { AssessmentRunnerScreen } from '../features/learning/assessment/AssessmentRunnerScreen';
import { AITutorScreen } from '../features/ai-tutor/AITutorScreen';
import { aiTutorService } from '../services/ai/aiTutorService';
import { ProjectsScreen } from '../features/projects/ProjectsScreen';
import { ProjectDetailScreen } from '../features/projects/ProjectDetailScreen';
import { ProjectWorkspaceScreen as CapstoneWorkspaceScreen } from '../features/projects/ProjectWorkspaceScreen';
import { ProjectReviewScreen } from '../features/projects/ProjectReviewScreen';
import { PortfolioScreen } from '../features/portfolio/PortfolioScreen';
import { PortfolioPreviewScreen } from '../features/portfolio/PortfolioPreviewScreen';
import { Project } from '../types/project';
import { PrimaryButton } from '../components/ui/Button';
import { LayoutDashboard, ShieldAlert, X, BookOpen, Users } from 'lucide-react';
import { LayoutProvider, useLayout } from '../context/LayoutContext';

export const AppShellContent: React.FC = () => {
  const { state, logout, setAuthStage } = useAuth();
  const {
    currentRoute,
    navigateTo,
    sidebarCollapsed,
    toggleSidebar,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    goToDashboard,
    goToCourses,
    goToCommunity,
  } = useLayout();

  const [currentRole, setCurrentRole] = useState<UserRole>('learner');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(mockCourses[0]);
  const [activeLesson, setActiveLesson] = useState<EngineLesson | null>(null);
  const [activeLessonModuleTitle, setActiveLessonModuleTitle] = useState<string>('Interactive Lesson');

  // Step 5 Course Experience State
  const [courseExperienceLessonId, setCourseExperienceLessonId] = useState<string | undefined>(undefined);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);
  const [activeProjectCourseTitle, setActiveProjectCourseTitle] = useState<string>('Course Project');
  const [activeAssessmentCourseTitle, setActiveAssessmentCourseTitle] = useState<string>('Course Assessment');
  const [communityInitialTab, setCommunityInitialTab] = useState<'home' | 'questions' | 'discussions' | 'groups' | 'challenges' | 'projects'>('home');

  // Active authenticated user or fallback
  const activeUser = state.user || mockCurrentUser;

  // Derive dynamic learning goal from user settings
  const dynamicLearningGoal = useMemo(() => {
    return {
      ...mockLearningGoal,
      targetMinutes: activeUser.dailyGoalMinutes || mockLearningGoal.targetMinutes,
      completedMinutes: activeUser.dailyGoalProgressMinutes || 0,
      streakDays: activeUser.learningStreakDays || 1,
    };
  }, [activeUser]);

  // Handle route changes
  const handleNavigate = (route: AppRoute, params?: any) => {
    if (params?.course) {
      setSelectedCourse(params.course);
    }
    if (params?.courseId) {
      const match = mockCourses.find((c) => c.id === params.courseId);
      if (match) setSelectedCourse(match);
    }
    if (params?.lessonId) {
      setCourseExperienceLessonId(params.lessonId);
    }
    if (params?.projectId) {
      setActiveProjectId(params.projectId);
      if (params.courseTitle) setActiveProjectCourseTitle(params.courseTitle);
    }
    if (params?.project) {
      setSelectedProject(params.project);
      setActiveProjectId(params.project.id);
    }
    if (params?.assessmentId) {
      setActiveAssessmentId(params.assessmentId);
      if (params.courseTitle) setActiveAssessmentCourseTitle(params.courseTitle);
    }
    if (params?.communityTab) {
      setCommunityInitialTab(params.communityTab);
    }
    navigateTo(route, params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    navigateTo('course-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartLesson = (lesson: EngineLesson, moduleTitle: string = 'Interactive Lesson') => {
    setActiveLesson(lesson);
    setActiveLessonModuleTitle(moduleTitle);
    navigateTo('lesson-view');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartCourseLesson = (lessonId: string, courseId: string) => {
    setCourseExperienceLessonId(lessonId);
    const match = mockCourses.find((c) => c.id === courseId);
    if (match) setSelectedCourse(match);
    navigateTo('lesson-view');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenProject = (projectId: string, courseTitle?: string) => {
    setActiveProjectId(projectId);
    if (courseTitle) setActiveProjectCourseTitle(courseTitle);
    navigateTo('project-view');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAssessment = (assessmentId: string, courseTitle?: string) => {
    setActiveAssessmentId(assessmentId);
    if (courseTitle) setActiveAssessmentCourseTitle(courseTitle);
    navigateTo('assessment-view');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route Guarding based on authStage
  if (state.authStage === 'splash') {
    return (
      <>
        <SplashScreen />
        <AuthDevBar />
      </>
    );
  }

  if (state.authStage === 'welcome') {
    return (
      <>
        <WelcomeScreen />
        <AuthDevBar />
      </>
    );
  }

  if (state.authStage === 'login') {
    return (
      <>
        <LoginScreen />
        <AuthDevBar />
      </>
    );
  }

  if (state.authStage === 'register') {
    return (
      <>
        <RegisterScreen />
        <AuthDevBar />
      </>
    );
  }

  if (state.authStage === 'onboarding') {
    return (
      <>
        <OnboardingFlow />
        <AuthDevBar />
      </>
    );
  }

  // Active Interactive Lesson Runner (Universal Gamified & Adaptive Engine)
  if (activeLesson) {
    return (
      <>
        <LessonScreen
          lesson={activeLesson}
          moduleTitle={activeLessonModuleTitle}
          onExit={() => setActiveLesson(null)}
        />
        <AuthDevBar />
      </>
    );
  }

  // Step 5 Course Experience Runners (Full Screen immersive mode)
  if (currentRoute === 'lesson-view') {
    return (
      <>
        <LessonPlayerScreen
          courseId={selectedCourse?.id || 'course-fullstack-ts'}
          initialLessonId={courseExperienceLessonId}
          onBackToCourse={() => {
            navigateTo('course-detail');
          }}
          onOpenProject={handleOpenProject}
          onOpenAssessment={handleOpenAssessment}
        />
        <AuthDevBar />
      </>
    );
  }

  if (currentRoute === 'project-view') {
    return (
      <>
        <ProjectWorkspaceScreen
          projectId={activeProjectId || 'proj-ecommerce-api'}
          courseTitle={activeProjectCourseTitle}
          onBack={() => navigateTo('course-detail')}
        />
        <AuthDevBar />
      </>
    );
  }

  if (currentRoute === 'project-workspace') {
    return (
      <>
        <CapstoneWorkspaceScreen
          projectId={activeProjectId || 'proj-task-mgmt'}
          onBack={() => {
            navigateTo(selectedProject ? 'project-detail' : 'projects');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSubmitProject={(p) => {
            setSelectedProject(p);
            setActiveProjectId(p.id);
            navigateTo('project-review');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenReview={(p) => {
            setSelectedProject(p);
            setActiveProjectId(p.id);
            navigateTo('project-review');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onAddToPortfolio={() => {
            navigateTo('portfolio');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToCourse={(cId) => {
            const match = mockCourses.find((c) => c.id === cId);
            if (match) handleSelectCourse(match);
            else handleNavigate('explore');
          }}
        />
        <AuthDevBar />
      </>
    );
  }

  if (currentRoute === 'project-review') {
    return (
      <>
        <ProjectReviewScreen
          projectId={activeProjectId || 'proj-task-mgmt'}
          onBack={() => {
            navigateTo('project-workspace');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToPortfolio={() => {
            navigateTo('portfolio');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onShareToCommunity={() => {
            setCommunityInitialTab('projects');
            handleNavigate('community');
          }}
        />
        <AuthDevBar />
      </>
    );
  }

  if (currentRoute === 'portfolio-preview') {
    return (
      <>
        <PortfolioPreviewScreen
          onBack={() => {
            navigateTo('portfolio');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
        <AuthDevBar />
      </>
    );
  }

  if (currentRoute === 'assessment-view') {
    return (
      <>
        <AssessmentRunnerScreen
          assessmentId={activeAssessmentId || 'exam-ts-arch-midterm'}
          courseTitle={activeAssessmentCourseTitle}
          onBack={() => navigateTo('course-detail')}
          onPracticeSkill={() => {
            navigateTo('practice');
          }}
          onOpenAITutor={(mistakeContext) => {
            if (mistakeContext) {
              aiTutorService.setContext({
                recentMistakes: [
                  {
                    questionId: mistakeContext.questionId,
                    questionText: mistakeContext.questionText,
                    userAnswer: mistakeContext.userAnswer,
                    correctAnswer: mistakeContext.correctAnswer,
                    explanation: mistakeContext.explanation,
                    skillName: mistakeContext.skillName,
                  },
                ],
              });
              aiTutorService.askTutor(
                `Can you explain why "${mistakeContext.userAnswer}" was incorrect for: "${mistakeContext.questionText}", and help me master the concept?`
              );
            }
            navigateTo('ai-tutor');
          }}
        />
        <AuthDevBar />
      </>
    );
  }

  // Full Authenticated Platform Experience
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header with Profile and Logout */}
      <Header
        user={activeUser}
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        onNavigate={handleNavigate}
        notifications={mockNotifications}
        onOpenDesignSystem={() => handleNavigate('design-system')}
        onLogout={logout}
        onOpenOnboarding={() => setAuthStage('onboarding')}
        onToggleSidebar={toggleSidebar}
      />

      {/* Core Feature Quick-Switch Strip (Dashboard, Courses, Community) */}
      <div className="bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200/60 dark:border-slate-800/60 px-4 py-1.5 hidden lg:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-2">
              Core Platform:
            </span>
            <button
              type="button"
              id="header-quick-nav-dashboard"
              onClick={goToDashboard}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 font-medium ${
                currentRoute === 'home'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              id="header-quick-nav-courses"
              onClick={goToCourses}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 font-medium ${
                currentRoute === 'learning' || currentRoute === 'explore'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Courses</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              id="header-quick-nav-community"
              onClick={goToCommunity}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 font-medium ${
                currentRoute === 'community'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Community</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 text-[11px]">
            <span>Active View: <strong className="text-slate-700 dark:text-slate-300 uppercase font-mono">{currentRoute}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto min-h-0">
        {/* Desktop / Tablet Persistent Sidebar */}
        <SidebarNavigation
          className="hidden md:flex"
          currentRole={currentRole}
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          streakDays={activeUser.learningStreakDays}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />

        {/* Mobile Drawer Sidebar Navigation */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-50 flex md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation drawer"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileSidebarOpen(false)}
            />

            {/* Drawer Content */}
            <div className="relative flex flex-col w-72 max-w-[80vw] bg-white dark:bg-slate-900 shadow-2xl z-10">
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    EP
                  </div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Navigation Menu
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Close navigation drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <SidebarNavigation
                  currentRole={currentRole}
                  currentRoute={currentRoute}
                  onNavigate={(route, params) => {
                    handleNavigate(route, params);
                    setMobileSidebarOpen(false);
                  }}
                  streakDays={activeUser.learningStreakDays}
                  collapsed={false}
                />
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Route Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          {/* If switched to Instructor, Org, or Admin in Step 1, display the architectural role preview */}
          {currentRole !== 'learner' ? (
            <div className="p-8 rounded-3xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 text-center max-w-xl mx-auto my-12">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize mb-2">
                {currentRole} Navigation Architecture Active
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                As specified in Step 1 requirements, the multi-role navigation menus (Dashboard, Courses, Students, Analytics) are established in the sidebar. Full role-specific views will be connected in future backend milestones.
              </p>
              <PrimaryButton size="md" onClick={() => setCurrentRole('learner')}>
                Return to Learner Experience
              </PrimaryButton>
            </div>
          ) : (
            <>
              {currentRoute === 'home' && (
                <HomeScreen
                  user={activeUser}
                  courses={mockCourses}
                  learningGoal={dynamicLearningGoal}
                  achievements={mockAchievements}
                  upcomingEvents={mockUpcomingEvents}
                  onNavigate={handleNavigate}
                  onSelectCourse={handleSelectCourse}
                />
              )}

              {currentRoute === 'explore' && (
                <ExploreScreen
                  courses={mockCourses}
                  categories={mockCategories}
                  learningPaths={mockLearningPaths}
                  onSelectCourse={handleSelectCourse}
                  onNavigate={handleNavigate}
                />
              )}

              {currentRoute === 'learning' && (
                <LearningScreen
                  courses={mockCourses}
                  learningPaths={mockLearningPaths}
                  onSelectCourse={handleSelectCourse}
                  onNavigate={handleNavigate}
                  onStartLesson={handleStartLesson}
                />
              )}

              {currentRoute === 'practice' && (
                <PracticeScreen onStartLesson={handleStartLesson} />
              )}

              {(currentRoute === 'ai-tutor' ||
                currentRoute === 'ai-tutor-session' ||
                currentRoute === 'ai-study-plan' ||
                currentRoute === 'ai-summary') && (
                <AITutorScreen
                  initialTab={
                    currentRoute === 'ai-study-plan'
                      ? 'study_plan'
                      : currentRoute === 'ai-summary'
                      ? 'insights'
                      : 'chat'
                  }
                  isExamActive={false}
                  examTitle={activeAssessmentCourseTitle}
                  onNavigatePractice={() => handleNavigate('practice')}
                  onNavigateCourse={(cTitle) => {
                    const match = mockCourses.find((c) =>
                      c.title.toLowerCase().includes(cTitle.toLowerCase())
                    );
                    if (match) {
                      handleSelectCourse(match);
                    } else {
                      handleNavigate('explore');
                    }
                  }}
                />
              )}

              {currentRoute === 'community' && (
                <CommunityScreen
                  initialTab={communityInitialTab}
                  onNavigatePractice={(skillName) => {
                    handleNavigate('practice');
                  }}
                  onNavigateCourse={(courseTitle) => {
                    const match = mockCourses.find((c) =>
                      c.title.toLowerCase().includes(courseTitle.toLowerCase())
                    );
                    if (match) {
                      handleSelectCourse(match);
                    } else {
                      handleNavigate('explore');
                    }
                  }}
                  onNavigateAITutor={(prompt) => {
                    if (prompt) {
                      aiTutorService.askTutor(prompt);
                    }
                    handleNavigate('ai-tutor');
                  }}
                />
              )}

              {currentRoute === 'certificates' && (
                <CertificatesScreen certificates={mockCertificates} />
              )}

              {currentRoute === 'projects' && (
                <ProjectsScreen
                  onSelectProject={(project) => {
                    setSelectedProject(project);
                    setActiveProjectId(project.id);
                    handleNavigate('project-detail', { project });
                  }}
                  onOpenWorkspace={(project) => {
                    setSelectedProject(project);
                    setActiveProjectId(project.id);
                    handleNavigate('project-workspace', { project });
                  }}
                />
              )}

              {currentRoute === 'project-detail' && selectedProject && (
                <ProjectDetailScreen
                  project={selectedProject}
                  onBack={() => handleNavigate('projects')}
                  onOpenWorkspace={(project) => {
                    setSelectedProject(project);
                    setActiveProjectId(project.id);
                    handleNavigate('project-workspace', { project });
                  }}
                />
              )}

              {(currentRoute === 'portfolio' || currentRoute === 'portfolio-edit') && (
                <PortfolioScreen
                  onNavigateToProjects={() => handleNavigate('projects')}
                  onNavigateToPreview={() => handleNavigate('portfolio-preview')}
                  onSkillClick={() => handleNavigate('practice')}
                />
              )}

              {currentRoute === 'profile' && (
                <ProfileScreen
                  user={activeUser}
                  certificates={mockCertificates}
                  achievements={mockAchievements}
                  completedCourses={mockCourses.filter((c) => c.enrollmentStatus === 'completed')}
                  onSelectCourse={handleSelectCourse}
                  onNavigate={handleNavigate}
                />
              )}

              {currentRoute === 'course-detail' && selectedCourse && (
                <CourseDetailScreen
                  course={selectedCourse}
                  onBack={() => handleNavigate('explore')}
                  onNavigate={handleNavigate}
                  onStartLesson={handleStartCourseLesson}
                  onOpenProject={handleOpenProject}
                  onOpenAssessment={handleOpenAssessment}
                  onPracticeSkill={() => {
                    handleNavigate('practice');
                  }}
                />
              )}

              {currentRoute === 'design-system' && <DesignSystemShowcase />}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation (Only for Learner role on mobile screens) */}
      {currentRole === 'learner' && (
        <BottomNavigation currentRoute={currentRoute} onNavigate={handleNavigate} />
      )}

      {/* Floating Developer Auth & State HUD */}
      <AuthDevBar />
    </div>
  );
};

export const AppShell: React.FC = () => {
  return (
    <LayoutProvider initialRoute="home">
      <AppShellContent />
    </LayoutProvider>
  );
};
