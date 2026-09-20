import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  MessageSquare,
  HelpCircle,
  Users,
  Trophy,
  FolderGit2,
  Bookmark,
  Search,
  Filter,
  Plus,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Flame,
  CheckCircle2,
  Code2,
  Layers,
  GraduationCap,
} from 'lucide-react';
import {
  Community,
  CommunityPost,
  StudyGroup,
  CommunityChallenge,
  ProjectShowcase,
  CommunityReputation,
  CommunityTag,
  PostType,
} from '../../types/community';
import {
  communityService,
  studyGroupService,
  communityChallengeService,
  projectShowcaseService,
  communityReputationService,
  communityRecommendationService,
} from '../../services/community/communityService';
import { mockCommunityTags } from '../../data/mock/communityData';
import {
  CommunityTabs,
  CommunityTabType,
  CommunityHeader,
} from './components/CommunityHeader';
import { QuestionCard } from './components/QuestionCard';
import { DiscussionCard } from './components/DiscussionCard';
import { StudyGroupCard } from './components/StudyGroupCard';
import { ChallengeCard } from './components/ChallengeCard';
import { ProjectShowcaseCard } from './components/ProjectShowcaseCard';
import { CommunitySidebar } from './components/CommunitySidebar';
import { QuestionDetailView } from './components/QuestionDetailView';
import { DiscussionDetailView } from './components/DiscussionDetailView';
import { StudyGroupDetailView } from './components/StudyGroupDetailView';
import { ProjectDetailView } from './components/ProjectDetailView';
import { CreatePostModal } from './components/CreatePostModal';
import { ReportModal } from './components/ReportModal';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';

export interface CommunityScreenProps {
  initialTab?: CommunityTabType;
  onNavigatePractice?: (skillName?: string) => void;
  onNavigateCourse?: (courseTitle: string) => void;
  onNavigateAITutor?: (prompt?: string) => void;
}

