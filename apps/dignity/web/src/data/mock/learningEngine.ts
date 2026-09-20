/**
 * Universal Gamified & Adaptive Learning Engine - Mock Datasets
 * Centralized, realistic, multi-domain learning data.
 * Ready for future Django REST Framework serializer & PostgreSQL migration.
 */

import {
  Activity,
  EngineLesson,
  EngineLearningPath,
  EngineLearningPathNode,
  SkillMastery,
  UserLearningProfile,
  DailyMissionItem,
  ReviewItem,
  PracticeSession,
  Challenge,
  AdaptiveInsight,
} from '../../types/learningEngine';

// ============================================================================
// 1. Universal Activities (Programming, Language, Math, Science, Business)
// ============================================================================

export const mockProgrammingActivities: Activity[] = [
  // 1. Multiple Choice
  {
    id: 'act-prog-mc-1',
    type: 'multiple_choice',
    title: 'Core Concept',
    question: 'What is the primary benefit of declaring a function in JavaScript?',
    instructions: 'Select the single best architectural answer.',
    options: [
      'It immediately executes asynchronous network requests.',
      'It encapsulates reusable logic into a named, invokable block.',
      'It increases memory consumption by duplicating variables.',
      'It forces the browser to re-render the HTML DOM tree.',
    ],
    correctAnswer: 1, // 0-indexed: "It encapsulates reusable logic into a named, invokable block."
    explanation:
      'Functions are first-class building blocks in JavaScript that group instructions together so you can reuse them anywhere without repeating code.',
    hint: 'Think about DRY (Don’t Repeat Yourself) programming principles.',
    skillId: 'skill-js-func',
    skillName: 'JavaScript Functions',
    difficulty: 'beginner',
    xpReward: 15,
    domain: 'programming',
  },

  // 2. Code Completion
  {
    id: 'act-prog-code-1',
    type: 'code_completion',
    title: 'Code Completion',
    question: 'Complete the arrow function syntax to double the given number:',
    instructions: 'Choose the correct syntax token to complete the parameter and arrow return.',
    codeSnippet: 'const double = (x) ___ x * 2;',
    options: ['=>', '->', ':=', 'function'],
    correctAnswer: '=>',
    explanation: 'Arrow functions use the fat arrow `=>` operator to bind concise expressions with implicit return.',
    hint: 'JavaScript arrow functions use the equals sign followed by greater-than.',
    skillId: 'skill-js-func',
    skillName: 'JavaScript Functions',
    difficulty: 'beginner',
    xpReward: 20,
    domain: 'programming',
  },

  // 3. True / False
  {
    id: 'act-prog-tf-1',
    type: 'true_false',
    title: 'Scope Concept',
    question: 'Variables declared with `const` cannot be reassigned to a new value.',
    instructions: 'Evaluate if this statement is True or False.',
    options: ['True', 'False'],
    correctAnswer: 'True',
    explanation:
      'Correct! `const` prevents variable re-assignment. Note that internal properties of a `const` object or array can still be mutated.',
    hint: 'Think about whether `const` stands for constant identifier.',
    skillId: 'skill-js-var',
    skillName: 'Variables & Scope',
    difficulty: 'beginner',
    xpReward: 10,
    domain: 'programming',
  },

  // 4. Fill in the Blank
  {
    id: 'act-prog-blank-1',
    type: 'fill_blank',
    title: 'Syntax Fill-in',
    question: 'To handle asynchronous errors in JavaScript, place risky operations inside a ___ block and catch them with a ___ block.',
    instructions: 'Select the missing keywords in order.',
    blankSegments: [
      { text: 'To handle asynchronous errors, place risky operations inside a ', isBlank: false },
      { text: 'try', isBlank: true, expected: 'try', options: ['try', 'catch', 'defer', 'async'] },
      { text: ' block and catch them with a ', isBlank: false },
      { text: 'catch', isBlank: true, expected: 'catch', options: ['catch', 'finally', 'resolve', 'reject'] },
      { text: ' block.', isBlank: false },
    ],
    correctAnswer: ['try', 'catch'],
    explanation: '`try...catch` blocks catch runtime exceptions gracefully without terminating the JavaScript event loop.',
    hint: 'The pair begins with "try".',
    skillId: 'skill-js-async',
    skillName: 'Async/Await & Promises',
    difficulty: 'intermediate',
    xpReward: 20,
    domain: 'programming',
  },

  // 5. Matching Concepts
  {
    id: 'act-prog-match-1',
    type: 'matching',
    title: 'Match Definitions',
    question: 'Match each JavaScript keyword to its accurate architectural definition:',
    instructions: 'Tap an item on the left, then tap its matching definition on the right.',
    matchingPairs: [
      { id: 'p1', left: '`async`', right: 'Marks a function as returning a Promise' },
      { id: 'p2', left: '`await`', right: 'Pauses execution until a Promise settles' },
      { id: 'p3', left: '`return`', right: 'Outputs a value and terminates the function' },
      { id: 'p4', left: '`yield`', right: 'Pauses a generator function execution' },
    ],
    correctAnswer: {
      '`async`': 'Marks a function as returning a Promise',
      '`await`': 'Pauses execution until a Promise settles',
      '`return`': 'Outputs a value and terminates the function',
      '`yield`': 'Pauses a generator function execution',
    },
    explanation: 'Asynchronous keywords (`async`/`await`) build upon JavaScript promises to write synchronous-looking async logic.',
    skillId: 'skill-js-async',
    skillName: 'Async/Await & Promises',
    difficulty: 'intermediate',
    xpReward: 25,
    domain: 'programming',
  },

  // 6. Ordering
  {
    id: 'act-prog-order-1',
    type: 'ordering',
    title: 'Execution Order',
    question: 'Order the execution steps of a standard asynchronous fetch request:',
    instructions: 'Arrange the sequence from first step to final step.',
    orderingItems: [
      { id: 'o1', text: 'Call fetch(apiEndpoint)', correctOrder: 1 },
      { id: 'o2', text: 'Await network HTTP response headers', correctOrder: 2 },
      { id: 'o3', text: 'Parse response payload via response.json()', correctOrder: 3 },
      { id: 'o4', text: 'Render data into UI state or components', correctOrder: 4 },
    ],
    correctAnswer: ['o1', 'o2', 'o3', 'o4'],
    explanation: 'Fetch requests dispatch the network transport first, await headers, extract the serialized body stream, and update application state.',
    skillId: 'skill-js-api',
    skillName: 'REST & Fetch APIs',
    difficulty: 'intermediate',
    xpReward: 20,
    domain: 'programming',
  },

  // 7. Debugging
  {
    id: 'act-prog-debug-1',
    type: 'debugging',
    title: 'Find the Bug',
    question: 'Identify which line in this function causes an infinite loop:',
    instructions: 'Examine the code snippet and select the faulty line.',
    codeSnippet: `1: function countdown(start) {
2:   let count = start;
3:   while (count > 0) {
4:     console.log(count);
5:     // Missing decrement: count is never updated
6:   }
7: }`,
    options: [
      'Line 2: `let count = start;`',
      'Line 3: `while (count > 0)` without updating `count` inside the body',
      'Line 4: `console.log(count);`',
      'Line 1: Function declaration syntax',
    ],
    correctAnswer: 1, // Line 3/5 missing decrement
    explanation: 'In a while loop, the condition must eventually evaluate to false. Without `count--`, `count > 0` remains true forever!',
    hint: 'Look at what happens to the variable `count` inside the loop body.',
    skillId: 'skill-js-func',
    skillName: 'JavaScript Functions',
    difficulty: 'intermediate',
    xpReward: 25,
    domain: 'programming',
  },

  // 8. Scenario Challenge
  {
    id: 'act-prog-scenario-1',
    type: 'scenario',
    title: 'Engineering Scenario',
    question:
      'Your web application needs to load 5 independent dashboard widgets from 5 different REST API endpoints. How should you invoke them for optimal performance?',
    instructions: 'Choose the most performant, non-blocking architecture.',
    options: [
      'Await each fetch request sequentially one after another in a loop.',
      'Use Promise.all() or Promise.allSettled() to execute all 5 fetch requests concurrently.',
      'Run a while loop that sleeps 1 second between each request.',
      'Combine all 5 requests into a single synchronous XMLHttpRequest.',
    ],
    correctAnswer: 1, // Promise.all()
    explanation:
      '`Promise.all()` initiates all network requests in parallel, drastically reducing overall latency from the sum of all durations to only the slowest request duration.',
    hint: 'Concurrency allows operations to run in parallel.',
    skillId: 'skill-js-async',
    skillName: 'Async/Await & Promises',
    difficulty: 'advanced',
    xpReward: 30,
    domain: 'programming',
  },
];

