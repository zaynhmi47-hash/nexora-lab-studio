import type {
  AIContext,
  AIExplanationDepth,
  AIExplanationLevel,
  AIInsightType,
  AILanguage,
  AILearningInsight,
  AIMessage,
  AIRecommendation,
  AIStudyPlan,
  AIStudyPlanDay,
  AIStudyPlanItem,
  AIStudyPlanMilestone,
  AITutorSession,
} from '../../types/ai';

const DEFAULT_CONTEXT: AIContext = {
  userId: 'demo-user',
  learningGoal: 'Become a Full-Stack Developer',
  courseId: 'course-107',
  courseTitle: 'Modern React Development',
  moduleId: 'module-react-1',
  moduleTitle: 'React Fundamentals',
  lessonId: 'lesson-react-1',
  lessonTitle: 'Building Modern React Applications',
  skillIds: ['skill-react', 'skill-typescript', 'skill-web'],
  skillNames: ['React', 'TypeScript', 'Web Development'],
  currentMastery: 68,
  learningLevel: 'Intermediate',
  language: 'English',
  preferredExplanationStyle: 'normal',
  subjectDomain: 'programming',
  recentMistakes: [],
};

const DEFAULT_SESSION_ID = 'ai-session-default';

function createAssistantMessage(
  content: string,
  messageType: AIMessage['messageType'] = 'general',
  metadata?: AIMessage['metadata'],
): AIMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: 'assistant',
    content,
    messageType,
    timestamp: new Date().toISOString(),
    metadata,
  };
}

