/**
 * Dignity Web shared domain types.
 *
 * This file contains the cross-feature contracts used by:
 * - authentication
 * - navigation
 * - marketplace / explore
 * - courses
 * - learning paths
 * - dashboard
 * - community
 * - certificates
 * - portfolio
 * - projects
 *
 * Feature-specific contracts should live in their dedicated files:
 * - ai.ts
 * - learningEngine.ts
 * - courseExperience.ts
 * - project.ts
 * - community.ts
 * - portfolio.ts
 */

/* -------------------------------------------------------------------------- */
/* Identity & Authentication                                                  */
/* -------------------------------------------------------------------------- */

export type UserRole =
  | 'learner'
  | 'instructor'
  | 'organization'
  | 'administrator';

export type AuthStage =
  | 'splash'
  | 'welcome'
  | 'login'
  | 'register'
  | 'onboarding'
  | 'authenticated';

export interface UserSkill {
  name: string;
  level: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  headline?: string;
  role: UserRole;
  joinedDate: string;
  learningLevel: EducationLevel;
  learningStreakDays: number;
  completedCoursesCount: number;
  certificatesCount: number;
  totalStudyHours: number;
  dailyGoalMinutes: number;
  dailyGoalProgressMinutes: number;
  skills: UserSkill[];
  bio?: string;
}

export interface OnboardingData {
  primaryGoal: string;
  targetCareer?: string;
  topics: string[];
  experienceLevel: EducationLevel;
  preferredFormats: string[];
  dailyGoalMinutes: number;
  reminderTime: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  termsAccepted: boolean;
}

/* -------------------------------------------------------------------------- */
/* Navigation                                                                  */
/* -------------------------------------------------------------------------- */

export type AppRoute =
  | 'home'
  | 'learning'
  | 'explore'
  | 'community'
  | 'certificates'
  | 'profile'
  | 'practice'
  | 'projects'
  | 'portfolio'
  | 'portfolio-edit'
  | 'portfolio-preview'
  | 'design-system'
  | 'course-detail'
  | 'lesson-view'
  | 'project-view'
  | 'project-workspace'
  | 'assessment-view'
  | 'lesson'
  | 'project-detail'
  | 'project-review'
  | 'ai-tutor'
  | 'ai-tutor-session'
  | 'ai-study-plan'
  | 'ai-summary'
  | 'splash'
  | 'welcome'
  | 'login'
  | 'register'
  | 'onboarding';

/* -------------------------------------------------------------------------- */
/* Education Marketplace                                                       */
/* -------------------------------------------------------------------------- */

export type EducationLevel =
  | 'Beginner'
  | 'Intermediate'
  | 'Advanced'
  | 'All Levels';

export type EducationFormat =
  | 'Video'
  | 'Live'
  | 'Self-paced'
  | 'Hybrid'
  | '1-on-1'
  | 'Group';

export type EducationType =
  | 'course'
  | 'bootcamp'
  | 'bimbel'
  | 'academy'
  | 'workshop'
  | 'tutor'
  | 'mentor'
  | 'certification'
  | 'webinar'
  | 'learning_path';

export type PriceType = 'all' | 'free' | 'paid';

export type DurationFilter =
  | 'under_1h'
  | '1_to_5h'
  | '5_to_20h'
  | '20h_plus';

export type EducationLanguage =
  | 'Indonesian'
  | 'English'
  | 'Other';

export interface ExploreFilterState {
  types: EducationType[];
  levels: EducationLevel[];
  formats: EducationFormat[];
  durations: DurationFilter[];
  priceType: PriceType;
  minRating: number;
  languages: EducationLanguage[];
  category: string;
}

export type SortOption =
  | 'recommended'
  | 'popular'
  | 'highest_rated'
  | 'price_asc'
  | 'price_desc'
  | 'newest';

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  courseCount: number;
  colorClass: string;
  description: string;
}

/* -------------------------------------------------------------------------- */
/* Courses                                                                     */
/* -------------------------------------------------------------------------- */

export type CourseEnrollmentStatus =
  | 'in_progress'
  | 'completed'
  | 'not_enrolled';

export type CoursePriceType = 'free' | 'paid';

export type LessonType =
  | 'video'
  | 'reading'
  | 'quiz'
  | 'interactive'
  | 'assignment';

export interface CourseLesson {
  id: string;
  title: string;
  durationMinutes: number;
  type: LessonType;
  completed: boolean;
  order: number;
}

export interface CourseModule {
  id: string;
  title: string;
  order: number;
  durationHours: number;
  lessons: CourseLesson[];
}

