import { User, LearningGoal } from '../../types';

export const mockCurrentUser: User = {
  id: 'usr-learn-4029',
  name: 'Alex Rivera',
  email: 'alex.rivera@eduplatform.io',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  headline: 'Aspiring Full-Stack Developer & Modern Web Specialist',
  role: 'learner',
  joinedDate: 'September 2024',
  learningLevel: 'Intermediate',
  learningStreakDays: 12,
  completedCoursesCount: 3,
  certificatesCount: 2,
  totalStudyHours: 48,
  dailyGoalMinutes: 45,
  dailyGoalProgressMinutes: 32,
  skills: [
    { name: 'JavaScript', level: 88 },
    { name: 'React', level: 76 },
    { name: 'Backend', level: 58 },
    { name: 'Database', level: 46 },
    { name: 'DevOps', level: 28 },
  ],
  bio: 'Learning full-stack engineering with a focus on modern React, scalable backend architectures, and database performance.',
};

export const mockLearningGoal: LearningGoal = {
  targetMinutes: 45,
  completedMinutes: 32,
  streakDays: 12,
  streakExtendedToday: true,
  weeklyHistory: [
    { day: 'Mon', minutes: 50, completed: true },
    { day: 'Tue', minutes: 45, completed: true },
    { day: 'Wed', minutes: 60, completed: true },
    { day: 'Thu', minutes: 40, completed: true },
    { day: 'Fri', minutes: 55, completed: true },
    { day: 'Sat', minutes: 35, completed: false },
    { day: 'Sun', minutes: 32, completed: true }, // today
  ],
};