export const CommunityScreen: React.FC<CommunityScreenProps> = ({
  initialTab = 'home',
  onNavigatePractice,
  onNavigateCourse,
  onNavigateAITutor,
}) => {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<CommunityTabType>(initialTab);
  const [selectedQuestion, setSelectedQuestion] = useState<CommunityPost | null>(null);
  const [selectedDiscussion, setSelectedDiscussion] = useState<CommunityPost | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectShowcase | null>(null);

  // Data states
  const [communities, setCommunities] = useState<Community[]>([]);
  const [discussions, setDiscussions] = useState<CommunityPost[]>([]);
  const [questions, setQuestions] = useState<CommunityPost[]>([]);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);
  const [projects, setProjects] = useState<ProjectShowcase[]>([]);
  const [reputation, setReputation] = useState<CommunityReputation | null>(null);
  const [recommendations, setRecommendations] = useState<any>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string>('');
  const [questionFilter, setQuestionFilter] = useState<'all' | 'unsolved' | 'instructor'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'upvotes' | 'active'>('latest');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInitialType, setCreateInitialType] = useState<PostType>('discussion');
  const [reportModalState, setReportModalState] = useState<{
    isOpen: boolean;
    targetType: string;
    targetId: string;
  }>({ isOpen: false, targetType: 'post', targetId: '' });

  // Initial Data Fetching
  const loadData = async () => {
    try {
      const [
        commsData,
        discData,
        qData,
        grpData,
        chalData,
        projData,
        repData,
        recData,
      ] = await Promise.all([
        communityService.getCommunities(),
        communityService.getDiscussions(),
        communityService.getQuestions(),
        studyGroupService.getGroups(),
        communityChallengeService.getChallenges(),
        projectShowcaseService.getProjects(),
        communityReputationService.getReputation(),
        communityRecommendationService.getRecommendations(),
      ]);

      setCommunities(commsData);
      setDiscussions(discData);
      setQuestions(qData);
      setGroups(grpData);
      setChallenges(chalData);
      setProjects(projData);
      setReputation(repData);
      setRecommendations(recData);
    } catch (err) {
      console.error('Error loading community data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Post & Question Voting
  const handleVote = async (postId: string, direction: 'up') => {
    await communityService.voteOnPost(postId, direction);
    // Update local state
    setDiscussions((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              upvotes: p.userVote === 'up' ? p.upvotes - 1 : p.upvotes + 1,
              userVote: p.userVote === 'up' ? undefined : 'up',
            }
          : p
      )
    );
    setQuestions((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              upvotes: p.userVote === 'up' ? p.upvotes - 1 : p.upvotes + 1,
              userVote: p.userVote === 'up' ? undefined : 'up',
            }
          : p
      )
    );
    if (selectedQuestion?.id === postId) {
      setSelectedQuestion((prev) =>
        prev
          ? {
              ...prev,
              upvotes: prev.userVote === 'up' ? prev.upvotes - 1 : prev.upvotes + 1,
              userVote: prev.userVote === 'up' ? undefined : 'up',
            }
          : null
      );
    }
  };

  // Study Group Join / Leave
  const handleJoinGroupToggle = async (groupId: string) => {
    const grp = groups.find((g) => g.id === groupId);
    if (!grp) return;

    if (grp.isJoined) {
      await studyGroupService.leaveGroup(groupId);
    } else {
      await studyGroupService.joinGroup(groupId);
    }

    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              isJoined: !g.isJoined,
              memberCount: g.isJoined ? g.memberCount - 1 : g.memberCount + 1,
            }
          : g
      )
    );

    if (selectedGroup?.id === groupId) {
      setSelectedGroup((prev) =>
        prev
          ? {
              ...prev,
              isJoined: !prev.isJoined,
              memberCount: prev.isJoined ? prev.memberCount - 1 : prev.memberCount + 1,
            }
          : null
      );
    }
  };

  // Challenge Join Toggle
  const handleJoinChallengeToggle = async (chalId: string) => {
    await communityChallengeService.joinChallenge(chalId);
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === chalId
          ? {
              ...c,
              isJoined: !c.isJoined,
              participantsCount: c.isJoined ? c.participantsCount - 1 : c.participantsCount + 1,
            }
          : c
      )
    );
  };

  // Project Like Toggle
  const handleLikeProject = async (projId: string) => {
    await projectShowcaseService.likeProject(projId);
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projId
          ? {
              ...p,
              userLiked: !p.userLiked,
              likesCount: p.userLiked ? p.likesCount - 1 : p.likesCount + 1,
            }
          : p
      )
    );
    if (selectedProject?.id === projId) {
      setSelectedProject((prev) =>
        prev
          ? {
              ...prev,
              userLiked: !prev.userLiked,
              likesCount: prev.userLiked ? prev.likesCount - 1 : prev.likesCount + 1,
            }
          : null
      );
    }
  };

  // Answer adding to question
  const handleAddAnswer = async (questionId: string, content: string, codeSnippet?: string) => {
    const newAnswer = await communityService.answerQuestion(questionId, {
      content,
      codeSnippet,
      authorName: 'Alex Chen',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      authorRole: 'learner',
      authorHeadline: 'Full-Stack Learner',
    });

    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              repliesCount: (q.repliesCount || 0) + 1,
              answers: [...(q.answers || []), newAnswer],
            }
          : q
      )
    );

    if (selectedQuestion?.id === questionId) {
      setSelectedQuestion((prev) =>
        prev
          ? {
              ...prev,
              repliesCount: (prev.repliesCount || 0) + 1,
              answers: [...(prev.answers || []), newAnswer],
            }
          : null
      );
    }
  };

  // Reply adding to discussion
  const handleAddReply = async (discussionId: string, content: string) => {
    await communityService.replyToDiscussion(discussionId, {
      content,
      authorName: 'Alex Chen',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      authorRole: 'learner',
      authorHeadline: 'Full-Stack Learner',
    });

    setDiscussions((prev) =>
      prev.map((d) =>
        d.id === discussionId ? { ...d, repliesCount: d.repliesCount + 1 } : d
      )
    );
  };

  // Creation of new post
  const handleCreatePost = async (postData: Partial<CommunityPost>) => {
    if (postData.type === 'question') {
      const created = await communityService.createQuestion(postData);
      setQuestions((prev) => [created, ...prev]);
      setActiveTab('questions');
    } else {
      const created = await communityService.createDiscussion(postData);
      setDiscussions((prev) => [created, ...prev]);
      setActiveTab('discussions');
    }
  };

  // Filtered discussions
  const filteredDiscussions = useMemo(() => {
    return discussions.filter((d) => {
      const matchesSearch =
        !searchQuery ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !activeTag || d.tags.includes(activeTag.toLowerCase());
      return matchesSearch && matchesTag;
    });
  }, [discussions, searchQuery, activeTag]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        !searchQuery ||
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !activeTag || q.tags.includes(activeTag.toLowerCase());
      const matchesStatus =
        questionFilter === 'all'
          ? true
          : questionFilter === 'unsolved'
          ? !q.isSolved
          : q.hasInstructorAnswer || q.authorRole === 'instructor';
      return matchesSearch && matchesTag && matchesStatus;
    });
  }, [questions, searchQuery, activeTag, questionFilter]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag =
        !activeTag || p.skills.some((s) => s.toLowerCase().includes(activeTag.toLowerCase()));
      return matchesSearch && matchesTag;
    });
  }, [projects, searchQuery, activeTag]);

  // Sub-detail view rendering
  if (selectedQuestion) {
    return (
      <div className="animate-fade-in">
        <QuestionDetailView
          question={selectedQuestion}
          onBack={() => setSelectedQuestion(null)}
          onPracticeConcept={(skillName, courseTitle) => {
            onNavigatePractice?.(skillName);
          }}
          onAskAITutor={(q, prompt) => {
            onNavigateAITutor?.(
              prompt ||
                `I need help with this question from the community: "${q.title}". Can you break it down?`
            );
          }}
          onVoteQuestion={(id, dir) => handleVote(id, dir)}
          onVoteAnswer={(ansId) => {
            // vote answer
          }}
          onMarkHelpful={async (ansId) => {
            await communityService.markAnswerHelpful(ansId);
            setSelectedQuestion((prev) =>
              prev
                ? {
                    ...prev,
                    answers: prev.answers?.map((a) =>
                      a.id === ansId
                        ? {
                            ...a,
                            helpfulCount: a.helpfulCount + 1,
                            userMarkedHelpful: true,
                          }
                        : a
                    ),
                  }
                : null
            );
          }}
          onAcceptAnswer={async (qId, ansId) => {
            await communityService.acceptAnswer(qId, ansId);
            setSelectedQuestion((prev) =>
              prev
                ? {
                    ...prev,
                    isSolved: true,
                    answers: prev.answers?.map((a) => ({
                      ...a,
                      isAccepted: a.id === ansId,
                    })),
                  }
                : null
            );
          }}
          onAddAnswer={handleAddAnswer}
          onReport={(type, id) =>
            setReportModalState({ isOpen: true, targetType: type, targetId: id })
          }
        />
        <ReportModal
          isOpen={reportModalState.isOpen}
          targetType={reportModalState.targetType}
          onClose={() => setReportModalState({ isOpen: false, targetType: '', targetId: '' })}
          onSubmit={(data) => {
            communityService.reportPost({
              targetType: reportModalState.targetType as any,
              targetId: reportModalState.targetId,
              reason: data.reason as any,
              details: data.details,
            });
          }}
        />
      </div>
    );
  }

  if (selectedDiscussion) {
    return (
      <div className="animate-fade-in">
        <DiscussionDetailView
          discussion={selectedDiscussion}
          onBack={() => setSelectedDiscussion(null)}
          onSelectCourse={(courseTitle) => onNavigateCourse?.(courseTitle)}
          onAskAITutor={(d, prompt) => {
            onNavigateAITutor?.(
              prompt ||
                `Please analyze the discussion "${d.title}" and explain the practical engineering trade-offs.`
            );
          }}
          onVote={(id, dir) => handleVote(id, dir)}
          onReply={handleAddReply}
          onReport={(type, id) =>
            setReportModalState({ isOpen: true, targetType: type, targetId: id })
          }
        />
        <ReportModal
          isOpen={reportModalState.isOpen}
          targetType={reportModalState.targetType}
          onClose={() => setReportModalState({ isOpen: false, targetType: '', targetId: '' })}
          onSubmit={(data) => {
            communityService.reportPost({
              targetType: reportModalState.targetType as any,
              targetId: reportModalState.targetId,
              reason: data.reason as any,
              details: data.details,
            });
          }}
        />
      </div>
    );
  }

  if (selectedGroup) {
    return (
      <div className="animate-fade-in">
        <StudyGroupDetailView
          group={selectedGroup}
          onBack={() => setSelectedGroup(null)}
          onJoinToggle={handleJoinGroupToggle}
          onOpenCourse={(courseTitle) => onNavigateCourse?.(courseTitle)}
          onStartPractice={(skillName) => onNavigatePractice?.(skillName)}
        />
      </div>
    );
  }

  if (selectedProject) {
    return (
      <div className="animate-fade-in">
        <ProjectDetailView
          project={selectedProject}
          onBack={() => setSelectedProject(null)}
          onLike={handleLikeProject}
          onComment={async (projId, content) => {
            await projectShowcaseService.commentOnProject(projId, {
              authorName: 'Alex Chen',
              authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              authorRole: 'learner',
              content,
            });
            setSelectedProject((prev) =>
              prev
                ? {
                    ...prev,
                    commentsCount: prev.commentsCount + 1,
                    comments: [
                      ...(prev.comments || []),
                      {
                        id: `c-${Date.now()}`,
                        authorName: 'Alex Chen',
                        authorAvatar:
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                        authorRole: 'learner',
                        content,
                        createdAt: 'Just now',
                      },
                    ],
                  }
                : null
            );
          }}
          onOpenCourse={(courseTitle) => onNavigateCourse?.(courseTitle)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Community Hero Header */}
      <CommunityHeader
        onCreatePost={() => {
          setCreateInitialType('discussion');
          setIsCreateModalOpen(true);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        reputationScore={reputation?.reputationScore || 245}
      />

      {/* 2. Primary Community Navigation Tabs */}
      <CommunityTabs
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 120, behavior: 'smooth' });
        }}
        questionsCount={questions.filter((q) => !q.isSolved).length}
        groupsCount={groups.length}
      />

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discussions, architectural questions, study circles..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Active tag indicator */}
        {activeTag && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300">
            <span>Filter: #{activeTag}</span>
            <button
              type="button"
              onClick={() => setActiveTag('')}
              className="ml-1 text-slate-400 hover:text-blue-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Sub-Filters for Questions Tab */}
        {activeTab === 'questions' && (
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setQuestionFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                questionFilter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setQuestionFilter('unsolved')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                questionFilter === 'unsolved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Unsolved
            </button>
            <button
              type="button"
              onClick={() => setQuestionFilter('instructor')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                questionFilter === 'instructor'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Instructor Answers
            </button>
          </div>
        )}
      </div>

      {/* 4. Main Two-Column Layout (Content Feed + Context Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Feed Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* TAB 1: COMMUNITY HOME */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              {/* Weak Skill Recommendation Box (Connected to Learner Context) */}
              {recommendations?.weakSkillItem && (
                <div className="bg-gradient-to-br from-indigo-900/90 to-blue-950 text-white rounded-2xl p-5 sm:p-6 shadow-xs border border-indigo-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      🎯 Targeted for your growth
                    </span>
                    <span className="text-xs text-indigo-200">
                      Based on your weak skill in Database / SQL
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {recommendations.weakSkillItem.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-indigo-100/80 mt-1 line-clamp-2">
                    {recommendations.weakSkillItem.summary || recommendations.weakSkillItem.content}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <PrimaryButton
                      size="sm"
                      onClick={() => setSelectedQuestion(recommendations.weakSkillItem)}
                    >
                      Read Solutions
                    </PrimaryButton>

                    <SecondaryButton
                      size="sm"
                      onClick={() => onNavigatePractice?.('SQL JOINs')}
                      leftIcon={<Code2 className="w-3.5 h-3.5 text-emerald-400" />}
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                    >
                      Practice SQL JOINs Drills
                    </SecondaryButton>
                  </div>
                </div>
              )}

              {/* Questions Needing Answers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-blue-600" />
                    Questions Needing Answers
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('questions')}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    View All Questions
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {questions.slice(0, 3).map((q) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      onSelect={(question) => setSelectedQuestion(question)}
                      onPracticeConcept={(skill) => onNavigatePractice?.(skill)}
                      onAskAITutor={(question) =>
                        onNavigateAITutor?.(`Explain this question: "${question.title}"`)
                      }
                      onVote={(id, dir) => handleVote(id, dir)}
                    />
                  ))}
                </div>
              </div>

              {/* Trending Architecture Discussions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Trending Discussions
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('discussions')}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    View All Discussions
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {discussions.slice(0, 3).map((d) => (
                    <DiscussionCard
                      key={d.id}
                      discussion={d}
                      onSelect={(disc) => setSelectedDiscussion(disc)}
                      onVote={(id, dir) => handleVote(id, dir)}
                      onAskAITutor={(disc) =>
                        onNavigateAITutor?.(`Summarize discussion: "${disc.title}"`)
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Recommended Study Groups Carousel / Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    Active Study Groups
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('groups')}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    Explore Groups
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {groups.slice(0, 2).map((g) => (
                    <StudyGroupCard
                      key={g.id}
                      group={g}
                      onSelect={(group) => setSelectedGroup(group)}
                      onJoinToggle={handleJoinGroupToggle}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DISCUSSIONS */}
          {activeTab === 'discussions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  All Discussions ({filteredDiscussions.length})
                </h2>
                <PrimaryButton
                  size="sm"
                  onClick={() => {
                    setCreateInitialType('discussion');
                    setIsCreateModalOpen(true);
                  }}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Start Discussion
                </PrimaryButton>
              </div>

              {filteredDiscussions.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                  <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No discussions found
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try changing your search query or clear the active tag.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDiscussions.map((d) => (
                    <DiscussionCard
                      key={d.id}
                      discussion={d}
                      onSelect={(disc) => setSelectedDiscussion(disc)}
                      onVote={(id, dir) => handleVote(id, dir)}
                      onAskAITutor={(disc) =>
                        onNavigateAITutor?.(`Summarize discussion: "${disc.title}"`)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QUESTIONS */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Q&A Knowledge Base ({filteredQuestions.length})
                </h2>
                <PrimaryButton
                  size="sm"
                  onClick={() => {
                    setCreateInitialType('question');
                    setIsCreateModalOpen(true);
                  }}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Ask Question
                </PrimaryButton>
              </div>

              {filteredQuestions.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                  <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No questions found matching criteria
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try switching filters or asking a new question.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredQuestions.map((q) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      onSelect={(question) => setSelectedQuestion(question)}
                      onPracticeConcept={(skill) => onNavigatePractice?.(skill)}
                      onAskAITutor={(question) =>
                        onNavigateAITutor?.(`Explain this question: "${question.title}"`)
                      }
                      onVote={(id, dir) => handleVote(id, dir)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STUDY GROUPS */}
          {activeTab === 'groups' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Peer Study Groups & Circles ({groups.length})
                </h2>
                <PrimaryButton
                  size="sm"
                  onClick={() => {
                    alert('Create a new Study Group: choose learning track, syllabus, and weekly lab times.');
                  }}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Start Group
                </PrimaryButton>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {groups.map((g) => (
                  <StudyGroupCard
                    key={g.id}
                    group={g}
                    onSelect={(group) => setSelectedGroup(group)}
                    onJoinToggle={handleJoinGroupToggle}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: CHALLENGES */}
          {activeTab === 'challenges' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Sprint Challenges & XP Events ({challenges.length})
                </h2>
                <span className="text-xs text-slate-500 font-semibold">
                  Earn bonus XP and unlock platform badges
                </span>
              </div>

              <div className="space-y-4">
                {challenges.map((c) => (
                  <ChallengeCard
                    key={c.id}
                    challenge={c}
                    onJoinToggle={handleJoinChallengeToggle}
                    onStartChallenge={(chal) => {
                      onNavigatePractice?.(chal.skillName);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Project Showcase ({filteredProjects.length})
                </h2>
                <PrimaryButton
                  size="sm"
                  onClick={() => {
                    alert('Showcase your completed course project with demo link and GitHub repository.');
                  }}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Submit Project
                </PrimaryButton>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredProjects.map((p) => (
                  <ProjectShowcaseCard
                    key={p.id}
                    project={p}
                    onSelect={(proj) => setSelectedProject(proj)}
                    onLike={handleLikeProject}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: MY ACTIVITY */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Your Community Engagements
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                    <p className="text-xl font-black text-blue-600 dark:text-blue-400">
                      {groups.filter((g) => g.isJoined).length}
                    </p>
                    <span className="text-xs text-slate-500">Joined Groups</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                    <p className="text-xl font-black text-amber-600 dark:text-amber-400">
                      {challenges.filter((c) => c.isJoined).length}
                    </p>
                    <span className="text-xs text-slate-500">Active Challenges</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      {reputation?.helpfulAnswersCount || 18}
                    </p>
                    <span className="text-xs text-slate-500">Helpful Votes</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900">
                    <p className="text-xl font-black text-purple-600 dark:text-purple-400">
                      {reputation?.reputationScore || 245}
                    </p>
                    <span className="text-xs text-slate-500">Reputation</span>
                  </div>
                </div>
              </div>

              {/* Saved & Joined Sections */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Your Joined Study Groups
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {groups
                    .filter((g) => g.isJoined)
                    .map((g) => (
                      <StudyGroupCard
                        key={g.id}
                        group={g}
                        onSelect={(grp) => setSelectedGroup(grp)}
                        onJoinToggle={handleJoinGroupToggle}
                      />
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Community Sidebar */}
        <div className="lg:col-span-1">
          {reputation && (
            <CommunitySidebar
              reputation={reputation}
              recommendedCommunities={communities}
              recommendedGroups={groups}
              activeChallenge={challenges[0]}
              tags={mockCommunityTags}
              activeTag={activeTag}
              onSelectTag={(tag) => setActiveTag(tag)}
              onSelectGroup={(grp) => setSelectedGroup(grp)}
              onSelectCommunity={(comm) => setActiveTag(comm.tags[0] || '')}
              onViewAllGroups={() => setActiveTab('groups')}
              onViewAllChallenges={() => setActiveTab('challenges')}
            />
          )}
        </div>
      </div>

      {/* Creation Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePost}
        initialType={createInitialType}
      />
    </div>
  );
};
