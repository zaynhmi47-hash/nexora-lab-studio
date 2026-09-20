import React from 'react';
import { Bell, Sparkles, Flame, User as UserIcon } from 'lucide-react';
import { User, LearningGoal } from '../../../types';

export interface HomeHeaderProps {
  user: User;
  goal: LearningGoal;
  unreadNotificationsCount?: number;
  onNavigate: (route: string) => void;
  onOpenNotifications?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  user,
  goal,
  unreadNotificationsCount = 2,
  onNavigate,
  onOpenNotifications,
}) => {
  // Determine time-appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user.name ? user.name.split(' ')[0] : 'Learner';

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
      <div className="flex items-center gap-3.5">
        <button
          onClick={() => onNavigate('profile')}
          className="relative group focus:outline-none"
          aria-label="View learner profile"
        >
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500/20 group-hover:ring-blue-500 transition-all shadow-sm"
            referrerPolicy="no-referrer"
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {getGreeting()}, {firstName} <span className="inline-block animate-wave origin-bottom-right">👋</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Ready to continue your learning journey?
          </p>
        </div>
      </div>

      {/* Header Quick Badges / Actions */}
      <div className="flex items-center gap-2.5 self-start sm:self-center">
        {/* Streak Pill */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 text-xs font-bold shadow-2xs"
          title={`${goal.streakDays} Day Learning Streak`}
        >
          <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
          <span>{goal.streakDays} Day Streak</span>
        </div>

        {/* Level Tag */}
        <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{user.learningLevel}</span>
        </div>

        {/* Profile Shortcut */}
        <button
          onClick={() => onNavigate('profile')}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors"
          aria-label="Profile"
          title="Learner Profile"
        >
          <UserIcon className="w-4 h-4" />
        </button>

        {/* Notification button */}
        <button
          onClick={onOpenNotifications || (() => onNavigate('community'))}
          className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
              {unreadNotificationsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
