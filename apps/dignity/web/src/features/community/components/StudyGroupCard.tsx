import React from 'react';
import {
  Users,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { StudyGroup } from '../../../types/community';
import { PrimaryButton, SecondaryButton } from '../../../components/ui/Button';

export interface StudyGroupCardProps {
  group: StudyGroup;
  onSelect: (group: StudyGroup) => void;
  onJoinToggle?: (groupId: string) => void;
  onOpenLearningPlan?: (group: StudyGroup) => void;
}

export const StudyGroupCard: React.FC<StudyGroupCardProps> = ({
  group,
  onSelect,
  onJoinToggle,
  onOpenLearningPlan,
}) => {
  const nextSession = group.upcomingSessions[0];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/40 rounded-2xl overflow-hidden transition-all shadow-xs hover:shadow-md flex flex-col">
      {/* Cover Image & Badges */}
      <div className="h-32 w-full relative overflow-hidden bg-slate-800">
        <img
          src={group.coverImage}
          alt={group.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-md border border-white/20">
            {group.privacy === 'invite_only' ? 'Invite Only' : 'Public Group'}
          </span>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md ${
              group.activityLevel === 'High'
                ? 'bg-emerald-500/80 text-white'
                : 'bg-amber-500/80 text-white'
            }`}
          >
            🔥 {group.activityLevel} Activity
          </span>
        </div>

        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-1.5 font-semibold">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {group.memberCount} {group.maxMembers ? `/ ${group.maxMembers}` : ''} members
            </span>
          </div>

          <span className="text-[11px] text-slate-300 font-medium truncate max-w-[140px]">
            Lead: {group.organizer.name}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight">
              {group.skillName}
            </span>
            {group.courseTitle && (
              <span className="text-[11px] text-slate-400 truncate">• {group.courseTitle}</span>
            )}
          </div>

          <h3
            onClick={() => onSelect(group)}
            className="text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors cursor-pointer"
          >
            {group.name}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {group.description}
          </p>
        </div>

        {/* Learning plan link / progress */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Study Group Progress
            </span>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
              {group.progressPercent}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${group.progressPercent}%` }}
            />
          </div>

          {nextSession && (
            <div className="flex items-start gap-1.5 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-semibold text-slate-900 dark:text-white">Next Lab: </span>
                <span className="truncate">{nextSession.title}</span>
                <p className="text-[10px] text-slate-400">{nextSession.scheduledDate}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <SecondaryButton
            size="sm"
            onClick={() => onSelect(group)}
            className="flex-1 text-xs"
          >
            View Group
          </SecondaryButton>

          <PrimaryButton
            size="sm"
            variant={group.isJoined ? 'subtle' : 'solid'}
            onClick={() => onJoinToggle?.(group.id)}
            className="flex-1 text-xs"
          >
            {group.isJoined ? 'Joined ✓' : 'Join Group'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};