export interface Instructor {
  id: string;
  name: string;
  avatarUrl?: string;
  title: string;
  organization?: string;
  company?: string;
  bio?: string;
  rating?: number;
  reviewCount?: number;
  studentsCount?: number;
  coursesCount?: number;
  expertise?: string[];
  verified?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  durationMinutes: number;
  type: string;
  completed?: boolean;
  order: number;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  categoryId: string;
  categoryName: string;
  instructor: Instructor;
  difficulty: EducationLevel;
  durationHours: number;
  lessonCount: number;
  rating: number;
  ratingCount: number;
  studentsCount: number;
  priceType: CoursePriceType;
  priceAmount?: number;
  originalPrice?: number;
  isFree?: boolean;
  currency?: string;
  enrollmentStatus: CourseEnrollmentStatus;
  progressPercent?: number;
  lastStudiedAt?: string;
  currentLessonId?: string;
  currentLessonTitle?: string;
  tags: string[];
  isFeatured: boolean;
  isPopular: boolean;
  isNew: boolean;
  modules?: CourseModule[];
  provider?: string;
  format?: EducationFormat;
  language?: EducationLanguage;
}

/* -------------------------------------------------------------------------- */
/* Learning Paths                                                              */
/* -------------------------------------------------------------------------- */

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  categoryName: string;
  estimatedWeeks: number;
  courseCount: number;
  studentsCount: number;
  difficulty: EducationLevel;
  skillsAcquired: string[];
  careerTarget: string;
  courses: Course[];
  progressPercent: number;
}

/* -------------------------------------------------------------------------- */
/* Programs                                                                    */
/* -------------------------------------------------------------------------- */

export type ProgramType =
  | 'bootcamp'
  | 'bimbel'
  | 'academy'
  | 'workshop';

export interface ProgramCurriculumItem {
  moduleNumber: number;
  title: string;
  duration: string;
  topics: string[];
}

export interface ProgramItem {
  id: string;
  title: string;
  type: ProgramType;
  provider: string;
  description: string;
  thumbnail: string;
  level: EducationLevel;
  duration: string;
  durationHours: number;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  isFree: boolean;
  format: EducationFormat;
  startDate: string;
  availability: string;
  seatsLeft?: number;
  skills: string[];
  instructorName: string;
  instructorRole: string;
  instructorAvatar: string;
  language: EducationLanguage;
  isFeatured: boolean;
  isPopular: boolean;
  isNew: boolean;
  whatYouLearn: string[];
  curriculum?: ProgramCurriculumItem[];
}

/* -------------------------------------------------------------------------- */
/* Tutors & Mentors                                                            */
/* -------------------------------------------------------------------------- */

export interface TutorItem {
  id: string;
  name: string;
  avatar: string;
  expertise: string;
  rating: number;
  reviewCount: number;
  sessionsCount: number;
  language: EducationLanguage[];
  hourlyPrice: number;
  originalHourlyPrice?: number;
  availability: string;
  bio: string;
  education: string;
  verified: boolean;
  subjects: string[];
  studentCount: number;
}

export interface MentorItem {
  id: string;
  name: string;
  avatar: string;
  title: string;
  company: string;
  skills: string[];
  experienceYears: number;
  rating: number;
  reviewCount: number;
  sessionPrice: number;
  availability: string;
  bio: string;
  mentorshipTopics: string[];
  sessionsCompleted: number;
}

/* -------------------------------------------------------------------------- */
/* Certifications                                                              */
/* -------------------------------------------------------------------------- */

export interface CertificationItem {
  id: string;
  name: string;
  skillArea: string;
  difficulty: EducationLevel;
  estimatedPrepWeeks: number;
  assessmentType: string;
  issuer: string;
  issuerBadge: string;
  description: string;
  validity: string;
  prerequisites: string[];
  skillsValidated: string[];
  examDuration: string;
  passingScore: string;
  learnersCount: number;
  price: number;
  isFree: boolean;
}

/* -------------------------------------------------------------------------- */
/* Webinars                                                                    */
/* -------------------------------------------------------------------------- */

export interface WebinarItem {
  id: string;
  title: string;
  speaker: string;
  speakerRole: string;
  speakerCompany: string;
  speakerAvatar: string;
  date: string;
  time: string;
  duration: string;
  durationHours: number;
  isLive: boolean;
  isFree: boolean;
  price: number;
  attendeesCount: number;
  maxAttendees?: number;
  topic: string;
  description: string;
  level: EducationLevel;
  language: EducationLanguage;
  keyTakeaways: string[];
}

/* -------------------------------------------------------------------------- */
/* Notifications & Events                                                      */
/* -------------------------------------------------------------------------- */

export type NotificationType =
  | 'course'
  | 'community'
  | 'system'
  | 'achievement'
  | 'assignment'
  | 'event'
  | 'deadline';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: NotificationType;
}

