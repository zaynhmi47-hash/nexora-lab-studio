import React from 'react';
import {
  MessageSquare,
  ThumbsUp,
  Sparkles,
  Eye,
  GraduationCap,
  Award,
  Pin,
  Flame,
  Bookmark,
} from 'lucide-react';
import { CommunityPost } from '../../../types/community';
import { Badge } from '../../../components/ui/Badge';

export interface DiscussionCardProps {
  discussion: CommunityPost;
  onSelect: (discussion: CommunityPost) => void;
  onVote?: (id: string, direction: 'up') => void;
  onBookmark?: (id: string) => void;
  onAskAITutor?: (discussion: CommunityPost) => void;
}

export const DiscussionCard: React.FC<DiscussionCardProps> = ({
  discussion,
  onSelect,
  onVote,
  onBookmark,
  onAskAITutor,
}) => {
  const isInstructor = discussion.authorRole === 'instructor';
  const isMentor = discussion.authorRole === 'mentor';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 rounded-2xl p-4 sm:p-5 transition-all shadow-xs hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        {/* Author Header */}
        <div className="flex items-center gap-3">
          <img
            src={discussion.authorAvatar}
            alt={discussion.authorName}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {discussion.authorName}
              </span>

              {isInstructor && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/40">
                  <GraduationCap className="w-3 h-3" />
                  INSTRUCTOR
                </span>
              )}

              {isMentor && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-300/40">
                  <Award className="w-3 h-3" />
                  MENTOR
                </span>
              )}

              {discussion.isPinned && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                  <Pin className="w-2.5 h-2.5" />
                  Pinned
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
              {discussion.authorHeadline} • {discussion.createdAt}
            </p>
          </div>
        </div>

        {/* Community pill */}
        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg shrink-0">
          {discussion.communityName}
        </span>
      </div>

      {/* Main Title & preview */}
      <div className="mt-3 cursor-pointer" onClick={() => onSelect(discussion)}>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          {discussion.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {discussion.summary || discussion.content}
        </p>
      </div>

      {/* Tags row */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        {discussion.tags.map((tag) => (
          <span
            key={tag}
            className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Footer stats & interactive actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={() => onVote?.(discussion.id, 'up')}
            className={`inline-flex items-center gap-1 font-semibold px-2 py-1 rounded-md transition-colors ${
              discussion.userVote === 'up'
                ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/50'
                : 'hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{discussion.upvotes}</span>
          </button>

          <span className="inline-flex items-center gap-1 font-medium">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{discussion.repliesCount} replies</span>
          </span>

          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <Eye className="w-3.5 h-3.5" />
            <span>{discussion.viewsCount} views</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onAskAITutor && (
            <button
              type="button"
              onClick={() => onAskAITutor(discussion)}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              Summarize with AI
            </button>
          )}

          <button
            type="button"
            onClick={() => onSelect(discussion)}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline px-1 py-1"
          >
            View Thread
          </button>
        </div>
      </div>
    </div>
  );
};
