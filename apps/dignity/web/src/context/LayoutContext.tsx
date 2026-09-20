import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { AppRoute } from '../types';

export type CoreFeatureView = 'dashboard' | 'courses' | 'community';

export interface LayoutContextType {
  /** The currently active view identifier (supports core feature aliases or full AppRoute) */
  activeView: AppRoute | CoreFeatureView;
  /** Primary function to change active view */
  setActiveView: (view: AppRoute | CoreFeatureView, params?: any) => void;
  /** Direct access to the current AppRoute */
  currentRoute: AppRoute;
  /** Navigation helper with optional parameters */
  navigateTo: (route: AppRoute, params?: any) => void;
  /** Current navigation parameters (e.g. courseId, projectId, active tab) */
  routeParams: any;
  /** State for persistent desktop sidebar collapse */
  sidebarCollapsed: boolean;
  /** Toggle desktop sidebar collapsed/expanded */
  toggleSidebar: () => void;
  /** Set explicit desktop sidebar collapsed state */
  setSidebarCollapsed: (collapsed: boolean) => void;
  /** Mobile responsive sidebar drawer visibility */
  mobileSidebarOpen: boolean;
  /** Toggle mobile drawer */
  toggleMobileSidebar: () => void;
  /** Set explicit mobile drawer state */
  setMobileSidebarOpen: (open: boolean) => void;
  /** Check if a given view or route is currently active */
  isViewActive: (view: string) => boolean;
  /** Quick shortcuts for the 3 core features */
  goToDashboard: () => void;
  goToCourses: () => void;
  goToCommunity: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export interface LayoutProviderProps {
  children: ReactNode;
  initialRoute?: AppRoute;
  onRouteChange?: (route: AppRoute, params?: any) => void;
}

/**
 * Normalizes view alias to matching AppRoute
 */
export function normalizeViewToRoute(view: AppRoute | CoreFeatureView | string): AppRoute {
  switch (view) {
    case 'dashboard':
      return 'home';
    case 'courses':
      return 'learning';
    case 'community':
      return 'community';
    default:
      return (view as AppRoute) || 'home';
  }
}

/**
 * Normalizes AppRoute to primary core view name if applicable
 */
export function normalizeRouteToView(route: AppRoute): string {
  switch (route) {
    case 'home':
      return 'dashboard';
    case 'learning':
      return 'courses';
    case 'community':
      return 'community';
    default:
      return route;
  }
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({
  children,
  initialRoute = 'home',
  onRouteChange,
}) => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(initialRoute);
  const [routeParams, setRouteParams] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('edupulse_sidebar_collapsed') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Sync initialRoute if prop changes
  useEffect(() => {
    if (initialRoute && initialRoute !== currentRoute) {
      setCurrentRoute(initialRoute);
    }
  }, [initialRoute]);

  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    try {
      localStorage.setItem('edupulse_sidebar_collapsed', String(collapsed));
    } catch {
      // Ignore localStorage errors
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen((prev) => !prev);
  };

  const navigateTo = (route: AppRoute, params?: any) => {
    setCurrentRoute(route);
    setRouteParams(params || null);
    setMobileSidebarOpen(false); // Close mobile drawer upon navigation
    if (onRouteChange) {
      onRouteChange(route, params);
    }
  };

  const setActiveView = (view: AppRoute | CoreFeatureView, params?: any) => {
    const route = normalizeViewToRoute(view);
    navigateTo(route, params);
  };

  const isViewActive = (view: string): boolean => {
    if (view === 'dashboard') return currentRoute === 'home';
    if (view === 'courses') return currentRoute === 'learning' || currentRoute === 'explore';
    if (view === 'community') return currentRoute === 'community';
    return currentRoute === view;
  };

  const goToDashboard = () => setActiveView('dashboard');
  const goToCourses = () => setActiveView('courses');
  const goToCommunity = () => setActiveView('community');

  const value = useMemo<LayoutContextType>(
    () => ({
      activeView: currentRoute,
      setActiveView,
      currentRoute,
      navigateTo,
      routeParams,
      sidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed,
      mobileSidebarOpen,
      toggleMobileSidebar,
      setMobileSidebarOpen,
      isViewActive,
      goToDashboard,
      goToCourses,
      goToCommunity,
    }),
    [currentRoute, routeParams, sidebarCollapsed, mobileSidebarOpen]
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};

export const useLayout = (): LayoutContextType => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