// Content-Agnostic Demonstration 2: English Professional Communication
export const mockLanguageActivities: Activity[] = [
  // 1. Multiple Choice
  {
    id: 'act-lang-mc-1',
    type: 'multiple_choice',
    title: 'Professional Tone',
    question: 'Which sentence is the most diplomatic and professional way to request a project update?',
    instructions: 'Select the sentence with appropriate workplace courtesy.',
    options: [
      'Where is the report? You are late.',
      'Could you please share a brief status update on the report when you have a moment?',
      'Send me the report right now or I will tell management.',
      'Why haven’t you finished the work yet?',
    ],
    correctAnswer: 1,
    explanation:
      'Diplomatic business communication uses polite modal verbs ("Could you please...") and acknowledges the colleague’s workload ("when you have a moment").',
    hint: 'Look for constructive, polite phrasing.',
    skillId: 'skill-lang-biz',
    skillName: 'Business Email Etiquette',
    difficulty: 'beginner',
    xpReward: 15,
    domain: 'language',
  },

  // 2. Fill in the Blank
  {
    id: 'act-lang-blank-1',
    type: 'fill_blank',
    title: 'Idiom & Phrasing',
    question: 'Complete the common business idiom: "Let\'s ___ our bases before presenting to the executive board."',
    instructions: 'Select the correct verb to complete the phrase.',
    blankSegments: [
      { text: "Let's ", isBlank: false },
      { text: 'cover', isBlank: true, expected: 'cover', options: ['cover', 'hide', 'build', 'paint'] },
      { text: ' our bases before presenting to the executive board.', isBlank: false },
    ],
    correctAnswer: ['cover'],
    explanation: '"Cover our bases" is an idiom meaning to make sure every potential issue or risk has been prepared for.',
    hint: 'Think of the sports-derived idiom for comprehensive preparation.',
    skillId: 'skill-lang-vocab',
    skillName: 'Professional Vocabulary',
    difficulty: 'intermediate',
    xpReward: 20,
    domain: 'language',
  },

  // 3. Matching
  {
    id: 'act-lang-match-1',
    type: 'matching',
    title: 'Vocabulary Matching',
    question: 'Match each workplace term with its appropriate definition:',
    instructions: 'Connect each term on the left with its definition on the right.',
    matchingPairs: [
      { id: 'lp1', left: 'Consensus', right: 'General agreement among members of a group' },
      { id: 'lp2', left: 'Bottleneck', right: 'A point of congestion that slows down progress' },
      { id: 'lp3', left: 'Deliverable', right: 'A tangible product or outcome produced by a project' },
      { id: 'lp4', left: 'Bandwidth', right: 'Available time and capacity to handle work' },
    ],
    correctAnswer: {
      Consensus: 'General agreement among members of a group',
      Bottleneck: 'A point of congestion that slows down progress',
      Deliverable: 'A tangible product or outcome produced by a project',
      Bandwidth: 'Available time and capacity to handle work',
    },
    explanation: 'Understanding these common cross-functional terms helps in corporate and technical collaboration.',
    skillId: 'skill-lang-vocab',
    skillName: 'Professional Vocabulary',
    difficulty: 'intermediate',
    xpReward: 25,
    domain: 'language',
  },

  // 4. Flashcard
  {
    id: 'act-lang-flash-1',
    type: 'flashcard',
    title: 'Vocabulary Card',
    question: 'Review the pronunciation and usage of this key term:',
    instructions: 'Tap to flip and reveal the definition and practical workplace example.',
    flashcardData: {
      front: 'Proactive',
      phoneticOrContext: '/proʊˈæk.tɪv/ • Adjective',
      back: 'Creating or controlling a situation rather than just reacting to it after it has happened.',
      example: '"She took a proactive approach to server maintenance, preventing downtime before users were impacted."',
      hint: 'Antonym: Reactive',
    },
    correctAnswer: 'reviewed',
    explanation: 'Being proactive is one of the most valued leadership traits across modern global teams.',
    skillId: 'skill-lang-vocab',
    skillName: 'Professional Vocabulary',
    difficulty: 'beginner',
    xpReward: 15,
    domain: 'language',
  },
];

