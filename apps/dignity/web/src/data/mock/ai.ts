/**
 * Education Super Platform - AI Tutor Mock Data
 * Realistic curriculum-grounded data for programming, mathematics, English,
 * and business domains, conversation histories, study plans, and learning insights.
 */

import {
  AITutorSession,
  AILearningInsight,
  AIRecommendation,
  AIStudyPlan,
  AILearningSummary,
  AIContext,
} from '../../types/ai';

export const mockDefaultAIContext: AIContext = {
  userId: 'usr-learn-4029',
  learningGoal: 'Become a Full-Stack Developer',
  courseId: 'course-107',
  courseTitle: 'Modern React Development',
  moduleId: 'mod-react-2',
  moduleTitle: 'State Management & Architecture',
  lessonId: 'lesson-r8',
  lessonTitle: 'Building scalable application state',
  skillIds: ['skill-react-hooks', 'skill-js-async'],
  skillNames: ['React Custom Hooks', 'State Composition'],
  currentMastery: 76,
  learningLevel: 'Intermediate',
  language: 'en',
  preferredExplanationStyle: 'normal',
  subjectDomain: 'programming',
  recentMistakes: [
    {
      questionId: 'act-fn-params',
      questionText: 'What happens when a JavaScript function is called with fewer arguments than declared parameters?',
      userAnswer: 'It throws a ReferenceError immediately',
      correctAnswer: 'The missing parameters are assigned undefined',
      explanation: 'JavaScript is dynamically typed and tolerant of parameter arity. Unpassed parameters default to undefined unless default values are explicitly specified.',
      skillName: 'JavaScript Functions',
    },
  ],
  recentAssessmentResults: {
    assessmentId: 'exam-ts-arch-midterm',
    assessmentTitle: 'Frontend & Architecture Midterm Exam',
    scorePercent: 78,
    passed: true,
    weakSkills: ['Asynchronous State Synchronization', 'SQL Query Indexing'],
  },
};

export const mockAIInsights: AILearningInsight[] = [
  {
    id: 'ins-1',
    type: 'habit',
    title: 'Peak Focus Window',
    description: 'You achieve your highest quiz accuracy (92%) when studying between 7:00 PM and 9:00 PM.',
    metric: 'Evening Focus: +16% Accuracy',
    isPrototypeNote: true,
  },
  {
    id: 'ins-2',
    type: 'skill_gain',
    title: 'Rapid React Mastery',
    description: 'Your understanding of React State & Hooks accelerated by 14% over the past 7 days.',
    metric: 'Mastery: 62% → 76%',
    actionLabel: 'View Skill Graph',
    actionRoute: 'learning',
    isPrototypeNote: true,
  },
  {
    id: 'ins-3',
    type: 'retention',
    title: 'Spaced Repetition Edge',
    description: 'Completing a 3-minute warm-up practice before a new lesson doubled your long-term concept retention.',
    metric: 'Retention: 88%',
    actionLabel: 'Launch Quick Warm-up',
    actionRoute: 'practice',
    isPrototypeNote: true,
  },
];

export const mockAIRecommendations: AIRecommendation[] = [
  {
    id: 'rec-1',
    title: 'Reinforce Relational Indexing',
    reason: 'Your recent practice identified a foundational gap in compound B-Tree indexing and query optimization.',
    skillGap: 'Database fundamentals',
    targetType: 'course',
    targetId: 'course-108',
    targetTitle: 'PostgreSQL Fundamentals',
    urgency: 'high',
    estimatedMinutes: 25,
  },
  {
    id: 'rec-2',
    title: 'Practice Async/Await Error Handling',
    reason: 'You encountered 2 missed questions on unhandled promise rejections in your last lesson checkpoint.',
    skillGap: 'Async JavaScript',
    targetType: 'practice',
    targetId: 'practice-hub',
    targetTitle: 'Targeted Weak Skills Drill',
    urgency: 'medium',
    estimatedMinutes: 8,
  },
  {
    id: 'rec-3',
    title: 'Take REST API Design Quiz',
    reason: 'You have completed 3 lessons in backend architecture. Validating your knowledge now secures your streak.',
    skillGap: 'Backend Development',
    targetType: 'quiz',
    targetId: 'course-109',
    targetTitle: 'REST API Design & Contracts',
    urgency: 'low',
    estimatedMinutes: 12,
  },
];