function createDefaultSession(): AITutorSession {
  return {
    id: DEFAULT_SESSION_ID,
    title: 'Full-Stack Learning Session',
    contextType: 'general',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const sessions: AITutorSession[] = [createDefaultSession()];

let activeSessionId = DEFAULT_SESSION_ID;
let context: AIContext = { ...DEFAULT_CONTEXT };
let explanationDepth: AIExplanationDepth = 'normal';
let language: AILanguage = 'English';

const insights: AILearningInsight[] = [
  {
    id: 'insight-1',
    type: 'skill_gain' as AIInsightType,
    title: 'Strong TypeScript Progress',
    description:
      'Your recent learning activity shows consistent progress with TypeScript fundamentals and typed React patterns.',
    metric: '+18% mastery',
    actionLabel: 'Practice TypeScript',
    actionRoute: 'practice',
  },
  {
    id: 'insight-2',
    type: 'habit' as AIInsightType,
    title: 'Consistent Study Habit',
    description:
      'Short, regular study sessions are helping you maintain learning momentum.',
    metric: '5 active days',
    actionLabel: 'View study plan',
    actionRoute: 'study-plan',
  },
];

const recommendations: AIRecommendation[] = [
  {
    id: 'recommendation-1',
    title: 'PostgreSQL Fundamentals',
    reason:
      'Database fundamentals are currently one of the larger gaps in your full-stack learning path.',
    skillGap: 'Database fundamentals',
    targetType: 'course',
    targetId: 'course-108',
    targetTitle: 'PostgreSQL Fundamentals',
    urgency: 'high',
    estimatedMinutes: 45,
  },
  {
    id: 'recommendation-2',
    title: 'React TypeScript Practice',
    reason:
      'Additional typed component practice can reinforce your recent React progress.',
    skillGap: 'Typed React patterns',
    targetType: 'practice',
    targetId: 'practice-react-typescript',
    targetTitle: 'React + TypeScript Practice',
    urgency: 'medium',
    estimatedMinutes: 20,
  },
];

function getActiveSessionInternal(): AITutorSession {
  const session = sessions.find((item) => item.id === activeSessionId);

  if (session) {
    return session;
  }

  const fallback = createDefaultSession();
  sessions.push(fallback);
  activeSessionId = fallback.id;
  return fallback;
}

function updateActiveSession(
  updater: (session: AITutorSession) => AITutorSession,
): AITutorSession {
  const index = sessions.findIndex((item) => item.id === activeSessionId);

  if (index === -1) {
    const fallback = createDefaultSession();
    sessions.push(fallback);
    activeSessionId = fallback.id;
    return fallback;
  }

  const updated = updater(sessions[index]);
  sessions[index] = updated;
  return updated;
}

function buildTutorResponse(prompt: string): string {
  const normalized = prompt.toLowerCase();

  if (
    normalized.includes('react') ||
    normalized.includes('component') ||
    normalized.includes('jsx')
  ) {
    return [
      'React works best when UI is divided into small, focused components.',
      '',
      'Start by identifying the state and data each component owns. Keep reusable components focused on one responsibility, then pass data through typed props.',
      '',
      'For TypeScript projects, define the component props explicitly. This gives you safer refactoring and clearer contracts between components.',
      '',
      'A useful next step is to build one small component and gradually extract reusable pieces when duplication appears.',
    ].join('\\n');
  }

  if (
    normalized.includes('typescript') ||
    normalized.includes('type') ||
    normalized.includes('interface')
  ) {
    return [
      'TypeScript helps make the contracts in your application explicit.',
      '',
      'For example, define the shape of data before passing it between components or services. This makes incorrect assumptions visible during development instead of waiting for runtime failures.',
      '',
      'A good learning exercise is to take one existing JavaScript object and model it with an interface or type.',
    ].join('\\n');
  }

  if (
    normalized.includes('database') ||
    normalized.includes('postgres') ||
    normalized.includes('sql')
  ) {
    return [
      'A relational database stores information in structured tables connected through relationships.',
      '',
      'When learning PostgreSQL, focus first on tables, primary keys, foreign keys, indexes, SELECT queries, INSERT/UPDATE/DELETE operations, and transactions.',
      '',
      'For a full-stack application, also pay attention to how your API maps domain objects to database records.',
    ].join('\\n');
  }

  return [
    `Let's work through "${prompt}" step by step.`,
    '',
    `Your current learning context is ${context.courseTitle ?? 'your learning path'}${context.lessonTitle ? `, specifically "${context.lessonTitle}"` : ''}.`,
    '',
    'Start with the smallest concrete example you can build, verify that it works, and then gradually add complexity.',
  ].join('\\n');
}

async function askTutor(prompt: string): Promise<AIMessage> {
  const trimmedPrompt = prompt.trim();

  const userMessage: AIMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: 'user',
    content: trimmedPrompt,
    messageType: 'general',
    timestamp: new Date().toISOString(),
    context: {
      courseId: context.courseId,
      courseTitle: context.courseTitle,
      lessonId: context.lessonId,
      lessonTitle: context.lessonTitle,
      skillIds: context.skillIds,
      skillNames: context.skillNames,
      currentMastery: context.currentMastery,
    },
  };

  const assistantMessage = createAssistantMessage(
    buildTutorResponse(trimmedPrompt),
    'general',
  );

  updateActiveSession((session) => ({
    ...session,
    messages: [...session.messages, userMessage, assistantMessage],
    updatedAt: new Date().toISOString(),
  }));

  return assistantMessage;
}

async function explainConcept(
  concept: string,
  level: AIExplanationLevel = 'beginner',
): Promise<AIMessage> {
  const explanation =
    level === 'advanced'
      ? `${concept} can be understood through its underlying abstractions, trade-offs, and implementation details. Start by identifying the core contract, then examine how state, data flow, and failure cases affect the implementation.`
      : level === 'intermediate'
        ? `${concept} becomes easier when you break it into its main parts and understand how those parts interact. Build a small example first, then compare it with the larger application.`
        : `${concept} means understanding the basic idea first, using a small example, and then gradually connecting it to the bigger application.`;

  const message = createAssistantMessage(explanation, 'explanation', {
    explanationLevel: level,
  });

  updateActiveSession((session) => ({
    ...session,
    messages: [...session.messages, message],
    updatedAt: new Date().toISOString(),
  }));

  return message;
}

async function generateExample(concept: string): Promise<AIMessage> {
  const message = createAssistantMessage(
    `Here's a simple way to practice ${concept}: choose one small real-world problem, define the expected input and output, implement the smallest working solution, and then add one improvement at a time.`,
    'practice',
  );

  updateActiveSession((session) => ({
    ...session,
    messages: [...session.messages, message],
    updatedAt: new Date().toISOString(),
  }));

  return message;
}

function createStudyPlanDay(
  date: string,
  dailyCommitmentMinutes: number,
): AIStudyPlanDay {
  const firstDuration = Math.min(30, dailyCommitmentMinutes);
  const secondDuration = Math.max(
    0,
    dailyCommitmentMinutes - firstDuration,
  );

  const items: AIStudyPlanItem[] = [
    {
      id: `study-${date}-lesson`,
      title: 'Review React and TypeScript fundamentals',
      durationMinutes: firstDuration,
      type: 'lesson',
      isCompleted: false,
      skillName: 'React',
      courseId: 'course-107',
      lessonId: 'lesson-react-1',
    },
  ];

  if (secondDuration > 0) {
    items.push({
      id: `study-${date}-practice`,
      title: 'Complete focused practice',
      durationMinutes: secondDuration,
      type: 'practice',
      isCompleted: false,
      skillName: 'TypeScript',
    });
  }

  return {
    date,
    totalMinutes: dailyCommitmentMinutes,
    items,
  };
}

async function generateStudyPlan(
  goal: string,
  minutes = 45,
): Promise<AIStudyPlan> {
  const dailyCommitmentMinutes = Math.max(15, Math.round(minutes));
  const today = new Date().toISOString().slice(0, 10);

  const todaySchedule = createStudyPlanDay(
    today,
    dailyCommitmentMinutes,
  );

  const weeklyMilestones: AIStudyPlanMilestone[] = [
    {
      weekNumber: 1,
      theme: 'Strengthen core foundations',
      status: 'in_progress',
      skills: ['React', 'TypeScript'],
      description:
        'Reinforce typed React components and fundamental web development patterns.',
    },
    {
      weekNumber: 2,
      theme: 'Build full-stack connections',
      status: 'upcoming',
      skills: ['API Development', 'Databases'],
      description:
        'Connect frontend concepts with API contracts and relational database fundamentals.',
    },
  ];

  const plan: AIStudyPlan = {
    id: `study-plan-${Date.now()}`,
    goal,
    dailyCommitmentMinutes,
    targetWeeks: 8,
    currentLevel: context.learningLevel,
    progressPercent: 0,
    todaySchedule,
    weeklyMilestones,
  };

  return plan;
}

export const aiTutorService = {
  getContext(): AIContext {
    return { ...context, skillIds: [...context.skillIds], skillNames: [...context.skillNames] };
  },

  setContext(nextContext: Partial<AIContext>) {
    context = {
      ...context,
      ...nextContext,
      skillIds: nextContext.skillIds
        ? [...nextContext.skillIds]
        : context.skillIds,
      skillNames: nextContext.skillNames
        ? [...nextContext.skillNames]
        : context.skillNames,
    };
  },

  getActiveSession(): AITutorSession {
    return getActiveSessionInternal();
  },

  getAllSessions(): AITutorSession[] {
    return sessions.map((session) => ({
      ...session,
      messages: [...session.messages],
    }));
  },

  setActiveSession(sessionId: string): AITutorSession | undefined {
    const session = sessions.find((item) => item.id === sessionId);

    if (session) {
      activeSessionId = sessionId;
    }

    return session;
  },

  createNewSession(
    title: string,
    contextType: AITutorSession['contextType'] = 'general',
  ): AITutorSession {
    const now = new Date().toISOString();

    const session: AITutorSession = {
      id: `ai-session-${Date.now()}`,
      title,
      contextType,
      messages: [],
      createdAt: now,
      updatedAt: now,
      courseId: context.courseId,
      courseTitle: context.courseTitle,
      lessonId: context.lessonId,
      lessonTitle: context.lessonTitle,
      skillId: context.skillIds[0],
      skillName: context.skillNames[0],
    };

    sessions.push(session);
    activeSessionId = session.id;

    return session;
  },

  clearActiveSessionMessages() {
    updateActiveSession((session) => ({
      ...session,
      messages: [],
      updatedAt: new Date().toISOString(),
    }));
  },

  getExplanationDepth(): AIExplanationDepth {
    return explanationDepth;
  },

  setExplanationDepth(depth: AIExplanationDepth) {
    explanationDepth = depth;
  },

  getLanguage(): AILanguage {
    return language;
  },

  setLanguage(nextLanguage: AILanguage) {
    language = nextLanguage;
  },

  getInsights(): AILearningInsight[] {
    return [...insights];
  },

  getRecommendations(): AIRecommendation[] {
    return [...recommendations];
  },

  async askTutor(prompt: string) {
    return askTutor(prompt);
  },

  async explainConcept(
    concept: string,
    level: AIExplanationLevel = 'beginner',
  ) {
    return explainConcept(concept, level);
  },

  async generateExample(concept: string) {
    return generateExample(concept);
  },

  async generateStudyPlan(goal: string, minutes = 45) {
    return generateStudyPlan(goal, minutes);
  },
};
