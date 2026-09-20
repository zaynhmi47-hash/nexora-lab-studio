import type {
  OnboardingData,
  RegisterInput,
  User,
  UserRole,
} from '../../types';
import { mockCurrentUser } from '../../data/mock/users';

export type DemoPreset =
  | 'alexandria'
  | 'new_learner'
  | 'marcus_instructor';

export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  onboardingCompleted?: boolean;
}

export interface PasswordStrength {
  score: number;
  label: 'Very weak' | 'Weak' | 'Fair' | 'Strong' | 'Very strong';
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

const cloneUser = (user: User): User => ({
  ...user,
  skills: user.skills.map((skill) => ({ ...skill })),
});

const createDemoUser = (
  preset: DemoPreset,
): { user: User; onboardingCompleted: boolean } => {
  const base = cloneUser(mockCurrentUser);

  switch (preset) {
    case 'alexandria':
      return {
        user: {
          ...base,
          id: 'usr-demo-alexandria',
          name: 'Alexandria R.',
          email: 'alexandria@demo.dignity.app',
          avatarUrl:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
          headline: 'Full-Stack Developer & Dignity Learner',
          role: 'learner',
          learningLevel: 'Intermediate',
          learningStreakDays: 18,
          completedCoursesCount: 7,
          certificatesCount: 4,
          totalStudyHours: 126,
          dailyGoalMinutes: 45,
          dailyGoalProgressMinutes: 38,
          skills: [
            { name: 'JavaScript', level: 92 },
            { name: 'React', level: 88 },
            { name: 'Backend', level: 74 },
            { name: 'Database', level: 67 },
            { name: 'DevOps', level: 52 },
          ],
          bio: 'Returning learner focused on full-stack engineering and production-ready web systems.',
        },
        onboardingCompleted: true,
      };

    case 'new_learner':
      return {
        user: {
          ...base,
          id: 'usr-demo-new-learner',
          name: 'Taylor Chen',
          email: 'taylor.chen@demo.dignity.app',
          avatarUrl:
            'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&auto=format&fit=crop&q=80',
          headline: 'New Learner Exploring Software Engineering',
          role: 'learner',
          learningLevel: 'Beginner',
          learningStreakDays: 0,
          completedCoursesCount: 0,
          certificatesCount: 0,
          totalStudyHours: 0,
          dailyGoalMinutes: 30,
          dailyGoalProgressMinutes: 0,
          skills: [],
          bio: 'New to Dignity and preparing a personalized learning path.',
        },
        onboardingCompleted: false,
      };

    case 'marcus_instructor':
      return {
        user: {
          ...base,
          id: 'usr-demo-marcus-instructor',
          name: 'Dr. Marcus',
          email: 'marcus.vance@demo.dignity.app',
          avatarUrl:
            'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80',
          headline: 'Instructor · Systems Architecture & Engineering',
          role: 'instructor',
          learningLevel: 'Advanced',
          learningStreakDays: 24,
          completedCoursesCount: 18,
          certificatesCount: 9,
          totalStudyHours: 420,
          dailyGoalMinutes: 60,
          dailyGoalProgressMinutes: 54,
          skills: [
            { name: 'System Design', level: 98 },
            { name: 'Backend', level: 96 },
            { name: 'Cloud Architecture', level: 94 },
            { name: 'Distributed Systems', level: 97 },
            { name: 'DevOps', level: 91 },
          ],
          bio: 'Instructor focused on systems architecture, distributed systems, and practical engineering.',
        },
        onboardingCompleted: true,
      };
  }
};

const registeredUsers = new Map<string, User>();

export const evaluatePasswordStrength = (
  password: string,
): PasswordStrength => {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const score = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
  ].filter(Boolean).length;

  const labels: PasswordStrength['label'][] = [
    'Very weak',
    'Weak',
    'Fair',
    'Strong',
    'Very strong',
  ];

  return {
    score,
    label: labels[Math.min(score, labels.length - 1)],
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
  };
};

export const authService = {
  async login(input: LoginInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();

    if (!email || !input.password) {
      return {
        success: false,
        error: 'Email and password are required.',
      };
    }

    const registeredUser = registeredUsers.get(email);

    if (registeredUser) {
      return {
        success: true,
        user: cloneUser(registeredUser),
        onboardingCompleted: true,
      };
    }

    const demoUsers = [
      createDemoUser('alexandria'),
      createDemoUser('new_learner'),
      createDemoUser('marcus_instructor'),
    ];

    const demoMatch = demoUsers.find(
      ({ user }) => user.email.toLowerCase() === email,
    );

    if (demoMatch) {
      return {
        success: true,
        user: cloneUser(demoMatch.user),
        onboardingCompleted: demoMatch.onboardingCompleted,
      };
    }

    return {
      success: false,
      error: 'Invalid credentials. Use one of the demo accounts or register.',
    };
  },

  async register(input: RegisterInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();

    if (!input.name.trim()) {
      return {
        success: false,
        error: 'Name is required.',
      };
    }

    if (!email || !email.includes('@')) {
      return {
        success: false,
        error: 'Please enter a valid email address.',
      };
    }

    if (input.password.length < 8) {
      return {
        success: false,
        error: 'Password must contain at least 8 characters.',
      };
    }

    if (!input.termsAccepted) {
      return {
        success: false,
        error: 'You must accept the terms and conditions.',
      };
    }

    if (registeredUsers.has(email)) {
      return {
        success: false,
        error: 'An account with this email already exists.',
      };
    }

    const user: User = {
      id: `usr-local-${Date.now()}`,
      name: input.name.trim(),
      email,
      avatarUrl:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      headline:
        input.role === 'instructor'
          ? 'Dignity Instructor'
          : 'Dignity Learner',
      role: input.role,
      joinedDate: new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
      learningLevel: 'Beginner',
      learningStreakDays: 0,
      completedCoursesCount: 0,
      certificatesCount: 0,
      totalStudyHours: 0,
      dailyGoalMinutes: 30,
      dailyGoalProgressMinutes: 0,
      skills: [],
      bio: '',
    };

    registeredUsers.set(email, user);

    return {
      success: true,
      user: cloneUser(user),
      onboardingCompleted: false,
    };
  },

  async resetPassword(email: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return {
        success: false,
        error: 'Please enter a valid email address.',
      };
    }

    return {
      success: true,
    };
  },

  async demoLogin(preset: DemoPreset): Promise<AuthResult> {
    const demo = createDemoUser(preset);

    return {
      success: true,
      user: cloneUser(demo.user),
      onboardingCompleted: demo.onboardingCompleted,
    };
  },

  async completeOnboarding(
    user: User,
    data: OnboardingData,
  ): Promise<AuthResult> {
    const updatedUser: User = {
      ...cloneUser(user),
      learningLevel: data.experienceLevel,
      dailyGoalMinutes: data.dailyGoalMinutes,
      dailyGoalProgressMinutes: 0,
    };

    registeredUsers.set(updatedUser.email.toLowerCase(), updatedUser);

    return {
      success: true,
      user: updatedUser,
      onboardingCompleted: true,
    };
  },

  async getDemoUser(preset: DemoPreset): Promise<User> {
    return cloneUser(createDemoUser(preset).user);
  },

  getDefaultUser(): User {
    return cloneUser(mockCurrentUser);
  },

  isValidRole(role: string): role is UserRole {
    return [
      'learner',
      'instructor',
      'organization',
      'administrator',
    ].includes(role);
  },
};
