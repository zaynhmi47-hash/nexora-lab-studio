import React from 'react';
import {
  Users,
  Trophy,
  Sparkles,
  TrendingUp,
  Award,
  ChevronRight,
  Flame,
  CheckCircle2,
  Code2,
  Database,
  Layers,
} from 'lucide-react';
import { Community, StudyGroup, CommunityChallenge, CommunityReputation, CommunityTag } from '../../../types/community';
import { Badge } from '../../../components/ui/Badge';
import { GhostButton, SecondaryButton } from '../../../components/ui/Button';

export interface CommunitySidebarProps {
  reputation: CommunityReputation;
  recommendedCommunities: Community[];
  recommendedGroups: StudyGroup[];
  activeChallenge?: CommunityChallenge;
  tags: CommunityTag[];
  activeTag?: string;
  onSelectTag?: (tag: string) => void;
  onSelectGroup?: (group: StudyGroup) => void;
  onSelectCommunity?: (community: Community) => void;
  onViewAllGroups?: () => void;
  onViewAllChallenges?: () => void;
}

export const CommunitySidebar: React.FC<CommunitySidebarProps> = ({
  reputation,
  recommendedCommunities,
  recommendedGroups,
  activeChallenge,
  tags,
  activeTag,
  onSelectTag,
  onSelectGroup,
  onSelectCommunity,
  onViewAllGroups,
  onViewAllChallenges,
}) => {
  return (
    <aside className="space-y-6">
      {/* 1. Community Reputation & Badges Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Your Community Standing
          </h4>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
            Rank #12
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xl font-black shadow-sm">
            ⭐
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {reputation.reputationScore}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Community Reputation Points
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] text-slate-400">Helpful Answers</span>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {reputation.helpfulAnswersCount}
            </p>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] text-slate-400">Badges Earned</span>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {reputation.badgesCount}
            </p>
          </div>
        </div>

        {/* Badges preview */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {reputation.badges.slice(0, 3).map((badge) => (
            <span
              key={badge.id}
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/50"
              title={badge.description}
            >
              🏅 {badge.name}
            </span>
          ))}
        </div>
      </div>

      {/* 2. Recommended Communities */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Communities for You
        </h4>
        <div className="space-y-2.5">
          {recommendedCommunities.slice(0, 4).map((comm) => (
            <div
              key={comm.id}
              onClick={() => onSelectCommunity?.(comm)}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
            >
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                  {comm.name}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {comm.memberCount} members • {comm.postCount} topics
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Recommended Study Groups */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Active Study Groups
          </h4>
          <button
            type="button"
            onClick={onViewAllGroups}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            View All
          </button>
        </div>

        <div className="space-y-3">
          {recommendedGroups.slice(0, 2).map((grp) => (
            <div
              key={grp.id}
              onClick={() => onSelectGroup?.(grp)}
              className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-900 dark:text-white truncate">
                  {grp.name}
                </span>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0 ml-1">
                  {grp.memberCount} joined
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">{grp.learningGoal}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Active Weekly Challenge Promo */}
      {activeChallenge && (
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/40 dark:border-amber-700/40 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
            <Trophy className="w-4 h-4 text-amber-500" />
            Active Sprint Challenge
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            {activeChallenge.title}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
            {activeChallenge.description}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs font-black text-amber-600 dark:text-amber-400">
              +{activeChallenge.xpReward} XP
            </span>
            <button
              type="button"
              onClick={onViewAllChallenges}
              className="text-xs font-bold text-amber-800 dark:text-amber-300 hover:underline"
            >
              View Challenge →
            </button>
          </div>
        </div>
      )}

      {/* 5. Trending Tags */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Explore Topics & Skills
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => {
            const isSelected = activeTag === t.name;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTag?.(isSelected ? '' : t.name)}
                className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                #{t.name}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
