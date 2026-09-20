import React, { useState } from 'react';
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  BookOpen,
  MessageSquare,
  Sparkles,
  Share2,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { StudyGroup, StudyGroupSession } from '../../../types/community';
import { PrimaryButton, SecondaryButton, GhostButton } from '../../../components/ui/Button';

export interface StudyGroupDetailViewProps {
  group: StudyGroup;
  onBack: () => void;
  onJoinToggle?: (id: string) => void;
  onOpenCourse?: (courseTitle: string) => void;
  onStartPractice?: (skillName: string) => void;
}

export const StudyGroupDetailView: React.FC<StudyGroupDetailViewProps> = ({
  group,
  onBack,
  onJoinToggle,
  onOpenCourse,
  onStartPractice,
}) => {
  const [activeTab, setActiveTab] = useState<'plan' | 'sessions' | 'discussions' | 'members'>('plan');
  const [sessions, setSessions] = useState<StudyGroupSession[]>(group.upcomingSessions);

  const toggleSessionAttend = (sessId: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessId ? { ...s, isAttending: !s.isAttending } : s))
    );
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Study Groups
      </button>

      {/* Group Hero Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="h-44 sm:h-52 w-full relative bg-slate-900">
          <img
            src={group.coverImage}
            alt={group.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-900/80 text-white backdrop-blur-md border border-white/20">
              {group.privacy === 'invite_only' ? 'Invite Only' : 'Public Study Circle'}
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/90 text-white backdrop-blur-md">
              🔥 {group.activityLevel} Activity
            </span>
          </div>

          <div className="absolute bottom-4 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                {group.skillName} • {group.courseTitle}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                {group.name}
              </h1>
            </div>

            <PrimaryButton
              size="sm"
              variant={group.isJoined ? 'subtle' : 'solid'}
              onClick={() => onJoinToggle?.(group.id)}
              className="shrink-0"
            >
              {group.isJoined ? 'Joined ✓' : 'Join Study Group'}
            </PrimaryButton>
          </div>
        </div>

        {/* Group Meta Row */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {group.memberCount} active learners
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Organized by:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {group.organizer.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500">Group Progress:</span>
            <span className="font-black text-blue-600 dark:text-blue-400">
              {group.progressPercent}%
            </span>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
            {group.description}
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="px-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('plan')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'plan'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Learning Plan Track
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'sessions'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Upcoming Sessions ({sessions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('discussions')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'discussions'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Discussions
          </button>
        </div>
      </div>

      {/* Tab: Learning Plan */}
      {activeTab === 'plan' && group.learningPlan && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {group.learningPlan.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {group.learningPlan.description}
              </p>
            </div>

            {group.courseTitle && onOpenCourse && (
              <SecondaryButton
                size="sm"
                onClick={() => onOpenCourse(group.courseTitle!)}
                leftIcon={<BookOpen className="w-3.5 h-3.5" />}
              >
                Open Course Syllabus
              </SecondaryButton>
            )}
          </div>

          <div className="space-y-2 mt-4">
            {group.learningPlan.items.map((item) => (
              <div
                key={item.day}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      item.isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.isCompleted ? '✓' : item.day}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Day {item.day}: {item.title}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Skill focus: {item.skill}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onStartPractice && (
                    <button
                      type="button"
                      onClick={() => onStartPractice(item.skill)}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                    >
                      Practice Drills →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Upcoming Sessions */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {sess.scheduledDate} ({sess.durationMinutes} min)
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {sess.title}
                </h3>
                <p className="text-xs text-slate-500">{sess.topic}</p>
                <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Host: {sess.hostName}</span>
                  <span>• {sess.attendeeCount} RSVPs</span>
                </div>
              </div>

              <PrimaryButton
                size="sm"
                variant={sess.isAttending ? 'subtle' : 'solid'}
                onClick={() => toggleSessionAttend(sess.id)}
                className="shrink-0"
              >
                {sess.isAttending ? 'Attending ✓' : 'RSVP to Session'}
              </PrimaryButton>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Discussions */}
      {activeTab === 'discussions' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Group Discussions
            </h3>
            <PrimaryButton size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Start Topic
            </PrimaryButton>
          </div>

          <div className="space-y-3">
            {group.recentDiscussions?.map((disc) => (
              <div
                key={disc.id}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {disc.title}
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Posted by {disc.author} • {disc.time}
                  </span>
                </div>
                <span className="text-slate-500 font-semibold shrink-0">
                  {disc.replies} replies
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
