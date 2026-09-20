import type {
  CommunityAnswer,
  CommunityChallenge,
  CommunityPost,
  CommunityReputation,
  CommunityReply,
  ProjectShowcase,
  StudyGroup,
} from '../../types/community';

import {
  mockChallenges,
  mockCommunities,
  mockDiscussions,
  mockQuestions,
  mockProjectShowcases,
  mockStudyGroups,
  mockUserReputation,
} from '../../data/mock/communityData';

type VoteDirection = 'up' | 'down';

interface AnswerInput {
  content: string;
  authorName?: string;
  authorAvatar?: string;
  authorRole?: string;
  authorHeadline?: string;
  codeSnippet?: string;
}

interface DiscussionReplyInput {
  content: string;
  authorName?: string;
  authorAvatar?: string;
  authorRole?: string;
  authorHeadline?: string;
}

interface QuestionInput {
  title?: string;
  content?: string;
  tags?: string[];
  communityId?: string;
  [key: string]: unknown;
}

interface DiscussionInput {
  title?: string;
  content?: string;
  tags?: string[];
  communityId?: string;
  [key: string]: unknown;
}

interface ReportInput {
  postId?: string;
  reason?: string;
  targetType?: string;
  targetId?: string;
  [key: string]: unknown;
}

interface ProjectCommentInput {
  content: string;
  authorName?: string;
  authorAvatar?: string;
  authorRole?: string;
}

const clone = <T>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
};

const findPost = (postId: string): CommunityPost | undefined =>
  [...mockQuestions, ...mockDiscussions].find((post) => post.id === postId);

const findGroup = (groupId: string): StudyGroup | undefined =>
  mockStudyGroups.find((group) => group.id === groupId);

const findChallenge = (challengeId: string): CommunityChallenge | undefined =>
  mockChallenges.find((challenge) => challenge.id === challengeId);

const findProject = (projectId: string): ProjectShowcase | undefined =>
  mockProjectShowcases.find((project) => project.id === projectId);

export const communityService = {
  async getCommunities() {
    return clone(mockCommunities);
  },

  async getDiscussions() {
    return clone(mockDiscussions);
  },

  async getQuestions() {
    return clone(mockQuestions);
  },

  async voteOnPost(postId: string, direction: VoteDirection) {
    const post = findPost(postId);

    if (!post) {
      throw new Error(`Community post "${postId}" not found.`);
    }

    if (direction === 'up') {
      post.upvotes = (post.upvotes ?? 0) + 1;
    }

    return clone(post);
  },

  async answerQuestion(questionId: string, input: AnswerInput) {
    const question = mockQuestions.find((item) => item.id === questionId);

    if (!question) {
      throw new Error(`Question "${questionId}" not found.`);
    }

    const answer: CommunityAnswer = {
      id: `answer-${Date.now()}`,
      questionId,
      authorId: 'current-user',
      authorName: input.authorName ?? 'You',
      authorAvatar: input.authorAvatar ?? '',
      content: input.content,
      createdAt: new Date().toISOString(),
      upvotes: 0,
      isAccepted: false,
      isInstructorAnswer: false,
      helpfulCount: 0,
      ...(input.codeSnippet
        ? {
            codeSnippet: input.codeSnippet,
          }
        : {}),
    } as CommunityAnswer;

    question.answers = [...(question.answers ?? []), answer];

    return clone(answer);
  },

  async replyToDiscussion(
    discussionId: string,
    input: DiscussionReplyInput,
  ) {
    const discussion = mockDiscussions.find(
      (item) => item.id === discussionId,
    );

    if (!discussion) {
      throw new Error(`Discussion "${discussionId}" not found.`);
    }

    const reply: CommunityReply = {
      id: `reply-${Date.now()}`,
      parentId: discussionId,
      authorId: 'current-user',
      authorName: input.authorName ?? 'You',
      authorAvatar: input.authorAvatar ?? '',
      content: input.content,
      createdAt: new Date().toISOString(),
      upvotes: 0,
    };

    discussion.replies = [...(discussion.replies ?? []), reply];

    return clone(reply);
  },

  async createQuestion(input: QuestionInput) {
    const question = {
      id: `question-${Date.now()}`,
      type: 'question' as const,
      title: input.title ?? 'New question',
      content: input.content ?? '',
      authorId: 'current-user',
      authorName: 'You',
      authorAvatar: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      upvotes: 0,
      repliesCount: 0,
      viewsCount: 0,
      answers: [],
      tags: input.tags ?? [],
      communityId: input.communityId ?? '',
    } as unknown as CommunityPost;

    mockQuestions.unshift(question);

    return clone(question);
  },

  async createDiscussion(input: DiscussionInput) {
    const discussion = {
      id: `discussion-${Date.now()}`,
      type: 'discussion' as const,
      title: input.title ?? 'New discussion',
      content: input.content ?? '',
      authorId: 'current-user',
      authorName: 'You',
      authorAvatar: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      upvotes: 0,
      repliesCount: 0,
      viewsCount: 0,
      replies: [],
      tags: input.tags ?? [],
      communityId: input.communityId ?? '',
    } as unknown as CommunityPost;

    mockDiscussions.unshift(discussion);

    return clone(discussion);
  },

  async markAnswerHelpful(answerId: string) {
    const question = mockQuestions.find((item) =>
      item.answers?.some((answer) => answer.id === answerId),
    );

    const answer = question?.answers?.find((item) => item.id === answerId);

    if (!answer) {
      throw new Error(`Answer "${answerId}" not found.`);
    }

    answer.upvotes = (answer.upvotes ?? 0) + 1;
    answer.helpfulCount = (answer.helpfulCount ?? 0) + 1;

    return clone(answer);
  },

  async acceptAnswer(questionId: string, answerId: string) {
    const question = mockQuestions.find((item) => item.id === questionId);

    if (!question) {
      throw new Error(`Question "${questionId}" not found.`);
    }

    question.answers = question.answers?.map((answer) => ({
      ...answer,
      isAccepted: answer.id === answerId,
    }));

    return clone(question);
  },

  async reportPost(input: ReportInput) {
    return {
      success: true,
      postId: input.postId ?? input.targetId ?? '',
      targetType: input.targetType ?? 'post',
      targetId: input.targetId ?? input.postId ?? '',
      reason: input.reason ?? 'unspecified',
      reportedAt: new Date().toISOString(),
    };
  },
};

