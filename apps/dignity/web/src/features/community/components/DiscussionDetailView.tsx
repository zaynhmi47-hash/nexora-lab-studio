import React, { useState } from 'react';
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Share2,
  Flag,
  Send,
  GraduationCap,
  Award,
  BookOpen,
  Check,
  Bookmark,
  ExternalLink,
} from 'lucide-react';
import { CommunityPost, CommunityReply } from '../../../types/community';
import { PrimaryButton, SecondaryButton, GhostButton } from '../../../components/ui/Button';

export interface DiscussionDetailViewProps {
  discussion: CommunityPost;
  onBack: () => void;
  onSelectCourse?: (courseTitle: string) => void;
  onAskAITutor?: (discussion: CommunityPost, prompt?: string) => void;
  onVote?: (id: string, direction: 'up') => void;
  onReply?: (postId: string, content: string) => void;
  onReport?: (targetType: 'post', targetId: string) => void;
}

export const DiscussionDetailView: React.FC<DiscussionDetailViewProps> = ({
  discussion,
  onBack,
  onSelectCourse,
  onAskAITutor,
  onVote,
  onReply,
  onReport,
}) => {
  const [replyText, setReplyText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReply?.(discussion.id, replyText.trim());
    setReplyText('');
  };

  const handleShare = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Back button and tools */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discussions
        </button>

        <div className="flex items-center gap-2">
          <GhostButton
            size="sm"
            onClick={handleShare}
            leftIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
          >
            {copiedLink ? 'Copied' : 'Share'}
          </GhostButton>

          <GhostButton
            size="sm"
            onClick={() => onReport?.('post', discussion.id)}
            leftIcon={<Flag className="w-3.5 h-3.5 text-slate-400" />}
          >
            Report
          </GhostButton>
        </div>
      </div>

      {/* Main Discussion Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-md">
            {discussion.communityName}
          </span>
          <span className="text-xs text-slate-400">• Posted {discussion.createdAt}</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
          {discussion.title}
        </h1>

        {/* Author information */}
        <div className="flex items-center gap-3 mt-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <img
            src={discussion.authorAvatar}
            alt={discussion.authorName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {discussion.authorName}
              </span>
              {discussion.authorRole === 'instructor' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300/40">
                  <GraduationCap className="w-3 h-3" />
                  INSTRUCTOR
                </span>
              )}
              {discussion.authorRole === 'mentor' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300/40">
                  <Award className="w-3 h-3" />
                  MENTOR
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {discussion.authorHeadline}
            </p>
          </div>
        </div>

        {/* Discussion text */}
        <div className="mt-5 text-sm sm:text-base text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
          {discussion.content}
        </div>

        {/* Related Learning Context (Integration with Step 5 Courses) */}
        {discussion.courseTitle && (
          <div className="mt-6 p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight">
                  Related Curriculum Course
                </p>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {discussion.courseTitle}
                </p>
              </div>
            </div>

            {onSelectCourse && (
              <SecondaryButton
                size="sm"
                onClick={() => onSelectCourse(discussion.courseTitle!)}
                rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                className="text-xs shrink-0"
              >
                Open Course
              </SecondaryButton>
            )}
          </div>
        )}

        {/* Action Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onVote?.(discussion.id, 'up')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                discussion.userVote === 'up'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Upvote ({discussion.upvotes})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onAskAITutor && (
              <SecondaryButton
                size="sm"
                onClick={() =>
                  onAskAITutor(
                    discussion,
                    `Please summarize the key takeaways and architectural tradeoffs from this discussion: "${discussion.title}".`
                  )
                }
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                className="text-xs"
              >
                Summarize with AI Tutor
              </SecondaryButton>
            )}
          </div>
        </div>
      </div>

      {/* Discussion Replies / Comments */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          {discussion.repliesCount} Responses
        </h2>

        {/* Mock reply items */}
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                alt="Dr. Marcus Vance"
                className="w-7 h-7 rounded-full object-cover"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Dr. Marcus Vance
                </span>
                <span className="text-[10px] text-slate-400 ml-2">2 hours ago</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Completely agree with this point. In our distributed clusters, index maintenance overhead was 40% of disk I/O. Measuring before indexing is paramount.
            </p>
          </div>
        </div>

        {/* Reply Composer */}
        <form onSubmit={handleSubmitReply} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Join the Conversation
          </h3>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Share your thoughts or technical perspective..."
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <div className="flex justify-end">
            <PrimaryButton
              type="submit"
              size="sm"
              leftIcon={<Send className="w-3.5 h-3.5" />}
              disabled={!replyText.trim()}
            >
              Post Response
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};