// ============================================================================
// 2. Demo Learning Paths (Full-Stack Developer & English Communication)
// ============================================================================

export const mockEngineLearningPaths: EngineLearningPath[] = [
  {
    id: 'path-fullstack-dev',
    title: 'Full-Stack Developer',
    description: 'Build practical skills from web foundations to production-ready distributed architectures.',
    domain: 'programming',
    level: 'Comprehensive (Foundation to Advanced)',
    overallProgress: 72,
    currentStreak: 12,
    xpEarned: 3450,
    totalXp: 5200,
    estimatedCompletionWeeks: 18,
    nodes: [
      {
        id: 'node-fs-1',
        moduleNumber: 1,
        title: 'Web Foundations',
        skillName: 'Client-Server & HTTP Protocol',
        skillId: 'skill-web-foundations',
        description: 'Understand the underlying architecture of the internet, HTTP request/response lifecycles, and DNS lookup.',
        status: 'mastered',
        completionPercent: 100,
        totalLessonsCount: 8,
        completedLessonsCount: 8,
        xpReward: 350,
        estimatedMinutes: 45,
        iconName: 'Globe',
        lessons: [],
      },
      {
        id: 'node-fs-2',
        moduleNumber: 2,
        title: 'HTML Semantic Architecture',
        skillName: 'Semantic HTML & Accessibility',
        skillId: 'skill-html',
        description: 'Construct accessible, standard-compliant DOM structures with proper ARIA landmarks.',
        status: 'completed',
        completionPercent: 100,
        totalLessonsCount: 10,
        completedLessonsCount: 10,
        xpReward: 400,
        estimatedMinutes: 50,
        iconName: 'Code',
        lessons: [],
      },
      {
        id: 'node-fs-3',
        moduleNumber: 3,
        title: 'CSS Layouts, Flexbox & Grid',
        skillName: 'CSS Responsive Systems',
        skillId: 'skill-css',
        description: 'Master dynamic 2D layouts with CSS Grid, responsive container queries, and design token spacing.',
        status: 'completed',
        completionPercent: 100,
        totalLessonsCount: 12,
        completedLessonsCount: 12,
        xpReward: 450,
        estimatedMinutes: 60,
        iconName: 'Layout',
        lessons: [],
      },
      {
        id: 'node-fs-4',
        moduleNumber: 4,
        title: 'JavaScript Fundamentals',
        skillName: 'JavaScript Core Engine & Functions',
        skillId: 'skill-js-func',
        description: 'Explore variables, closures, first-class functions, array pipelines, and asynchronous execution loops.',
        status: 'in_progress',
        completionPercent: 72,
        totalLessonsCount: 12,
        completedLessonsCount: 8,
        xpReward: 450,
        estimatedMinutes: 65,
        iconName: 'Zap',
        lessons: [
          {
            id: 'lesson-js-1',
            moduleId: 'node-fs-4',
            title: 'Lesson 1: Variable Declarations & Data Types',
            description: 'Understanding primitive types, references, and `let`/`const` immutability rules.',
            estimatedMinutes: 6,
            xpReward: 80,
            skillIds: ['skill-js-var'],
            isCompleted: true,
            bestAccuracyPercent: 95,
            activities: [],
          },
          {
            id: 'lesson-js-2',
            moduleId: 'node-fs-4',
            title: 'Lesson 2: Functions, Scope & Callbacks',
            description: 'Mastering function signatures, lexical scope, closures, and higher-order callbacks.',
            estimatedMinutes: 8,
            xpReward: 80,
            skillIds: ['skill-js-func', 'skill-js-async'],
            isCompleted: false,
            bestAccuracyPercent: 0,
            activities: mockProgrammingActivities,
          },
          {
            id: 'lesson-js-3',
            moduleId: 'node-fs-4',
            title: 'Lesson 3: Arrays & Functional Pipelines',
            description: 'Transforming datasets cleanly with map, filter, reduce, and find.',
            estimatedMinutes: 7,
            xpReward: 80,
            skillIds: ['skill-js-arr'],
            isCompleted: false,
            activities: [],
          },
          {
            id: 'lesson-js-4',
            moduleId: 'node-fs-4',
            title: 'Lesson 4: Asynchronous JavaScript & Promises',
            description: 'Resolving promises, async/await mechanics, and non-blocking network calls.',
            estimatedMinutes: 9,
            xpReward: 90,
            skillIds: ['skill-js-async'],
            isCompleted: false,
            activities: [],
          },
        ],
      },
      {
        id: 'node-fs-5',
        moduleNumber: 5,
        title: 'React & Component Architecture',
        skillName: 'React State, Props & Lifecycle',
        skillId: 'skill-react',
        description: 'Build declarative, composable user interfaces using React hooks, memoization, and unidirectional state.',
        status: 'available',
        completionPercent: 0,
        totalLessonsCount: 14,
        completedLessonsCount: 0,
        xpReward: 500,
        estimatedMinutes: 75,
        iconName: 'Layers',
        lessons: [],
      },
      {
        id: 'node-fs-6',
        moduleNumber: 6,
        title: 'Backend Engineering with Node.js',
        skillName: 'Express & Server Runtimes',
        skillId: 'skill-backend',
        description: 'Architecting stateless RESTful services, custom middleware, and authentication authorization guards.',
        status: 'locked',
        completionPercent: 0,
        totalLessonsCount: 12,
        completedLessonsCount: 0,
        xpReward: 550,
        estimatedMinutes: 80,
        iconName: 'Server',
        lessons: [],
      },
      {
        id: 'node-fs-7',
        moduleNumber: 7,
        title: 'Databases & PostgreSQL',
        skillName: 'Relational Modeling & SQL',
        skillId: 'skill-db',
        description: 'Designing normalized relational schemas, foreign keys, index optimization, and transaction ACID guarantees.',
        status: 'locked',
        completionPercent: 0,
        totalLessonsCount: 12,
        completedLessonsCount: 0,
        xpReward: 500,
        estimatedMinutes: 70,
        iconName: 'Database',
        lessons: [],
      },
      {
        id: 'node-fs-8',
        moduleNumber: 8,
        title: 'REST APIs & Integration Testing',
        skillName: 'API Contracts & Testing',
        skillId: 'skill-api',
        description: 'Standardizing HTTP status codes, idempotency, JSON schemas, and automated unit and integration tests.',
        status: 'locked',
        completionPercent: 0,
        totalLessonsCount: 10,
        completedLessonsCount: 0,
        xpReward: 450,
        estimatedMinutes: 60,
        iconName: 'Terminal',
        lessons: [],
      },
      {
        id: 'node-fs-9',
        moduleNumber: 9,
        title: 'CI/CD & Cloud Deployment',
        skillName: 'Containers & Automation',
        skillId: 'skill-devops',
        description: 'Docker containerization, GitHub Actions deployment pipelines, and cloud container hosting.',
        status: 'locked',
        completionPercent: 0,
        totalLessonsCount: 8,
        completedLessonsCount: 0,
        xpReward: 400,
        estimatedMinutes: 55,
        iconName: 'Cloud',
        lessons: [],
      },
      {
        id: 'node-fs-10',
        moduleNumber: 10,
        title: 'Full-Stack Capstone System',
        skillName: 'Production Full-Stack Application',
        skillId: 'skill-capstone',
        description: 'Synthesize everything you have learned into a verified, scalable web platform with end-to-end features.',
        status: 'locked',
        completionPercent: 0,
        totalLessonsCount: 6,
        completedLessonsCount: 0,
        xpReward: 800,
        estimatedMinutes: 120,
        iconName: 'Award',
        lessons: [],
      },
    ],
  },

  // Path 2: English Professional Communication (Content-Agnostic Validation)
  {
    id: 'path-english-comm',
    title: 'English Professional Communication',
    description: 'Master confident business English for global engineering teams, cross-cultural collaboration, and leadership.',
    domain: 'language',
    level: 'Intermediate to Advanced',
    overallProgress: 48,
    currentStreak: 8,
    xpEarned: 1850,
    totalXp: 3800,
    estimatedCompletionWeeks: 10,
    nodes: [
      {
        id: 'node-lang-1',
        moduleNumber: 1,
        title: 'Everyday Professional Introductions',
        skillName: 'Workplace Introductions & Icebreakers',
        skillId: 'skill-lang-intro',
        description: 'Crafting concise elevator pitches, introducing teammates, and navigating casual international greetings.',
        status: 'completed',
        completionPercent: 100,
        totalLessonsCount: 6,
        completedLessonsCount: 6,
        xpReward: 300,
        estimatedMinutes: 35,
        iconName: 'MessageSquare',
        lessons: [],
      },
      {
        id: 'node-lang-2',
        moduleNumber: 2,
        title: 'Business Email & Writing Tone',
        skillName: 'Diplomatic Written Communication',
        skillId: 'skill-lang-biz',
        description: 'Drafting structured project updates, managing delicate follow-ups, and balancing clarity with politeness.',
        status: 'in_progress',
        completionPercent: 65,
        totalLessonsCount: 8,
        completedLessonsCount: 5,
        xpReward: 400,
        estimatedMinutes: 45,
        iconName: 'Mail',
        lessons: [
          {
            id: 'lesson-lang-2',
            moduleId: 'node-lang-2',
            title: 'Lesson 2: Constructive Requests & Courtesies',
            description: 'Practicing diplomatic phrasing, idioms, and tone calibration.',
            estimatedMinutes: 6,
            xpReward: 75,
            skillIds: ['skill-lang-biz', 'skill-lang-vocab'],
            isCompleted: false,
            activities: mockLanguageActivities,
          },
        ],
      },
      {
        id: 'node-lang-3',
        moduleNumber: 3,
        title: 'Presentations & Executive Q&A',
        skillName: 'Presentation Delivery & Argumentation',
        skillId: 'skill-lang-pres',
        description: 'Structuring slide walk-throughs, handling unexpected questions, and summarizing key business impacts.',
        status: 'available',
        completionPercent: 0,
        totalLessonsCount: 8,
        completedLessonsCount: 0,
        xpReward: 450,
        estimatedMinutes: 50,
        iconName: 'Presentation',
        lessons: [],
      },
      {
        id: 'node-lang-4',
        moduleNumber: 4,
        title: 'Technical Negotiation & Feedback',
        skillName: 'Persuasion & Diplomatic Disagreement',
        skillId: 'skill-lang-neg',
        description: 'Providing actionable code review feedback, aligning trade-offs, and negotiating scope changes.',
        status: 'locked',
        completionPercent: 0,
        totalLessonsCount: 10,
        completedLessonsCount: 0,
        xpReward: 500,
        estimatedMinutes: 60,
        iconName: 'Award',
        lessons: [],
      },
    ],
  },
];

