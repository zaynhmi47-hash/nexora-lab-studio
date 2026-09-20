export type PostType =
  | 'discussion'
  | 'question'
  | 'resource'
  | 'explanation'
  | string;

export type CommunityType =
  | 'course'
  | 'skill'
  | 'global'
  | 'goal'
  | string;

export type CommunityUserRole =
  | 'learner'
  | 'instructor'
  | 'organization'
  | 'administrator'
  | string;

export type ModerationStatus =
  | 'visible'
  | 'hidden'
  | 'pending'
  | 'removed'
  | string;

export interface CommunityTag {
  id: string;
  name: string;
  slug: string;
  count: number;
  skillCategory: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  type: CommunityType;
  description: string;
  iconName: string;
  courseId?: string;
  courseTitle?: string;
  skillId?: string;
  skillName?: string;
  learningGoal?: string;
  memberCount: number;
  postCount: number;
  isJoined: boolean;
  isFeatured: boolean;
  tags: string[];
}

export interface CommunityReply {
  id: string;
  parentId: string;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  authorHeadline?: string;
  authorRole?: CommunityUserRole;
  content: string;
  createdAt: string;
  upvotes?: number;
  helpfulCount?: number;
  moderationStatus?: ModerationStatus;
}

export interface CommunityAnswer {
  id: string;
  questionId: string;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  authorHeadline?: string;
  authorRole?: CommunityUserRole;
  isInstructorAnswer: boolean;
  isAccepted: boolean;
  helpfulCount: number;
  userMarkedHelpful?: boolean;
  upvotes: number;
  createdAt: string;
  content: string;
  codeSnippet?: string;
  moderationStatus?: ModerationStatus;
  replies?: CommunityReply[];
}

export interface CommunityPost {
  id: string;
  type: PostType;
  title: string;
  content: string;
  summary?: string;

  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  authorHeadline?: string;
  authorRole?: CommunityUserRole;

  communityId?: string;
  communityName?: string;
  courseId?: string;
  courseTitle?: string;
  skillId?: string;
  skillName?: string;

  tags: string[];

  upvotes: number;
  repliesCount: number;
  viewsCount: number;

  isSolved?: boolean;
  solvedAnswerId?: string;
  hasInstructorAnswer?: boolean;

  difficulty?: string;
  moderationStatus?: ModerationStatus;
  createdAt: string;

  isSaved?: boolean;
  isInstructorPost?: boolean;
  isPinned?: boolean;

  answers?: CommunityAnswer[];
  replies?: CommunityReply[];

  resourceUrl?: string;
  resourceType?: string;
  acceptedAnswerId?: string;
}

export interface StudyGroupSession {
  id: string;
  groupId?: string;
  title: string;
  description?: string;
  scheduledAt?: string;
  scheduledDate?: string;
  topic?: string;
  agenda?: string[];
  attendeeCount?: number;
  isAttending?: boolean;
  durationMinutes: number;
  hostId?: string;
  hostName?: string;
  hostAvatar?: string;
  meetingUrl?: string;
  participantCount?: number;
  maxParticipants?: number;
  isJoined?: boolean;
  status?: 'scheduled' | 'live' | 'completed' | string;
}

export interface StudyGroup {
  id: string;
  name: string;
  slug?: string;
  description: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  coverImage?: string;
  communityId?: string;
  courseId?: string;
  courseTitle?: string;
  skillId?: string;
  skillName?: string;
  ownerId?: string;
  ownerName?: string;
  ownerAvatar?: string;
  organizer?: {
    id: string;
    name: string;
    avatar?: string;
    headline?: string;
    role?: string;
  };
  memberCount: number;
  maxMembers?: number;
  isJoined: boolean;
  isPrivate?: boolean;
  learningGoal?: string;
  learningPlan?: {
    id: string;
    title: string;
    description: string;
    courseTitle?: string;
    items: Array<{
      day: number;
      title: string;
      skill: string;
      isCompleted: boolean;
    }>;
  };
  activityLevel?: string;
  privacy?: string;
  progressPercent?: number;
  tags?: string[];
  focusTopics?: string[];
  upcomingSessions: StudyGroupSession[];
  recentDiscussions?: Array<{
    id: string;
    title: string;
    author: string;
    replies: number;
    time: string;
  }>;
  createdAt?: string;
}

export interface CommunityChallengeMilestone {
  title: string;
  xp: number;
  done: boolean;
}

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  type?: string;
  difficulty?: string;
  skillName?: string;
  skillId?: string;
  communityId?: string;
  courseId?: string;
  courseTitle?: string;
  xpReward: number;
  participantCount?: number;
  participantsCount?: number;
  completionCount?: number;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  isActive?: boolean;
  isCompleted?: boolean;
  isJoined?: boolean;
  progressPercent?: number;
  milestones?: CommunityChallengeMilestone[];
  requirements?: string[];
  tags?: string[];
  thumbnailUrl?: string;
  duration?: string;
}

export interface ProjectShowcaseCreator {
  id: string;
  name: string;
  headline?: string;
  avatar?: string;
}

export interface ProjectShowcase {
  id: string;
  projectId?: string;
  title: string;
  description: string;
  problem?: string;
  solution?: string;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  authorHeadline?: string;
  projectType?: string;
  difficulty?: string;
  courseId?: string;
  courseTitle?: string;
  skills?: string[];
  tags?: string[];
  thumbnailUrl?: string;
  imageUrl?: string;
  creator?: ProjectShowcaseCreator;
  completionStatus?: string;
  repositoryUrl?: string;
  repoUrl?: string;
  demoUrl?: string;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  comments?: Array<{
    id: string;
    projectId?: string;
    userId?: string;
    userName?: string;
    userAvatar?: string;
    authorId?: string;
    authorName?: string;
    authorAvatar?: string;
    authorHeadline?: string;
    authorRole?: string;
    content: string;
    createdAt: string;
  }>;
  isLiked?: boolean;
  userLiked?: boolean;
  isFeatured?: boolean;
  createdAt: string;
}

export interface CommunityBadge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  tier?: string;
  rarity?: string;
  requirement?: string;
  earnedAt?: string;
  earnedDate?: string;
  isEarned?: boolean;
  progress?: number;
}

export interface CommunityReputation {
  userId: string;
  totalPoints?: number;
  reputationScore?: number;
  level?: number;
  levelName?: string;
  rank?: string;
  nextLevelPoints?: number;
  questionsAsked?: number;
  questionsAskedCount?: number;
  questionsAnswered?: number;
  acceptedAnswers?: number;
  helpfulAnswersCount?: number;
  helpfulAnswers?: number;
  postsCreated?: number;
  discussionsCreatedCount?: number;
  projectsShared?: number;
  projectsSharedCount?: number;
  badgesCount?: number;
  challengesCompleted?: number;
  badges?: CommunityBadge[];
}
