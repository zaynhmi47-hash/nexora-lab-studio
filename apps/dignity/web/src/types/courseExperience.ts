import type { Course, Instructor } from './index';
import type { Activity } from './learningEngine';

export type DetailedLessonType =
  | 'video'
  | 'text'
  | 'interactive'
  | 'quiz'
  | 'project'
  | 'assignment';

export type LessonStatus =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'completed';

export interface LessonResource {
  id: string;
  title: string;
  type: string;
  url: string;
  size?: string;
}

export interface LessonTextSection {
  id: string;
  heading: string;
  paragraphs: string[];
  keyConcept?: {
    title: string;
    description: string;
  };
  codeBlock?: {
    language: string;
    caption?: string;
    code: string;
  };
}

export interface LessonTextContent {
  summary: string;
  readingMinutes: number;
  sections: LessonTextSection[];
}

export interface DetailedLesson {
  id: string;
  courseId: string;
  moduleId: string;

  title: string;
  description: string;

  type: DetailedLessonType | string;
  durationMinutes: number;
  order: number;

  status: LessonStatus | string;
  isLocked: boolean;
  isRequired: boolean;

  xpReward: number;
  skillIds: string[];

  learningObjectives?: string[];

  videoUrl?: string;
  videoDurationSeconds?: number;

  resources?: LessonResource[];

  textContent?: LessonTextContent;

  activities?: Activity[];
  projectId?: string;
  codeTask?: {
    problemStatement: string;
    starterCode: string;
    solutionCode?: string;
    language: string;
    hints?: string[];
    testCases?: {
      id: string;
      input: string;
      expectedOutput: string;
      description?: string;
    }[];
    mockOutputOnSuccess?: string;
  };
}

export interface DetailedCourseModule {
  id: string;
  courseId: string;

  title: string;
  description: string;

  order: number;
  durationHours: number;

  lessons: DetailedLesson[];

  progressPercent: number;
  isUnlocked: boolean;
}

export interface CourseProjectMilestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
}

export interface CourseProjectSubmission {
  githubUrl?: string;
  demoUrl?: string;
  notes?: string;
  submittedAt?: string;
  feedback?: string;
}

export interface CourseProject {
  id: string;
  courseId: string;
  moduleId: string;

  title: string;
  objective: string;
  description: string;

  requirements: string[];
  skills: string[];

  difficulty: string;
  estimatedHours: number;

  status: string;
  completionPercent: number;

  milestones: CourseProjectMilestone[];

  starterCodeUrl?: string;

  submission?: CourseProjectSubmission;
}

export interface CourseAssessmentSkill {
  skillId: string;
  name: string;
  weight: number;
}

export interface CourseAssessment {
  id: string;
  courseId: string;
  moduleId: string;

  title: string;
  description: string;

  type: string;
  passingScorePercent: number;
  timeLimitMinutes: number;
  xpReward: number;

  skillsAssessed: CourseAssessmentSkill[];

  activities: Activity[];
}

export interface CourseReview {
  id: string;
  courseId: string;

  userName: string;
  userAvatar?: string;
  userHeadline?: string;

  rating: number;
  createdAt: string;

  comment: string;
  likes: number;
}

export interface CoursePrerequisite {
  id: string;
  title: string;
  completed: boolean;
  recommendedCourseId?: string;
  recommendedCourseTitle?: string;
}

export interface CourseIncludes {
  lessonsCount: number;
  practiceCount: number;
  assessmentsCount: number;
  projectsCount: number;
  downloadableResourcesCount: number;
  certificateEligible: boolean;
}

export interface CourseSkill {
  id: string;
  name: string;
  level: number;
  category: string;
}

export interface CourseCertificateEligibility {
  isEligible: boolean;
  unlockedAt: string;
  credentialId: string;
}

export interface DetailedCourse extends Omit<Course, 'format'> {
  format?: Course['format'] | string;
  courseType: string;

  learningPathId?: string;
  learningPathTitle?: string;
  learningPathProgress?: number;

  whatYouWillLearn: string[];
  whyItMatters: string;
  howYouKnowMastered: string;

  requirements: string[];
  prerequisites: CoursePrerequisite[];

  courseIncludes: CourseIncludes;

  detailedModules: DetailedCourseModule[];

  skills: CourseSkill[];

  projects: CourseProject[];
  assessments: CourseAssessment[];
  reviews: CourseReview[];

  recommendedNextCourses: string[];

  certificateEligibility: CourseCertificateEligibility;
}