// ============================================================================
// 3. Skill Mastery Dataset (Granular Mastery Tracking)
// ============================================================================

export const mockSkillMasteries: SkillMastery[] = [
  {
    id: 'skill-js-var',
    name: 'Variables & Scope',
    category: 'Core Fundamentals',
    domain: 'programming',
    masteryScore: 100,
    status: 'mastered',
    lastPracticedAt: 'Today',
    practiceCount: 24,
    streakDays: 8,
  },
  {
    id: 'skill-js-func',
    name: 'JavaScript Functions',
    category: 'Core Fundamentals',
    domain: 'programming',
    masteryScore: 90,
    status: 'mastered',
    lastPracticedAt: 'Yesterday',
    practiceCount: 19,
    streakDays: 5,
  },
  {
    id: 'skill-js-arr',
    name: 'Arrays & Pipelines',
    category: 'Data Structures',
    domain: 'programming',
    masteryScore: 80,
    status: 'proficient',
    lastPracticedAt: '3 days ago',
    practiceCount: 14,
    streakDays: 3,
  },
  {
    id: 'skill-js-async',
    name: 'Async/Await & Promises',
    category: 'Asynchronous Logic',
    domain: 'programming',
    masteryScore: 42,
    status: 'learning',
    lastPracticedAt: '2 days ago',
    practiceCount: 7,
    streakDays: 1,
    weakAreas: ['Error handling with try/catch', 'Promise.allSettled concurrency'],
  },
  {
    id: 'skill-js-api',
    name: 'REST & Fetch APIs',
    category: 'Networking',
    domain: 'programming',
    masteryScore: 40,
    status: 'learning',
    lastPracticedAt: '4 days ago',
    practiceCount: 6,
    streakDays: 0,
    weakAreas: ['HTTP Status codes 401 vs 403', 'Payload serialization'],
  },
  {
    id: 'skill-css-grid',
    name: 'CSS Grid & Flexbox',
    category: 'UI Engineering',
    domain: 'programming',
    masteryScore: 85,
    status: 'proficient',
    lastPracticedAt: '5 days ago',
    practiceCount: 16,
    streakDays: 4,
  },
  {
    id: 'skill-react-hooks',
    name: 'React Hooks & State',
    category: 'Frontend Frameworks',
    domain: 'programming',
    masteryScore: 55,
    status: 'practicing',
    lastPracticedAt: '6 days ago',
    practiceCount: 9,
    streakDays: 2,
    weakAreas: ['useEffect cleanup dependencies'],
  },
  {
    id: 'skill-lang-biz',
    name: 'Business Email Etiquette',
    category: 'Communication',
    domain: 'language',
    masteryScore: 88,
    status: 'proficient',
    lastPracticedAt: 'Yesterday',
    practiceCount: 15,
    streakDays: 6,
  },
  {
    id: 'skill-lang-vocab',
    name: 'Professional Vocabulary',
    category: 'Communication',
    domain: 'language',
    masteryScore: 78,
    status: 'proficient',
    lastPracticedAt: '2 days ago',
    practiceCount: 12,
    streakDays: 4,
  },
];

