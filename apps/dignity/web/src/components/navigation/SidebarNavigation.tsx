import React from 'react';
import {
  Compass,
  BookOpen,
  Brain,
  Users,
  Award,
  User,
  LayoutDashboard,
  FileText,
  BarChart3,
  GraduationCap,
  ShieldCheck,
  KeyRound,
  ScrollText,
  Sparkles,
  Flame,
  FolderGit2,
  Briefcase,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AppRoute, UserRole } from '../../types';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  route?: AppRoute;
  badge?: string | number;
  section?: 'core' | 'workspace' | 'secondary';
}

export interface SidebarNavigationProps {
  currentRole: UserRole;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute, params?: any) => void;
  streakDays?: number;
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  currentRole,
  currentRoute,
  onNavigate,
  streakDays = 12,
  className = '',
  collapsed = false,
  onToggleCollapse,
}) => {
  // Core navigation items specifically spotlighting Dashboard, Courses, and Community
  const learnerCoreNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: 'home', section: 'core' },
    { id: 'courses', label: 'Courses', icon: BookOpen, route: 'learning', badge: '2 active', section: 'core' },
    { id: 'community', label: 'Community', icon: Users, route: 'community', section: 'core' },
  ];

  const learnerWorkspaceNav: NavItem[] = [
    { id: 'projects', label: 'Projects & Labs', icon: FolderGit2, route: 'projects', badge: 'New', section: 'workspace' },
    { id: 'portfolio', label: 'Portfolio Builder', icon: Briefcase, route: 'portfolio', section: 'workspace' },
    { id: 'ai-tutor', label: 'AI Tutor', icon: Sparkles, route: 'ai-tutor', badge: 'AI', section: 'workspace' },
    { id: 'practice', label: 'Practice & Labs', icon: Brain, route: 'practice', section: 'workspace' },
  ];

  const learnerSecondaryNav: NavItem[] = [
    { id: 'explore', label: 'Explore Catalog', icon: Compass, route: 'explore', section: 'secondary' },
    { id: 'certificates', label: 'Certificates', icon: Award, route: 'certificates', badge: '2', section: 'secondary' },
    { id: 'profile', label: 'Profile', icon: User, route: 'profile', section: 'secondary' },
  ];

  const instructorNav: NavItem[] = [
    { id: 'inst-dash', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inst-courses', label: 'Courses', icon: BookOpen, badge: '4' },
    { id: 'inst-students', label: 'Students', icon: Users },
    { id: 'inst-assign', label: 'Assignments', icon: FileText, badge: '12 new' },
    { id: 'inst-analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const orgNav: NavItem[] = [
    { id: 'org-dash', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'org-users', label: 'Users & Cohorts', icon: Users },
    { id: 'org-programs', label: 'Programs', icon: GraduationCap },
    { id: 'org-courses', label: 'Enterprise Library', icon: BookOpen },
    { id: 'org-analytics', label: 'Workforce Analytics', icon: BarChart3 },
  ];

  const adminNav: NavItem[] = [
    { id: 'adm-dash', label: 'System Dashboard', icon: LayoutDashboard },
    { id: 'adm-health', label: 'Security & Health', icon: ShieldCheck },
    { id: 'adm-users', label: 'Access Directory', icon: KeyRound },
    { id: 'adm-logs', label: 'Audit Logging', icon: ScrollText },
  ];

  const renderNavButton = (item: NavItem) => {
    const Icon = item.icon;
    const isLearner = currentRole === 'learner';
    const isActive = isLearner && item.route === currentRoute;

    return (
      <button
        key={item.id}
        type="button"
        id={`nav-${item.id}`}
        title={item.label}
        onClick={() => {
          if (item.route) {
            onNavigate(item.route);
          }
        }}
        className={`w-full flex items-center ${
          collapsed ? 'justify-center px-2 py-3' : 'justify-between px-3 py-2.5'
        } rounded-xl text-xs font-semibold transition-all duration-150 group relative ${
          isActive
            ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <div className={`flex items-center gap-3 min-w-0 ${collapsed ? 'justify-center' : ''}`}>
          <Icon
            className={`w-4 h-4 shrink-0 transition-colors ${
              isActive
                ? 'text-white'
                : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white'
            }`}
          />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </div>

        {!collapsed && item.badge && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ml-2 ${
              isActive
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {item.badge}
          </span>
        )}

        {/* Collapsed view indicator badge dot */}
        {collapsed && item.badge && (
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-900" />
        )}
      </button>
    );
  };

  return (
    <aside
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 flex flex-col justify-between shrink-0 p-3 sm:p-4 transition-all duration-200 ${className}`}
      aria-label="Main Sidebar Navigation"
      id="main-app-sidebar"
    >
      <div className="space-y-4 overflow-y-auto pr-0.5 scrollbar-thin">
        {/* Role identifier badge */}
        {!collapsed ? (
          <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-bold capitalize text-slate-800 dark:text-slate-200">
                {currentRole} Portal
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              v1.0
            </span>
          </div>
        ) : (
          <div className="flex justify-center pb-1">
            <div
              className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs"
              title={`${currentRole} Portal`}
            >
              {currentRole[0].toUpperCase()}
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        {currentRole === 'learner' ? (
          <div className="space-y-4">
            {/* 1. Core Platform Features */}
            <div>
              {!collapsed && (
                <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Core Features
                </div>
              )}
              <nav className="space-y-1" aria-label="Core Navigation">
                {learnerCoreNav.map(renderNavButton)}
              </nav>
            </div>

            {/* 2. Workspace & Practice */}
            <div>
              {!collapsed && (
                <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Build & Practice
                </div>
              )}
              <nav className="space-y-1" aria-label="Build & Practice">
                {learnerWorkspaceNav.map(renderNavButton)}
              </nav>
            </div>

            {/* 3. Explore & Growth */}
            <div>
              {!collapsed && (
                <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Catalog & Growth
                </div>
              )}
              <nav className="space-y-1" aria-label="Catalog & Growth">
                {learnerSecondaryNav.map(renderNavButton)}
              </nav>
            </div>
          </div>
        ) : (
          /* Other roles */
          <nav className="space-y-1">
            {(
              {
                instructor: instructorNav,
                organization: orgNav,
                administrator: adminNav,
              }[currentRole] || []
            ).map(renderNavButton)}
          </nav>
        )}
      </div>

      {/* Footer / Sidebar Controls */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3 shrink-0">
        {/* Streak highlight (learner role only) */}
        {currentRole === 'learner' && (
          collapsed ? (
            <div
              className="flex justify-center py-2"
              title={`${streakDays} Days Consistent streak`}
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {streakDays} Days Streak
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  Daily goal 71% met
                </div>
              </div>
            </div>
          )
        )}

        {/* Persistent Sidebar Collapse Toggle Button */}
        {onToggleCollapse && (
          <button
            type="button"
            id="btn-toggle-sidebar"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`w-full flex items-center ${
              collapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
            } rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors`}
          >
            {!collapsed && <span>Collapse Sidebar</span>}
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            )}
          </button>
        )}
      </div>
    </aside>
  );
};
