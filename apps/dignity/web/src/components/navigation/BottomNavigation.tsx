import React from 'react';
import { LayoutDashboard, BookOpen, Users, Brain, User } from 'lucide-react';
import { AppRoute } from '../../types';

export interface BottomNavigationProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  className?: string;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentRoute,
  onNavigate,
  className = '',
}) => {
  const items: { id: AppRoute; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'learning', label: 'Courses', icon: BookOpen },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'practice', label: 'Practice', icon: Brain },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 px-2 py-1 md:hidden transition-colors ${className}`}
      aria-label="Mobile Navigation Bar"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 min-h-[48px] rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