// ============================================================================
// 4. User Gamified Profile & Progress State
// ============================================================================

export const mockUserLearningProfile: UserLearningProfile = {
  energy: 5,
  maxEnergy: 5,
  xp: 1240,
  level: 4,
  levelTitle: 'Builder',
  nextLevelXp: 2000,
  currentLevelXp: 1240,
  streak: 12,
  longestStreak: 18,
  dailyGoalMinutes: 20,
  todayLearnedMinutes: 18,
  todayGoalCompleted: false,
  weeklyActivity: [
    { day: 'M', active: true, minutes: 25 },
    { day: 'T', active: true, minutes: 30 },
    { day: 'W', active: true, minutes: 20 },
    { day: 'T', active: true, minutes: 22 },
    { day: 'F', active: true, minutes: 18 },
    { day: 'S', active: false, minutes: 0 },
    { day: 'S', active: false, minutes: 0 },
  ],
};

// ============================================================================
// 5. Daily Missions
// ============================================================================

export const mockDailyMissions: DailyMissionItem[] = [
  {
    id: 'mis-1',
    title: 'Complete 1 interactive lesson',
    progress: 1,
    target: 1,
    unit: 'lesson',
    completed: true,
    xpReward: 50,
  },
  {
    id: 'mis-2',
    title: 'Earn 100 XP from learning activities',
    progress: 80,
    target: 100,
    unit: 'XP',
    completed: false,
    xpReward: 40,
  },
  {
    id: 'mis-3',
    title: 'Practice for 10 focused minutes',
    progress: 7,
    target: 10,
    unit: 'mins',
    completed: false,
    xpReward: 35,
    badgeReward: 'Flame Master',
  },
];

