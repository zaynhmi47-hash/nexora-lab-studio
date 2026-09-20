import React from 'react';
import {
  X,
  LayoutDashboard,
  BookOpen,
  Users,
} from 'lucide-react';
import { Header } from '../navigation/Header';
import { SidebarNavigation } from '../navigation/SidebarNavigation';
import { BottomNavigation } from '../navigation/BottomNavigation';
import { useLayout, LayoutProvider } from '../../context/LayoutContext';
import { User, UserRole, NotificationItem, AppRoute } from '../../types';
import { mockCurrentUser, mockNotifications } from '../../data/mock';

export interface AppShellLayoutProps {
  children?: React.ReactNode;
  user?: User;
  currentRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  notifications?: NotificationItem[];
  onOpenDesignSystem?: () => void;
  onSearchClick?: () => void;
  onLogout?: () => void;
  onOpenOnboarding?: () => void;
  className?: string;
  hideSidebar?: boolean;
  hideHeader?: boolean;
  hideBottomNav?: boolean;
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
}

/**
 * Inner layout component that consumes the LayoutContext
 */
export const AppShellInner: React.FC<AppShellLayoutProps> = ({
  children,
  user = mockCurrentUser,
  currentRole = 'learner',
  onRoleChange,
  notifications = mockNotifications,
  onOpenDesignSystem,
  onSearchClick,
  onLogout,
  onOpenOnboarding,
  className = '',
  hideSidebar = false,
  hideHeader = false,
  hideBottomNav = false,
  headerSlot,
  footerSlot,
}) => {
  const {
    currentRoute,
    navigateTo,
    sidebarCollapsed,
    toggleSidebar,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    goToDashboard,
    goToCourses,
    goToCommunity,
  } = useLayout();

  return (
    <div
      className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors ${className}`}
      id="app-shell-root"
    >
      {/* 1. Top Header */}
      {!hideHeader && (
        headerSlot || (
          <Header
            user={user}
            currentRole={currentRole}
            onRoleChange={onRoleChange || (() => {})}
            onNavigate={(route: AppRoute, params?: any) => navigateTo(route, params)}
            notifications={notifications}
            onOpenDesignSystem={onOpenDesignSystem}
            onSearchClick={onSearchClick}
            onLogout={onLogout}
            onOpenOnboarding={onOpenOnboarding}
            onToggleSidebar={toggleSidebar}
          />
        )
      )}

      {/* 2. Core Feature Quick-Switch Strip (Optional persistent helper banner on desktop/tablet) */}
      <div className="bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200/60 dark:border-slate-800/60 px-4 py-1.5 hidden lg:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-2">
              Core Platform:
            </span>
            <button
              type="button"
              id="quick-nav-dashboard"
              onClick={goToDashboard}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 font-medium ${
                currentRoute === 'home'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              id="quick-nav-courses"
              onClick={goToCourses}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 font-medium ${
                currentRoute === 'learning' || currentRoute === 'explore'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Courses</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              id="quick-nav-community"
              onClick={goToCommunity}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 font-medium ${
                currentRoute === 'community'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Community</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 text-[11px]">
            <span>Active View: <strong className="text-slate-700 dark:text-slate-300 uppercase font-mono">{currentRoute}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace Body: Persistent Sidebar + View Canvas */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto min-h-0">
        {/* Desktop Persistent Sidebar */}
        {!hideSidebar && (
          <SidebarNavigation
            className="hidden md:flex"
            currentRole={currentRole}
            currentRoute={currentRoute}
            onNavigate={(route: AppRoute, params?: any) => navigateTo(route, params)}
            streakDays={user.learningStreakDays}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
          />
        )}

        {/* Mobile Drawer Sidebar Navigation */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-50 flex md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation drawer"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileSidebarOpen(false)}
            />

            {/* Drawer Content */}
            <div className="relative flex flex-col w-72 max-w-[80vw] bg-white dark:bg-slate-900 shadow-2xl z-10">
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    EP
                  </div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Navigation Menu
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Close navigation drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <SidebarNavigation
                  currentRole={currentRole}
                  currentRoute={currentRoute}
                  onNavigate={(route: AppRoute, params?: any) => {
                    navigateTo(route, params);
                    setMobileSidebarOpen(false);
                  }}
                  streakDays={user.learningStreakDays}
                  collapsed={false}
                />
              </div>
            </div>
          </div>
        )}

        {/* Primary Viewport Canvas */}
        <main
          className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-8 pb-20 md:pb-8 overflow-y-auto"
          id="main-app-content"
        >
          {children}
        </main>
      </div>

      {/* 4. Optional Footer Slot */}
      {footerSlot}

      {/* 5. Mobile Bottom Navigation */}
      {!hideBottomNav && (
        <BottomNavigation
          currentRoute={currentRoute}
          onNavigate={(route: AppRoute) => navigateTo(route)}
        />
      )}
    </div>
  );
};

/**
 * AppShell Layout Component
 * Automatically provides LayoutProvider if rendered standalone,
 * or attaches directly to an ancestor LayoutProvider.
 */
export const AppShell: React.FC<AppShellLayoutProps & { initialRoute?: AppRoute }> = (props) => {
  return (
    <LayoutProvider initialRoute={props.initialRoute || 'home'}>
      <AppShellInner {...props} />
    </LayoutProvider>
  );
};
