import React, { useState } from 'react';
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  ExternalLink,
  Code2,
  FolderGit2,
  Share2,
  Send,
  Check,
} from 'lucide-react';
import { ProjectShowcase } from '../../../types/community';
import { PrimaryButton, SecondaryButton, GhostButton } from '../../../components/ui/Button';

export interface ProjectDetailViewProps {
  project: ProjectShowcase;
  onBack: () => void;
  onLike?: (id: string) => void;
  onComment?: (projectId: string, content: string) => void;
  onOpenCourse?: (courseTitle: string) => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  onBack,
  onLike,
  onComment,
  onOpenCourse,
}) => {
  const [commentText, setCommentText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment?.(project.id, commentText.trim());
    setCommentText('');
  };

  const handleShare = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Project Showcase
        </button>

        <div className="flex items-center gap-2">
          <GhostButton
            size="sm"
            onClick={handleShare}
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
          >
            {copied ? 'Copied' : 'Share'}
          </GhostButton>
        </div>
      </div>

      {/* Main Project Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        {/* Cover image */}
        <div className="h-64 sm:h-80 w-full relative overflow-hidden bg-slate-900">
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

          <div className="absolute top-4 right-4">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md ${
                project.completionStatus === 'Completed'
                  ? 'bg-emerald-600/90 text-white'
                  : 'bg-amber-600/90 text-white'
              }`}
            >
              {project.completionStatus}
            </span>
          </div>
        </div>

        {/* Project Header Info */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {project.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Published {project.createdAt}
              </p>
            </div>

            {/* Like & links */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onLike?.(project.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                  project.userLiked
                    ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${project.userLiked ? 'fill-rose-500' : ''}`} />
                <span>{project.likesCount} Likes</span>
              </button>

              {project.demoUrl && (
                <PrimaryButton
                  size="sm"
                  onClick={() => alert(`Opening live demo: ${project.demoUrl}`)}
                  leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                >
                  Live Demo
                </PrimaryButton>
              )}
            </div>
          </div>

          {/* Creator Profile */}
          <div className="flex items-center gap-3 py-4 border-y border-slate-100 dark:border-slate-800">
            <img
              src={project.creator.avatar}
              alt={project.creator.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {project.creator.name}
              </p>
              <p className="text-xs text-slate-500">{project.creator.headline}</p>
            </div>
          </div>

          {/* Problem & Solution Breakdown */}
          <div className="space-y-6 pt-2">
            <div>
              <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1.5">
                The Problem & Background
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {project.problem}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5">
                The Architectural Solution
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {project.solution}
              </p>
            </div>

            {/* Skills & Technologies */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Technologies & Applied Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.skills.map((s) => (
                  <span
                    key={s}
                    className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Peer Feedback & Comments Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Peer Feedback & Reviews ({project.comments?.length || 0})
        </h3>

        {/* Existing comments */}
        <div className="space-y-3">
          {project.comments?.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <img
                  src={c.authorAvatar}
                  alt={c.authorName}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {c.authorName}
                </span>
                <span className="text-[10px] text-slate-400">• {c.createdAt}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 pl-8">
                {c.content}
              </p>
            </div>
          ))}
        </div>

        {/* Feedback composer */}
        <form onSubmit={handleSubmitComment} className="pt-2 space-y-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Leave constructive peer feedback or code review notes..."
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <div className="flex justify-end">
            <PrimaryButton
              type="submit"
              size="sm"
              leftIcon={<Send className="w-3.5 h-3.5" />}
              disabled={!commentText.trim()}
            >
              Post Feedback
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};