// ============================================================================
// 6. Review Items (Spaced Repetition Queue)
// ============================================================================

export const mockReviewItems: ReviewItem[] = [
  {
    id: 'rev-1',
    skillId: 'skill-js-async',
    skillName: 'Async/Await & Promises',
    domain: 'programming',
    masteryScore: 42,
    lastReviewedAt: '2 days ago',
    nextReviewAt: 'Today',
    reviewCount: 3,
    reason: 'Low mastery score (42%) & recent incorrect answers on error handling',
    questionsCount: 3,
  },
  {
    id: 'rev-2',
    skillId: 'skill-js-api',
    skillName: 'REST & Fetch APIs',
    domain: 'programming',
    masteryScore: 40,
    lastReviewedAt: '4 days ago',
    nextReviewAt: 'Overdue',
    reviewCount: 2,
    reason: 'Concept needs retention reinforcement (not reviewed in 4 days)',
    questionsCount: 4,
  },
  {
    id: 'rev-3',
    skillId: 'skill-react-hooks',
    skillName: 'React useEffect Dependencies',
    domain: 'programming',
    masteryScore: 55,
    lastReviewedAt: '6 days ago',
    nextReviewAt: 'Tomorrow',
    reviewCount: 4,
    reason: 'Spaced repetition schedule: strengthen memory decay interval',
    questionsCount: 3,
  },
];

