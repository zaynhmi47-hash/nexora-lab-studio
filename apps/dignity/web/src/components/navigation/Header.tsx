import React, { useState } from 'react';
import {
  Bell,
  Moon,
  Sun,
  Search,
  BookOpen,
  Sparkles,
  Layers,
  ChevronDown,
  User as UserIcon,
  Check,
  LogOut,
  Sliders,
  Shield,
  Briefcase,
  FolderGit2,
  Menu,
} from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';
import { User, UserRole, NotificationItem } from '../../types';
import { IconButton } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Overlay';

export interface HeaderProps {
  user: User;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onNavigate: (route: any, params?: any) => void;
  notifications: NotificationItem[];
  onOpenDesignSystem?: () => void;
  onSearchClick?: () => void;
  onLogout?: () => void;
  onOpenOnboarding?: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentRole,
  onRoleChange,
  onNavigate,
  notifications,
  onOpenDesignSystem,
  onSearchClick,
  onLogout,
  onOpenOnboarding,
  onToggleSidebar,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const roleOptions: { role: UserRole; label: string; desc: string }[] = [
    { role: 'learner', label: 'Learner', desc: 'Active learning, practice & courses' },
    { role: 'instructor', label: 'Instructor', desc: 'Courses, students & assignments' },
    { role: 'organization', label: 'Organization', desc: 'Programs, cohorts & reporting' },
    { role: 'administrator', label: 'Administrator', desc: 'Platform policies & access' },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onToggleSidebar && (
              <button
                type="button"
                id="btn-header-sidebar-toggle"
                onClick={onToggleSidebar}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                title="Toggle Sidebar Navigation"
                aria-label="Toggle navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 group text-left focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  EduPulse
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    Proto
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight">
                  Education Ecosystem
                </span>
              </div>
            </button>
          </div>

          {/* Quick Search Bar (Tablet/Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <button
              type="button"
              onClick={onSearchClick || (() => onNavigate('explore'))}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <span>Search courses, learning paths, concepts...</span>
              </div>
              <kbd className="hidden lg:inline-block font-mono text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Design Tokens & System Inspector Trigger */}
            {onOpenDesignSystem && (
              <button
                onClick={onOpenDesignSystem}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200/80 dark:border-slate-700/80"
                title="Inspect Design System Tokens & Components"
              >
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Design System</span>
              </button>
            )}

            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60 hover:bg-blue-100 transition-colors"
                aria-haspopup="true"
                aria-expanded={showRoleMenu}
              >
                <span className="capitalize">{currentRole} View</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {showRoleMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowRoleMenu(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Architecture Role Preview
                    </div>
                    {roleOptions.map((opt) => (
                      <button
                        key={opt.role}
                        onClick={() => {
                          onRoleChange(opt.role);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-colors ${
                          currentRole === opt.role
                            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{opt.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                            {opt.desc}
                          </div>
                        </div>
                        {currentRole === opt.role && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Notifications Trigger */}
            <div className="relative">
              <IconButton
                size="sm"
                variant="ghost"
                ariaLabel="Notifications"
                onClick={() => setShowNotifications(true)}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
                )}
              </IconButton>
            </div>

            {/* Dark/Light Mode Toggle */}
            <IconButton
              size="sm"
              variant="ghost"
              ariaLabel={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </IconButton>

            {/* User Avatar with Profile & Auth Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-blue-500/20 transition-all focus:outline-none"
                aria-label="User account menu"
                aria-expanded={showUserMenu}
              >
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                  referrerPolicy="no-referrer"
                />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-1.5">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {user.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          {user.learningLevel} Level
                        </span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                          🔥 {user.learningStreakDays}d streak
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5 text-xs">
                      <button
                        onClick={() => {
                          onNavigate('profile');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left font-medium"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>View Learner Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          onNavigate('portfolio');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left font-medium"
                      >
                        <Briefcase className="w-4 h-4 text-blue-500" />
                        <span>Portfolio Builder</span>
                      </button>

                      <button
                        onClick={() => {
                          onNavigate('projects');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left font-medium"
                      >
                        <FolderGit2 className="w-4 h-4 text-indigo-500" />
                        <span>Projects &amp; Capstones</span>
                      </button>

                      {onOpenOnboarding && (
                        <button
                          onClick={() => {
                            onOpenOnboarding();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left font-medium"
                        >
                          <Sliders className="w-4 h-4 text-slate-400" />
                          <span>Curriculum & Goal Setup</span>
                        </button>
                      )}

                      {onLogout && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onLogout();
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left font-medium border-t border-slate-100 dark:border-slate-800 mt-1"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Modal */}
      <Modal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        title="Notifications"
        description="Updates regarding your courses, assignments, and achievements."
      >
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
          {notifications.map((item) => (
            <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3">
              <div
                className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                  item.read ? 'bg-transparent' : 'bg-blue-600'
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</h5>
                  <span className="text-[10px] text-slate-400 shrink-0">{item.timestamp}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {item.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
};