export const studyGroupService = {
  async getGroups() {
    return clone(mockStudyGroups);
  },

  async joinGroup(groupId: string) {
    const group = findGroup(groupId);

    if (!group) {
      throw new Error(`Study group "${groupId}" not found.`);
    }

    if (typeof group.memberCount === 'number') {
      group.memberCount += 1;
    }

    return clone(group);
  },

  async leaveGroup(groupId: string) {
    const group = findGroup(groupId);

    if (!group) {
      throw new Error(`Study group "${groupId}" not found.`);
    }

    if (typeof group.memberCount === 'number' && group.memberCount > 0) {
      group.memberCount -= 1;
    }

    return clone(group);
  },
};

export const communityChallengeService = {
  async getChallenges() {
    return clone(mockChallenges);
  },

  async joinChallenge(challengeId: string) {
    const challenge = findChallenge(challengeId);

    if (!challenge) {
      throw new Error(`Challenge "${challengeId}" not found.`);
    }

    if (typeof challenge.participantCount === 'number') {
      challenge.participantCount += 1;
    }

    return clone(challenge);
  },
};

export const projectShowcaseService = {
  async getProjects() {
    return clone(mockProjectShowcases);
  },

  async likeProject(projectId: string) {
    const project = findProject(projectId);

    if (!project) {
      throw new Error(`Project showcase "${projectId}" not found.`);
    }

    const projectWithLikeCount = project as ProjectShowcase & {
      likes?: number;
      likesCount?: number;
    };

    if (typeof projectWithLikeCount.likesCount === 'number') {
      projectWithLikeCount.likesCount += 1;
    } else if (typeof projectWithLikeCount.likes === 'number') {
      projectWithLikeCount.likes += 1;
    }

    return clone(project);
  },

  async commentOnProject(
    projectId: string,
    input: ProjectCommentInput,
  ) {
    const project = findProject(projectId);

    if (!project) {
      throw new Error(`Project showcase "${projectId}" not found.`);
    }

    const comment = {
      id: `comment-${Date.now()}`,
      projectId,
      authorId: 'current-user',
      authorName: input.authorName ?? 'You',
      authorAvatar: input.authorAvatar ?? '',
      content: input.content,
      createdAt: new Date().toISOString(),
    };

    project.comments = [...(project.comments ?? []), comment];

    return clone(comment);
  },
};

export const communityReputationService = {
  async getReputation(): Promise<CommunityReputation> {
    return clone(mockUserReputation);
  },
};

export const communityRecommendationService = {
  async getRecommendations() {
    return clone(mockCommunities.slice(0, 3));
  },
};
