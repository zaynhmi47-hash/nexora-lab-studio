export type ProjectType =
  | 'programming'
  | 'design'
  | 'business'
  | 'marketing'
  | 'english'
  | 'data_science'
  | 'research'
  | 'personal'
  | 'capstone'
  | string;

export type ProjectDifficulty =
  | 'Beginner'
  | 'Intermediate'
  | 'Advanced'
  | 'All Levels'
  | string;

export type ProjectStatus =
  | 'available'
  | 'in_progress'
  | 'completed'
  | 'submitted'
  | 'review'
  | string;

export type ProjectTaskType =
  | 'analysis'
  | 'design'
  | 'coding'
  | 'review'
  | 'submission'
  | 'research'
  | 'writing'
  | string;

export type ProjectTaskPriority =
  | 'low'
  | 'medium'
  | 'high'
  | string;

export type ProjectTaskStatus =
  | 'available'
  | 'in_progress'
  | 'completed'
  | 'blocked'
  | string;

export type ProjectDeliverableType =
  | 'document'
  | 'link'
  | 'repository'
  | 'presentation'
  | 'dataset'
  | 'video'
  | string;

export type ProjectDeliverableStatus =
  | 'pending'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | string;

export type ProjectMilestoneStatus =
  | 'available'
  | 'in_progress'
  | 'completed'
  | string;

export type ProjectSkillStrength =
  | 'beginner'
  | 'intermediate'
  | 'strong'
  | 'advanced'
  | string;

export type ProjectReviewResult =
  | 'passed'
  | 'failed'
  | 'needs_revision'
  | string;

export interface ProjectChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  milestoneId: string;
  title: string;
  description: string;
  type: ProjectTaskType;
  priority: ProjectTaskPriority;
  status: ProjectTaskStatus;
  estimatedMinutes: number;
  skillName: string;
  completedAt?: string;
  checklist?: ProjectChecklistItem[];
}

export interface ProjectDeliverable {
  id: string;
  projectId: string;
  milestoneId: string;
  title: string;
  description: string;
  type: ProjectDeliverableType;
  isRequired: boolean;
  status: ProjectDeliverableStatus;
  value: string;
  fileName?: string;
  fileSize?: string;
  submittedAt?: string;
  feedback?: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  order: number;
  status: ProjectMilestoneStatus;
  completed: boolean;
  completionPercentage: number;
  dueDate?: string;
  tasks: ProjectTask[];
  deliverables: ProjectDeliverable[];
}

export interface ProjectResource {
  id: string;
  title: string;
  type: string;
  url: string;
  description?: string;
  size?: string;
  provider?: string;
  durationMinutes?: number;
}

export interface ProjectSubmission {
  id?: string;
  projectId?: string;
  userId?: string;
  repositoryUrl?: string;
  submittedAt?: string;
  deliverablesSummary?: Array<{
    deliverableId: string;
    title: string;
    value: string;
  }>;
  status?: ProjectStatus;
  githubUrl?: string;
  demoUrl?: string;
  notes?: string;
  feedback?: string;
}

export interface ProjectReviewCriteriaScore {
  criteria: string;
  score: number;
  maxScore: number;
  comment: string;
}

export interface ProjectReview {
  id: string;
  projectId?: string;
  submissionId?: string;
  reviewerName: string;
  reviewerAvatar: string;
  reviewerRole: string;
  reviewedAt?: string;
  createdAt?: string;
  result?: ProjectReviewResult;
  score?: number;
  criteriaScores?: ProjectReviewCriteriaScore[];
  generalFeedback?: string;
  comment?: string;
  category?: string;
  rating?: number;
  strengths?: string[];
  improvements?: string[];
  skillsDemonstrated?: string[];
}

export interface ProjectSkillEvidence {
  id: string;
  projectId: string;
  projectTitle: string;
  skillName: string;
  strength: ProjectSkillStrength;
  evidenceSummary: string;
  demonstratedAt: string;
  artifactUrl?: string;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  userId?: string;
  type: string;
  title?: string;
  description?: string;
  createdAt?: string;
  timestamp?: string;
  userName?: string;
  actorName?: string;
  actorAvatar?: string;
}

export interface ProjectEvaluationCriteria {
  title: string;
  description: string;
  weight: number;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  projectType: ProjectType;
  difficulty: ProjectDifficulty;
  estimatedHours: number;
  xpReward: number;
  thumbnailUrl: string;

  courseId: string;
  courseTitle: string;

  learningPathId?: string;
  learningPathTitle?: string;

  instructorName: string;
  instructorAvatar: string;

  learningObjectives: string[];
  requiredSkills: string[];
  prerequisites: string[];
  evaluationCriteria: ProjectEvaluationCriteria[];

  status: ProjectStatus;
  progressPercent: number;

  isStarted: boolean;
  isCompleted: boolean;

  startedAt?: string;
  completedAt?: string;

  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
  deliverables: ProjectDeliverable[];
  resources: ProjectResource[];
  submission?: ProjectSubmission;
  review?: ProjectReview;
  skillEvidence: ProjectSkillEvidence[];
  feedback: ProjectReview[];
  activities: ProjectActivity[];

  category: string;
  tags: string[];

  isCapstone: boolean;
  isFeatured: boolean;
  isCommunity?: boolean;
}