export const mockStudyPlans: Record<string, AIStudyPlan> = {
  fullstack: {
    id: 'plan-fullstack-dev',
    goal: 'Become a Full-Stack Developer',
    dailyCommitmentMinutes: 60,
    targetWeeks: 12,
    currentLevel: 'Intermediate',
    progressPercent: 42,
    todaySchedule: {
      date: 'Today, Sept 8',
      totalMinutes: 60,
      items: [
        {
          id: 'sp-item-1',
          title: 'React Custom Hooks & State Composition',
          durationMinutes: 30,
          type: 'lesson',
          isCompleted: true,
          skillName: 'React State',
          courseId: 'course-107',
          lessonId: 'lesson-r8',
        },
        {
          id: 'sp-item-2',
          title: 'Async/Await & Optimistic UI Updates',
          durationMinutes: 20,
          type: 'practice',
          isCompleted: false,
          skillName: 'Async JavaScript',
        },
        {
          id: 'sp-item-3',
          title: 'PostgreSQL Indexing Diagnostic Quiz',
          durationMinutes: 10,
          type: 'quiz',
          isCompleted: false,
          skillName: 'Database Indexing',
          courseId: 'course-108',
        },
      ],
    },
    weeklyMilestones: [
      {
        weekNumber: 1,
        theme: 'Modern HTML5 & Responsive Semantic Design',
        status: 'completed',
        skills: ['HTML5', 'CSS Grid', 'Flexbox'],
        description: 'Completed foundational layout structuring and accessibility standards.',
      },
      {
        weekNumber: 2,
        theme: 'JavaScript & Asynchronous Event Loops',
        status: 'completed',
        skills: ['Closures', 'Promises', 'Event Loop'],
        description: 'Mastered async mechanics, microtasks, and object prototypes.',
      },
      {
        weekNumber: 3,
        theme: 'Modern React & Component Design Systems',
        status: 'in_progress',
        skills: ['React Hooks', 'Context', 'Render Optimization'],
        description: 'Currently advancing custom hooks, state synchronization, and component composition.',
      },
      {
        weekNumber: 4,
        theme: 'Backend Node.js & REST API Contracts',
        status: 'upcoming',
        skills: ['Express', 'REST Semantics', 'Middleware'],
        description: 'Build idempotent HTTP routes, request validation, and JWT security pipelines.',
      },
      {
        weekNumber: 5,
        theme: 'PostgreSQL & Relational Data Modeling',
        status: 'upcoming',
        skills: ['SQL Normalization', 'ACID Transactions', 'Indexing'],
        description: 'Design schemas, execute EXPLAIN ANALYZE, and optimize query latency.',
      },
      {
        weekNumber: 6,
        theme: 'Docker Containerization & Production CI/CD',
        status: 'upcoming',
        skills: ['Dockerfiles', 'Multi-Stage Builds', 'GitHub Actions'],
        description: 'Package apps into minimal non-root containers and automate build tests.',
      },
      {
        weekNumber: 7,
        theme: 'Full-Stack Capstone Architecture',
        status: 'upcoming',
        skills: ['End-to-End Integration', 'Performance Monitoring'],
        description: 'Deploy the complete production e-commerce web platform.',
      },
    ],
  },
};

export const mockLearningSummary: AILearningSummary = {
  date: 'Today, September 8, 2026',
  studyMinutesToday: 42,
  lessonsCompletedToday: 3,
  practiceQuestionsToday: 24,
  practiceAccuracyPercent: 86,
  skillsImproved: [
    { name: 'JavaScript Functions', gainPercent: 6, currentMastery: 88 },
    { name: 'React Custom Hooks', gainPercent: 5, currentMastery: 76 },
    { name: 'Async/Await Mechanics', gainPercent: 3, currentMastery: 58 },
  ],
  aiDiagnosticNote:
    'You made strong, consistent progress with React component state and JavaScript functional composition today. Your asynchronous error-handling accuracy still lags by 12%—we recommend a short 5-question diagnostic drill before starting your next module.',
  recommendedNextFocus: 'PostgreSQL Fundamentals & B-Tree Indexing',
};