export type UpcomingEventType =
  | 'live_class'
  | 'assignment_due'
  | 'quiz_due'
  | 'mentorship_session';

export interface UpcomingEvent {
  id: string;
  title: string;
  type: UpcomingEventType;
  courseTitle: string;
  scheduledTime: string;
  durationMinutes: number;
  instructorName?: string;
  linkText: string;
}

/* -------------------------------------------------------------------------- */
/* Learning Goals                                                              */
/* -------------------------------------------------------------------------- */

export interface LearningGoal {
  targetMinutes: number;
  completedMinutes: number;
  streakDays: number;
  streakExtendedToday: boolean;
  weeklyHistory: {
    day: string;
    minutes: number;
    completed: boolean;
  }[];
}

export interface LearningGoalItem {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  category: string;
  recommendedPathId?: string;
  recommendedCoursesCount: number;
  projectsCount: number;
  certificationTitle: string;
  mentorsAvailableCount: number;
  description: string;
  targetCareer?: string;
  skillsGained: string[];
  recommendedCourseIds: string[];
}

/* -------------------------------------------------------------------------- */
/* Achievements & Certificates                                                 */
/* -------------------------------------------------------------------------- */

export type AchievementCategory =
  | 'milestone'
  | 'streak'
  | 'mastery'
  | 'community';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  category: AchievementCategory;
  progress?: number;
  maxProgress?: number;
}

export interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  issuedAt: string;
  credentialUrl: string;
  verificationCode: string;
  instructorName: string;
  skillsValidated: string[];
}

/* -------------------------------------------------------------------------- */
/* Home Dashboard                                                              */
/* -------------------------------------------------------------------------- */

export interface DailyMission {
  id: string;
  title: string;
  xp: number;
  completed: boolean;
  type: 'lesson' | 'quiz' | 'flashcard';
  targetCourseTitle?: string;
}

export interface LearningPathStep {
  id: string;
  title: string;
  status: 'completed' | 'current' | 'upcoming';
  description: string;
  estimatedWeeks: number;
  courseId?: string;
}

export interface AIInsightSummary {
  id: string;
  title: string;
  badgeText: string;
  message: string;
  improvedSkill: string;
  skillGap: string;
  recommendedCourseId: string;
  recommendedCourseTitle: string;
  timestamp: string;
}

export interface HomeDashboardData {
  goal: {
    title: string;
    progressPercent: number;
    currentLevel: EducationLevel;
    estimatedWeeksRemaining: number;
  };
  dailyMissions: DailyMission[];
  weeklyProgress: {
    weeklyGoalMinutes: number;
    completedMinutes: number;
    lessonsCompletedCount: number;
    averageQuizScore: number;
    daysActiveCount: number;
    daysGoalCount: number;
  };
  pathSteps: LearningPathStep[];
  aiInsight: AIInsightSummary;
}

export type WeeklyLearningProgress = HomeDashboardData['weeklyProgress'];

export type AIInsight = AIInsightSummary;

/* -------------------------------------------------------------------------- */
/* Marketplace Search                                                          */
/* -------------------------------------------------------------------------- */

export interface SearchableItemBase {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  level: EducationLevel;
  duration?: string;
  durationHours?: number;
  format?: EducationFormat;
  price?: number;
  isFree: boolean;
  rating?: number;
  language?: EducationLanguage;
  providerOrAuthor?: string;
}

export type SearchableItem =
  | (SearchableItemBase & {
      type: 'course';
      itemRef: Course;
    })
  | (SearchableItemBase & {
      type: 'bootcamp';
      itemRef: ProgramItem;
    })
  | (SearchableItemBase & {
      type: 'bimbel';
      itemRef: ProgramItem;
    })
  | (SearchableItemBase & {
      type: 'academy';
      itemRef: ProgramItem;
    })
  | (SearchableItemBase & {
      type: 'workshop';
      itemRef: ProgramItem;
    })
  | (SearchableItemBase & {
      type: 'learning_path';
      itemRef: LearningPath;
    })
  | (SearchableItemBase & {
      type: 'tutor';
      itemRef: TutorItem;
    })
  | (SearchableItemBase & {
      type: 'mentor';
      itemRef: MentorItem;
    })
  | (SearchableItemBase & {
      type: 'certification';
      itemRef: CertificationItem;
    })
  | (SearchableItemBase & {
      type: 'webinar';
      itemRef: WebinarItem;
    });

/* -------------------------------------------------------------------------- */
/* Re-export specialized domain contracts                                      */
/* -------------------------------------------------------------------------- */

export * from './ai';
export * from './learningEngine';
export * from './courseExperience';
export * from './project';
export * from './community';
export * from './portfolio';