// ============================================================================
// 7. Adaptive AI Learning Insight (Deterministic Frontend Simulation)
// ============================================================================

export const mockAdaptiveInsight: AdaptiveInsight = {
  id: 'insight-async-1',
  type: 'skill_gap',
  title: 'AI Learning Insight',
  insight: 'You may need more practice with asynchronous JavaScript and Promise error flows.',
  skillName: 'Async/Await & Promises',
  masteryPercent: 42,
  recommendations: [
    'Review async/await try...catch mechanics',
    'Complete 3 targeted practice questions',
    'Try the Asynchronous Mini Challenge',
  ],
  actionLabel: 'Start Async Practice',
  actionType: 'practice',
  targetId: 'skill-js-async',
};

// ============================================================================
// 8. Practice Sessions & Challenges
// ============================================================================

export const mockPracticeSessions: PracticeSession[] = [
  {
    id: 'prac-quick',
    title: 'Quick Practice',
    type: 'quick',
    durationMinutes: 5,
    questionsCount: 5,
    xpReward: 30,
    difficulty: 'All Levels',
    activities: mockProgrammingActivities.slice(0, 5),
  },
  {
    id: 'prac-weak',
    title: 'Weak Skills Booster',
    type: 'weak_skills',
    durationMinutes: 8,
    questionsCount: 5,
    xpReward: 50,
    difficulty: 'Intermediate',
    activities: [
      mockProgrammingActivities[3], // fill blank async
      mockProgrammingActivities[4], // matching async
      mockProgrammingActivities[5], // ordering fetch
      mockProgrammingActivities[7], // scenario concurrency
      mockProgrammingActivities[6], // debugging
    ],
  },
  {
    id: 'prac-mistakes',
    title: 'Recent Mistakes Retest',
    type: 'recent_mistakes',
    durationMinutes: 4,
    questionsCount: 3,
    xpReward: 25,
    difficulty: 'Targeted',
    activities: [
      mockProgrammingActivities[3],
      mockProgrammingActivities[6],
      mockProgrammingActivities[7],
    ],
  },
  {
    id: 'prac-review',
    title: 'Daily Spaced Review',
    type: 'spaced_review',
    durationMinutes: 6,
    questionsCount: 5,
    xpReward: 40,
    difficulty: 'Adaptive',
    activities: mockProgrammingActivities.slice(1, 6),
  },
];

export const mockDailyChallenge: Challenge = {
  id: 'challenge-sprint-today',
  title: '⚡ Daily Architecture Sprint',
  description: 'Test your speed and precision under a 5-minute timer across core web and JavaScript concepts.',
  timeLimitSeconds: 300, // 5 minutes
  questionsCount: 8,
  bonusXp: 100,
  xpReward: 100,
  activities: mockProgrammingActivities,
};
