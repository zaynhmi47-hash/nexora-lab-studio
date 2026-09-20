import React from 'react';
import {
  HelpCircle,
  CheckCircle2,
  MessageSquare,
  ThumbsUp,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Award,
  BookOpen,
  Code2,
} from 'lucide-react';
import { CommunityPost } from '../../../types/community';
import { Badge } from '../../../components/ui/Badge';
import { GhostButton, SecondaryButton } from '../../../components/ui/Button';

export interface QuestionCardProps {
  question: CommunityPost;
  onSelect: (question: CommunityPost) => void;
  onPracticeConcept?: (skillName: string, courseTitle?: string) => void;
  onAskAITutor?: (question: CommunityPost) => void;
  onVote?: (questionId: string, direction: 'up') => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onSelect,
  onPracticeConcept,
  onAskAITutor,
  onVote,
}) => {
  const isInstructor = question.authorRole === 'instructor' || question.hasInstructorAnswer;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 rounded-2xl p-4 sm:p-5 transition-all shadow-xs hover:shadow-md group">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Vote pill */}
        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 shrink-0 min-w-[44px]">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onVote?.(question.id, 'up');
            }}
            className={`p-1 rounded-lg transition-colors ${
              question.userVote === 'up'
                ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/40'
                : 'text-slate-400 hover:text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Upvote this question"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 my-0.5">
            {question.upvotes}
          </span>
          <span className="text-[10px] text-slate-400">votes</span>
        </div>

        {/* Content body */}
        <div className="flex-1 min-w-0">
          {/* Metadata badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {question.isSolved && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
                <CheckCircle2 className="w-3 h-3" />
                Solved
              </span>
            )}

            {isInstructor && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40">
                <GraduationCap className="w-3 h-3" />
                Instructor Answered
              </span>
            )}

            {question.difficulty && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  question.difficulty === 'Beginner'
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : question.difficulty === 'Intermediate'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                }`}
              >
                {question.difficulty}
              </span>
            )}

            {question.skillName && (
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                🎯 {question.skillName}
              </span>
            )}
          </div>

          {/* Question Title */}
          <h3
            onClick={() => onSelect(question)}
            className="text-base sm:text-lg font-bold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-snug"
          >
            {question.title}
          </h3>

          {/* Short preview */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {question.summary || question.content}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {question.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Footer actions and author row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            {/* Author info */}
            <div className="flex items-center gap-2">
              <img
                src={question.authorAvatar}
                alt={question.authorName}
                className="w-5 h-5 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {question.authorName}
              </span>
              <span className="text-[11px] text-slate-400">• {question.createdAt}</span>
            </div>

            {/* Cross-system action buttons */}
            <div className="flex items-center gap-2">
              {/* Practice this concept button (Integration with Step 6 Practice Engine) */}
              {question.skillName && onPracticeConcept && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPracticeConcept(question.skillName!, question.courseTitle);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 transition-colors"
                  title="Practice questions related to this concept in the Practice Engine"
                >
                  <Code2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Practice concept
                </button>
              )}

              {/* Ask AI Tutor (Integration with Step 7 AI Tutor) */}
              {onAskAITutor && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAskAITutor(question);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 transition-colors"
                  title="Ask AI Tutor to explain this question"
                >
                  <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  Ask AI Tutor
                </button>
              )}

              <button
                type="button"
                onClick={() => onSelect(question)}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline ml-1"
              >
                <MessageSquare className="w-3 h-3" />
                {question.repliesCount || 0} answers
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
