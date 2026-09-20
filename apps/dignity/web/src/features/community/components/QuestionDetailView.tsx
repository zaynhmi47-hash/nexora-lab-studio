import React, { useState } from 'react';
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  Bookmark,
  Share2,
  Flag,
  Send,
  Code2,
  GraduationCap,
  Award,
  BookOpen,
  Check,
} from 'lucide-react';
import { CommunityPost, CommunityAnswer } from '../../../types/community';
import { PrimaryButton, SecondaryButton, GhostButton } from '../../../components/ui/Button';

export interface QuestionDetailViewProps {
  question: CommunityPost;
  onBack: () => void;
  onPracticeConcept?: (skillName: string, courseTitle?: string) => void;
  onAskAITutor?: (question: CommunityPost, customPrompt?: string) => void;
  onVoteQuestion?: (id: string, direction: 'up') => void;
  onVoteAnswer?: (answerId: string, direction: 'up') => void;
  onMarkHelpful?: (answerId: string) => void;
  onAcceptAnswer?: (questionId: string, answerId: string) => void;
  onAddAnswer?: (questionId: string, content: string, codeSnippet?: string) => void;
  onReport?: (targetType: 'post' | 'answer', targetId: string) => void;
}

export const QuestionDetailView: React.FC<QuestionDetailViewProps> = ({
  question,
  onBack,
  onPracticeConcept,
  onAskAITutor,
  onVoteQuestion,
  onVoteAnswer,
  onMarkHelpful,
  onAcceptAnswer,
  onAddAnswer,
  onReport,
}) => {
  const [answerText, setAnswerText] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim()) return;
    onAddAnswer?.(question.id, answerText.trim(), codeSnippet.trim() || undefined);
    setAnswerText('');
    setCodeSnippet('');
    setShowCodeInput(false);
  };

  const handleShare = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Community
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
            onClick={() => onReport?.('post', question.id)}
            leftIcon={<Flag className="w-3.5 h-3.5 text-slate-400" />}
          >
            Report
          </GhostButton>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
        {/* Header Tags & Metadata */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {question.isSolved && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Solved
            </span>
          )}

          {question.difficulty && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              {question.difficulty}
            </span>
          )}

          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
            {question.communityName}
          </span>

          {question.skillName && (
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 rounded-md">
              Skill: {question.skillName}
            </span>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
          {question.title}
        </h1>

        {/* Author info */}
        <div className="flex items-center gap-3 mt-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <img
            src={question.authorAvatar}
            alt={question.authorName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
            referrerPolicy="no-referrer"
          />
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {question.authorName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {question.authorHeadline} • Asked {question.createdAt}
            </p>
          </div>
        </div>

        {/* Content body */}
        <div className="mt-5 text-sm sm:text-base text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
          {question.content}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          {question.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Connected Cross-System Action Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onVoteQuestion?.(question.id, 'up')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                question.userVote === 'up'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Upvote ({question.upvotes})</span>
            </button>
          </div>

          {/* Deep-link Action buttons to Practice Engine & AI Tutor */}
          <div className="flex flex-wrap items-center gap-2">
            {question.skillName && onPracticeConcept && (
              <PrimaryButton
                size="sm"
                onClick={() => onPracticeConcept(question.skillName!, question.courseTitle)}
                leftIcon={<Code2 className="w-3.5 h-3.5 text-emerald-300" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-xs"
              >
                Practice this concept
              </PrimaryButton>
            )}

            {onAskAITutor && (
              <SecondaryButton
                size="sm"
                onClick={() =>
                  onAskAITutor(
                    question,
                    `Please explain the core concepts behind this question: "${question.title}", and break down the best approach step-by-step.`
                  )
                }
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                className="text-xs"
              >
                Ask AI Tutor to Explain
              </SecondaryButton>
            )}
          </div>
        </div>
      </div>

      {/* Answers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            {question.answers?.length || 0} Answers
          </h2>
          <span className="text-xs text-slate-500">Sorted by best answers</span>
        </div>

        {/* List of answers */}
        {question.answers?.map((ans) => {
          const isInstructor = ans.isInstructorAnswer || ans.authorRole === 'instructor';
          const isMentor = ans.authorRole === 'mentor';

          return (
            <div
              key={ans.id}
              className={`rounded-2xl p-6 transition-all ${
                ans.isAccepted
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-emerald-400 dark:border-emerald-600/50'
                  : isInstructor
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border border-amber-300/40 dark:border-amber-700/40'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Accepted / Instructor Badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {ans.isAccepted && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Accepted Answer
                    </span>
                  )}

                  {isInstructor && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300/40">
                      <GraduationCap className="w-3.5 h-3.5" />
                      INSTRUCTOR ANSWER
                    </span>
                  )}

                  {isMentor && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300/40">
                      <Award className="w-3.5 h-3.5" />
                      MENTOR
                    </span>
                  )}
                </div>

                <GhostButton
                  size="sm"
                  onClick={() => onReport?.('answer', ans.id)}
                  leftIcon={<Flag className="w-3 h-3 text-slate-400" />}
                >
                  Report
                </GhostButton>
              </div>

              {/* Author Row */}
              <div className="flex items-center gap-3">
                <img
                  src={ans.authorAvatar}
                  alt={ans.authorName}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {ans.authorName}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {ans.authorHeadline} • {ans.createdAt}
                  </p>
                </div>
              </div>

              {/* Answer Content */}
              <div className="mt-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {ans.content}
              </div>

              {/* Optional Code Snippet */}
              {ans.codeSnippet && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto">
                  <code>{ans.codeSnippet}</code>
                </div>
              )}

              {/* Answer Footer Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onVoteAnswer?.(ans.id, 'up')}
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md transition-colors ${
                      ans.userVote === 'up'
                        ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/50'
                        : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{ans.upvotes}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onMarkHelpful?.(ans.id)}
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                      ans.userMarkedHelpful
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Helpful ({ans.helpfulCount})</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {!ans.isAccepted && (
                    <button
                      type="button"
                      onClick={() => onAcceptAnswer?.(question.id, ans.id)}
                      className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors"
                    >
                      Accept as best answer
                    </button>
                  )}

                  {onAskAITutor && (
                    <button
                      type="button"
                      onClick={() =>
                        onAskAITutor(
                          question,
                          `Can you explain this answer by ${ans.authorName}: "${ans.content}" and give another concrete example?`
                        )
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 dark:text-purple-300 hover:underline"
                    >
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      Explain answer with AI
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Answer Composer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
          Your Answer
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Provide detailed code reasoning or mental models to help your fellow learners.
        </p>

        <form onSubmit={handleSubmitAnswer} className="space-y-3">
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Explain the solution clearly..."
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            required
          />

          {showCodeInput ? (
            <textarea
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              placeholder="Paste optional SQL/JavaScript snippet..."
              rows={3}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 text-emerald-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowCodeInput(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600"
            >
              <Code2 className="w-3.5 h-3.5" />
              + Add code snippet
            </button>
          )}

          <div className="flex justify-end pt-2">
            <PrimaryButton
              type="submit"
              size="sm"
              leftIcon={<Send className="w-3.5 h-3.5" />}
              disabled={!answerText.trim()}
            >
              Post Answer
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};
