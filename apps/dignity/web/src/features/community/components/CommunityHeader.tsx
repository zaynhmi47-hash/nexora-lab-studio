import React from 'react';
import {
  Compass,
  MessageSquare,
  HelpCircle,
  Users,
  Trophy,
  FolderGit2,
  Bookmark,
  Sparkles,
  Plus,
} from 'lucide-react';
import { PrimaryButton } from '../../../components/ui/Button';

export type CommunityTabType =
  | 'home'
  | 'discussions'
  | 'questions'
  | 'groups'
  | 'challenges'
  | 'projects'
  | 'activity';

export interface CommunityTabsProps {
  activeTab: CommunityTabType;
  onTabChange: (tab: CommunityTabType) => void;
  questionsCount?: number;
  groupsCount?: number;
}

export const CommunityTabs: React.FC<CommunityTabsProps> = ({
  activeTab,
  onTabChange,
  questionsCount,
  groupsCount,
}) => {
  const tabs: {
    id: CommunityTabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    { id: 'home', label: 'Community Home', icon: Compass },
    { id: 'discussions', label: 'Discussions', icon: MessageSquare },
    { id: 'questions', label: 'Questions', icon: HelpCircle, badge: questionsCount ? `${questionsCount}` : undefined },
    { id: 'groups', label: 'Study Groups', icon: Users, badge: groupsCount ? `${groupsCount}` : undefined },
    { id: 'challenges', label: 'Challenges', icon: Trophy, badge: 'XP' },
    { id: 'projects', label: 'Project Showcase', icon: FolderGit2 },
    { id: 'activity', label: 'My Activity', icon: Bookmark },
  ];

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20">
      <div className="flex items-center gap-1 overflow-x-auto py-2 px-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id as CommunityTabType)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export interface CommunityHeaderProps {
  onCreatePost: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onFilterTag?: (tag: string) => void;
  activeTag?: string;
  reputationScore?: number;
}

export const CommunityHeader: React.FC<CommunityHeaderProps> = ({
  onCreatePost,
  searchQuery,
  onSearchChange,
  reputationScore = 245,
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              Education Collaboration Ecosystem
            </span>
            <span className="text-xs text-slate-400">• Connected to your Active Courses</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            Learn together. Grow together.
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
            Ask questions, exchange architectural trade-offs, join peer study groups, and get feedback from verified instructors and mentors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">Your Reputation:</span>
            <span className="font-extrabold text-white text-sm">⭐ {reputationScore}</span>
          </div>

          <PrimaryButton
            size="md"
            onClick={onCreatePost}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-lg hover:shadow-blue-500/20"
          >
            Create Post
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};
