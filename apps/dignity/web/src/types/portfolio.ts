import type { ProjectSkillEvidence } from './project';

export type PortfolioSectionType =
  | 'about'
  | 'skills'
  | 'projects'
  | 'certificates'
  | 'experience'
  | 'education'
  | 'achievements'
  | string;

export type PortfolioVisibility = 'public' | 'private' | string;

export type PortfolioTheme =
  | 'professional'
  | 'creative'
  | 'minimal'
  | string;

export interface PortfolioSection {
  id: string;
  type: PortfolioSectionType;
  title: string;
  isVisible: boolean;
  order: number;
}

export interface PortfolioCaseStudy {
  id: string;
  projectId: string;
  problem: string;
  research: string;
  approach: string;
  process: string;
  implementation: string;
  challenges: string;
  solution: string;
  results: string;
  lessonsLearned: string;
  updatedAt: string;
}

export interface PortfolioProject {
  id: string;
  projectId?: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  problemSummary?: string;
  solutionSummary?: string;
  skills: string[];
  tools: string[];
  role: string;
  courseTitle?: string;
  completedDate?: string;
  deliverablesCount?: number;
  demoUrl?: string;
  repositoryUrl?: string;
  isFeatured: boolean;
  order: number;
  caseStudy?: PortfolioCaseStudy;
}

export interface PortfolioSkill {
  name: string;
  category: string;
  masteryPercentage: number;
  evidenceCount: number;
  evidenceItems: ProjectSkillEvidence[];
  verifiedByCertificate: boolean;
}

export interface PortfolioCertificate {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialId?: string;
  credentialUrl?: string;
  skillsValidated: string[];
  isVerified: boolean;
}

export interface PortfolioExperience {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
  skillsUsed: string[];
}

export interface PortfolioEducation {
  id: string;
  degree: string;
  institution: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  grade?: string;
  activities?: string;
}

export interface PortfolioAchievement {
  id: string;
  title: string;
  description: string;
  date: string;
  badgeIcon: string;
  category: string;
}

export interface PortfolioPublication {
  id: string;
  title: string;
  publisher: string;
  date: string;
  url: string;
  summary: string;
}

export interface PortfolioCompletenessItem {
  id: string;
  label: string;
  description: string;
  isCompleted: boolean;
  actionText: string;
  sectionTarget: PortfolioSectionType;
}

export interface PortfolioCompleteness {
  score: number;
  level: string;
  items: PortfolioCompletenessItem[];
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  headline: string;
  bio: string;
  avatarUrl?: string;
  learningGoal?: string;
  location?: string;
  websiteUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  visibility: PortfolioVisibility;
  theme: PortfolioTheme;
  shareableSlug: string;
  lastUpdated: string;
  sections: PortfolioSection[];
  skills: PortfolioSkill[];
  projects: PortfolioProject[];
  certificates: PortfolioCertificate[];
  experience: PortfolioExperience[];
  education: PortfolioEducation[];
  achievements: PortfolioAchievement[];
  publications: PortfolioPublication[];
  completeness: PortfolioCompleteness;
}