export const mockAISessions: AITutorSession[] = [
  {
    id: 'session-react-state',
    title: 'React Custom Hooks & State Composition',
    createdAt: 'Today, 3:15 PM',
    updatedAt: 'Today, 3:45 PM',
    contextType: 'lesson',
    courseId: 'course-107',
    courseTitle: 'Modern React Development',
    lessonId: 'lesson-r8',
    lessonTitle: 'Building scalable application state',
    skillId: 'skill-react-hooks',
    skillName: 'React State Composition',
    messages: [
      {
        id: 'msg-init-1',
        role: 'assistant',
        content:
          "Hello Alex! I see you're working through **Building scalable application state** in **Modern React Development**. I can break down state composition, give you a real-world example, or quiz you on custom hook mechanics. What would you like to explore?",
        timestamp: '3:15 PM',
        messageType: 'general',
        context: {
          courseTitle: 'Modern React Development',
          lessonTitle: 'Building scalable application state',
          skillNames: ['React State Composition'],
          currentMastery: 76,
        },
        metadata: {
          actions: [
            { id: 'act-1', label: 'Explain this lesson', actionType: 'explain_deeper' },
            { id: 'act-2', label: 'Give me an example', actionType: 'give_example' },
            { id: 'act-3', label: 'Quiz me on this', actionType: 'quiz_me' },
            { id: 'act-4', label: 'Simplify this', actionType: 'simplify' },
          ],
        },
      },
      {
        id: 'msg-user-1',
        role: 'user',
        content: 'Can you explain the difference between lifting state up and using a custom hook?',
        timestamp: '3:18 PM',
        messageType: 'general',
      },
      {
        id: 'msg-assistant-1',
        role: 'assistant',
        content:
          'Great conceptual question! Here is how to think about them:\n\n### 1. Lifting State Up (Shared Data)\nWhen two sibling components need to share or synchronize the **same single piece of live data**, you hoist the state variable to their closest common ancestor. The parent owns the state, and passes values/setters downward as props.\n\n### 2. Custom Hooks (Reused Logic)\nA custom hook does **not** share data between components—instead, it shares **behavioral logic**. Every component that calls `useWindowWidth()` or `useFetch()` gets its own private, isolated copy of state.\n\n**Key Takeaway**: Use lifted state when components must coordinate on the *same data instance*. Use custom hooks when components need the *same workflow or state mechanics* independently.',
        timestamp: '3:18 PM',
        messageType: 'explanation',
        metadata: {
          explanationLevel: 'intermediate',
          actions: [
            { id: 'act-ex', label: 'Give me a code example', actionType: 'give_example' },
            { id: 'act-sim', label: 'Simplify to Beginner', actionType: 'simplify' },
            { id: 'act-quiz', label: 'Test my understanding', actionType: 'quiz_me' },
          ],
        },
      },
    ],
  },
  {
    id: 'session-async-review',
    title: 'Async/Await & Error Handling Review',
    createdAt: 'Yesterday, 6:30 PM',
    updatedAt: 'Yesterday, 7:10 PM',
    contextType: 'practice',
    skillId: 'skill-js-async',
    skillName: 'Async JavaScript',
    messages: [
      {
        id: 'msg-async-1',
        role: 'assistant',
        content:
          "Welcome back, Alex! In your last practice drill, unhandled promise rejections were a recurring bottleneck. Let's make sure try/catch blocks and async concurrency are second nature.",
        timestamp: '6:30 PM',
        messageType: 'practice',
        metadata: {
          actions: [
            { id: 'act-q', label: 'Practice with AI', actionType: 'practice_skill' },
            { id: 'act-hint', label: 'Give me a hint', actionType: 'explain_deeper' },
          ],
        },
      },
    ],
  },
  {
    id: 'session-study-plan',
    title: 'Full-Stack 90-Day Learning Plan',
    createdAt: 'Sept 5, 2026',
    updatedAt: 'Sept 5, 2026',
    contextType: 'study_plan',
    messages: [
      {
        id: 'msg-sp-1',
        role: 'assistant',
        content:
          "Here is your personalized roadmap to complete the Full-Stack Developer path in 12 weeks with 1 hour of daily deliberate practice. You're currently on track in Week 3.",
        timestamp: '10:00 AM',
        messageType: 'study_plan',
        metadata: {
          actions: [{ id: 'act-sp-view', label: 'Open Study Plan', actionType: 'view_study_plan' }],
        },
      },
    ],
  },
];
