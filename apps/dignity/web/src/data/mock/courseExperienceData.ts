/**
 * Step 5 Course & Learning Experience Mock Data
 * Contains comprehensive mock models for:
 * 1. "Full-Stack JavaScript" (8-module flagship technical course)
 * 2. "English Communication Fundamentals" (Multi-module workplace communications course)
 * Decoupled from backend; structured for future Django REST Framework serializer & PostgreSQL migration.
 */

import { DetailedCourse, DetailedLesson, DetailedCourseModule, CourseProject, CourseAssessment, CourseReview } from '../../types/courseExperience';
import { mockInstructors } from './instructors';
import { mockProgrammingActivities, mockLanguageActivities } from './learningEngine';

// ============================================================================
// 1. Full-Stack JavaScript Flagship Course
// ============================================================================

const fullstackJsLessons: DetailedLesson[] = [
  // Module 1 Lessons
  {
    id: 'fs-l1',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-1',
    title: '01 — How the Web Works',
    description: 'Understand client-server architecture, DNS resolution, HTTP request-response cycles, and modern browser rendering engines.',
    type: 'video',
    durationMinutes: 10,
    order: 1,
    status: 'completed',
    isLocked: false,
    isRequired: true,
    xpReward: 30,
    skillIds: ['skill-web-basics'],
    learningObjectives: [
      'Trace an HTTP request from URL entry in browser to server response',
      'Differentiate between DNS, TCP, and TLS handshakes',
      'Understand how HTML, CSS, and JS form the Document Object Model',
    ],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoDurationSeconds: 600,
    resources: [
      { id: 'res-1', title: 'HTTP/2 & HTTP/3 Architectural Cheatsheet', type: 'cheatsheet', url: '#', size: '1.2 MB' },
      { id: 'res-2', title: 'MDN Web Architecture Primer', type: 'link', url: 'https://developer.mozilla.org' },
    ],
  },
  {
    id: 'fs-l2',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-1',
    title: '02 — HTTP Methods, Headers & Status Codes',
    description: 'Master RESTful semantics: GET, POST, PUT, PATCH, DELETE, and proper status code error handling.',
    type: 'text',
    durationMinutes: 12,
    order: 2,
    status: 'completed',
    isLocked: false,
    isRequired: true,
    xpReward: 35,
    skillIds: ['skill-web-basics', 'skill-api-design'],
    learningObjectives: [
      'Distinguish idempotent vs non-idempotent HTTP methods',
      'Utilize appropriate 2xx, 4xx, and 5xx status codes for resilient APIs',
      'Inspect request and response headers for caching and authentication',
    ],
    textContent: {
      summary: 'HTTP is the foundational stateless protocol of the World Wide Web, communicating intent via methods and response status.',
      readingMinutes: 8,
      sections: [
        {
          id: 'sec-1',
          heading: 'Core HTTP Verbs & Semantics',
          paragraphs: [
            'In standard REST architecture, HTTP verbs represent the operational intent being performed on a server resource.',
            'Using the correct verb ensures predictable caching, proxy behavior, and idempotent error recovery when network timeouts occur.',
          ],
          keyConcept: {
            title: 'Idempotence in HTTP',
            description: 'An HTTP method is idempotent if making the exact same request multiple times produces the exact same server-side state as making it once. GET, PUT, and DELETE are idempotent; POST is not.',
          },
        },
        {
          id: 'sec-2',
          heading: 'Common Status Code Taxonomy',
          paragraphs: [
            '200 OK — Successful retrieval or general request processing.',
            '201 Created — Resource successfully provisioned (commonly returned on POST).',
            '400 Bad Request — Syntactic or schema validation failure on the client payload.',
            '401 Unauthorized vs 403 Forbidden — 401 indicates unauthenticated credentials; 403 indicates valid identity without access rights.',
            '404 Not Found — Resource identifier does not exist in the database.',
            '500 Internal Server Error — Uncaught exception on the backend application runtime.',
          ],
          codeBlock: {
            language: 'javascript',
            caption: 'Express.js response with semantic status codes and JSON payload',
            code: `app.post('/api/v1/tasks', (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const newTask = taskService.create({ title });
  return res.status(201).json(newTask);
});`,
          },
        },
      ],
    },
    resources: [
      { id: 'res-3', title: 'RESTful Status Code Decision Tree (PDF)', type: 'pdf', url: '#', size: '850 KB' },
    ],
  },
  {
    id: 'fs-l3',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-1',
    title: '03 — Web Foundations Interactive Drill',
    description: 'Solidify your knowledge of client-server contracts, headers, and protocol architectures through guided activities.',
    type: 'interactive',
    durationMinutes: 15,
    order: 3,
    status: 'completed',
    isLocked: false,
    isRequired: true,
    xpReward: 50,
    skillIds: ['skill-web-basics'],
    activities: [
      mockProgrammingActivities[0], // MC
      mockProgrammingActivities[2], // True/False
      mockProgrammingActivities[3], // Multiple Select
    ],
  },
  {
    id: 'fs-l4',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-1',
    title: '04 — Web Architecture Knowledge Benchmark',
    description: 'Verify your mastery before moving to HTML & CSS fundamentals.',
    type: 'quiz',
    durationMinutes: 10,
    order: 4,
    status: 'completed',
    isLocked: false,
    isRequired: true,
    xpReward: 40,
    skillIds: ['skill-web-basics'],
    activities: [
      mockProgrammingActivities[4], // Fill blank
      mockProgrammingActivities[5], // Matching
    ],
  },

  // Module 2 Lessons
  {
    id: 'fs-l5',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-2',
    title: '01 — Semantic HTML5 & Accessibility (a11y)',
    description: 'Build structurally sound document hierarchies that are accessible to screen readers and search crawlers.',
    type: 'video',
    durationMinutes: 14,
    order: 1,
    status: 'completed',
    isLocked: false,
    isRequired: true,
    xpReward: 35,
    skillIds: ['skill-html-css'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoDurationSeconds: 840,
  },
  {
    id: 'fs-l6',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-2',
    title: '02 — Modern CSS Layout: Flexbox & Grid Deep Dive',
    description: 'Master responsive fluid layouts, auto-fill grids, subgrid mechanics, and container queries.',
    type: 'text',
    durationMinutes: 15,
    order: 2,
    status: 'completed',
    isLocked: false,
    isRequired: true,
    xpReward: 40,
    skillIds: ['skill-html-css'],
    textContent: {
      summary: 'CSS Flexbox is optimal for one-dimensional linear flow, while CSS Grid delivers two-dimensional control over columns and rows.',
      readingMinutes: 10,
      sections: [
        {
          id: 'sec-css-1',
          heading: 'Flexbox vs CSS Grid Architecture',
          paragraphs: [
            'Use Flexbox when you want items to distribute space along a single axis (either horizontally in a navigation row or vertically in a card stack).',
            'Use CSS Grid when you need precise alignment across both columns and rows simultaneously, such as product cards grids and dashboard shells.',
          ],
          codeBlock: {
            language: 'css',
            caption: 'Responsive CSS Grid with auto-fit and minmax without media queries',
            code: `.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}`,
          },
          keyConcept: {
            title: 'Modern Fluid Grid',
            description: '`repeat(auto-fit, minmax(min, 1fr))` automatically wraps cards as screen width decreases without requiring redundant media queries.',
          },
        },
      ],
    },
  },
  {
    id: 'fs-l7',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-2',
    title: '03 — Interactive CSS & HTML Diagnostic',
    description: 'Interactive questions covering semantic elements, CSS specificity, and layout calculations.',
    type: 'interactive',
    durationMinutes: 12,
    order: 3,
    status: 'completed',
    isLocked: false,
    isRequired: true,
    xpReward: 45,
    skillIds: ['skill-html-css'],
    activities: [
      mockProgrammingActivities[6], // Ordering
      mockProgrammingActivities[7], // Flashcard
    ],
  },

  // Module 3 Lessons
  {
    id: 'fs-l8',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-3',
    title: '01 — Modern JavaScript Runtime & Memory Model',
    description: 'Explore the V8 execution context, call stack, heap allocation, closures, and lexical scope.',
    type: 'video',
    durationMinutes: 18,
    order: 1,
    status: 'completed',
    isLocked: false,
    isRequired: true,
    xpReward: 45,
    skillIds: ['skill-js-func'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoDurationSeconds: 1080,
  },
  {
    id: 'fs-l9',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-3',
    title: '02 — JavaScript Functions, Scopes & Closures',
    description: 'Master first-class functions, higher-order functions (map, filter, reduce), and closure data encapsulation.',
    type: 'text',
    durationMinutes: 14,
    order: 2,
    status: 'completed',
    isLocked: false,
    isRequired: true,
    xpReward: 40,
    skillIds: ['skill-js-func'],
    textContent: {
      summary: 'A function in JavaScript is a first-class object that retains access to its lexical scope even when invoked outside that scope.',
      readingMinutes: 8,
      sections: [
        {
          id: 'sec-js-1',
          heading: 'What is a Closure?',
          paragraphs: [
            'A closure gives a function access to its outer scope from an inner function. In JavaScript, closures are created every time a function is created, at function creation time.',
          ],
          codeBlock: {
            language: 'javascript',
            caption: 'Creating private state with closures',
            code: `function createCounter(initial = 0) {
  let count = initial;
  return {
    increment: () => ++count,
    getCount: () => count,
  };
}

const counter = createCounter(10);
console.log(counter.increment()); // 11
console.log(counter.count); // undefined (encapsulated)`,
          },
          keyConcept: {
            title: 'Encapsulation with Closures',
            description: 'Closures allow you to associate data (the lexical environment) with a function that operates on that data, mimicking private methods.',
          },
        },
      ],
    },
  },
  {
    id: 'fs-l10',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-3',
    title: '03 — Code Sandbox: Array Transformations',
    description: 'Write pure functions that transform collections using immutability principles.',
    type: 'code',
    durationMinutes: 20,
    order: 3,
    status: 'in_progress', // Active lesson
    isLocked: false,
    isRequired: true,
    xpReward: 60,
    skillIds: ['skill-js-func'],
    codeTask: {
      problemStatement: 'Write a function `sumOfEvens(numbers)` that takes an array of integers, filters out odd numbers, and returns the sum of the remaining even numbers.',
      starterCode: `function sumOfEvens(numbers) {
  // Your code here
  return 0;
}`,
      solutionCode: `function sumOfEvens(numbers) {
  return numbers
    .filter(n => n % 2 === 0)
    .reduce((sum, n) => sum + n, 0);
}`,
      language: 'javascript',
      hints: [
        'Use the modulus operator `% 2 === 0` to check for even numbers.',
        'Chain `.filter()` followed by `.reduce()` with an initial value of 0.',
      ],
      testCases: [
        { id: 'tc-1', input: '[1, 2, 3, 4, 5, 6]', expectedOutput: '12', description: 'Filters out 1, 3, 5 and sums 2 + 4 + 6 = 12' },
        { id: 'tc-2', input: '[7, 11, 13]', expectedOutput: '0', description: 'Returns 0 when no even numbers exist' },
        { id: 'tc-3', input: '[2, 4, 8, 10]', expectedOutput: '24', description: 'Sums all even numbers correctly' },
      ],
      mockOutputOnSuccess: `✓ Test Case 1 Passed: [1, 2, 3, 4, 5, 6] => 12
✓ Test Case 2 Passed: [7, 11, 13] => 0
✓ Test Case 3 Passed: [2, 4, 8, 10] => 24

All 3 automated test assertions succeeded!
Efficiency: O(N) time complexity, O(N) space complexity.`,
    },
  },
  {
    id: 'fs-l11',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-3',
    title: '04 — Asynchronous JavaScript: Promises & Async/Await',
    description: 'Tame the event loop, microtask queue, Promise.allSettled concurrency, and robust try/catch blocks.',
    type: 'interactive',
    durationMinutes: 16,
    order: 4,
    status: 'available',
    isLocked: false,
    isRequired: true,
    xpReward: 55,
    skillIds: ['skill-js-async'],
    activities: [
      mockProgrammingActivities[1], // Code completion
      mockProgrammingActivities[8], // Debugging
      mockProgrammingActivities[9], // Scenario
      mockProgrammingActivities[10], // Short answer
    ],
  },

  // Module 4 Lessons (React)
  {
    id: 'fs-l12',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-4',
    title: '01 — Modern React 19: Component Architecture',
    description: 'Component lifecycles, pure rendering rules, and JSX compilation.',
    type: 'video',
    durationMinutes: 22,
    order: 1,
    status: 'locked',
    isLocked: true,
    isRequired: true,
    xpReward: 50,
    skillIds: ['skill-react-core'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoDurationSeconds: 1320,
  },
  {
    id: 'fs-l13',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-4',
    title: '02 — State Mastery: useState, useReducer & Custom Hooks',
    description: 'Manage complex UI state machines and extract reusable hook logic.',
    type: 'interactive',
    durationMinutes: 18,
    order: 2,
    status: 'locked',
    isLocked: true,
    isRequired: true,
    xpReward: 55,
    skillIds: ['skill-react-core'],
    activities: [
      mockProgrammingActivities[0],
      mockProgrammingActivities[3],
    ],
  },

  // Module 5 Lessons (APIs)
  {
    id: 'fs-l14',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-5',
    title: '01 — RESTful API Integration & Error Boundaries',
    description: 'Integrate remote HTTP APIs with resilient fetch wrappers, optimistic updates, and loading states.',
    type: 'text',
    durationMinutes: 15,
    order: 1,
    status: 'locked',
    isLocked: true,
    isRequired: true,
    xpReward: 40,
    skillIds: ['skill-api-design'],
    textContent: {
      summary: 'Production API integration requires structured caching, timeout handling, and predictable fallback UI.',
      readingMinutes: 8,
      sections: [
        {
          id: 'sec-api-1',
          heading: 'Handling Network Failures Gracefully',
          paragraphs: [
            'Never assume a network request will succeed. Always structure async calls with timeout signals, retry policies, and clear error telemetry.',
          ],
        },
      ],
    },
  },

  // Module 6 Lessons (Backend Node/Express)
  {
    id: 'fs-l15',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-6',
    title: '01 — Node.js Runtime & Express Server Setup',
    description: 'Build server-side REST routers, custom middleware, and authentication interceptors.',
    type: 'video',
    durationMinutes: 25,
    order: 1,
    status: 'locked',
    isLocked: true,
    isRequired: true,
    xpReward: 60,
    skillIds: ['skill-backend-node'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },

  // Module 7 Lessons (Database)
  {
    id: 'fs-l16',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-7',
    title: '01 — Relational Schema Design & SQL Queries',
    description: 'Tables, foreign keys, normalization (3NF), indexes, and JOIN performance.',
    type: 'text',
    durationMinutes: 18,
    order: 1,
    status: 'locked',
    isLocked: true,
    isRequired: true,
    xpReward: 45,
    skillIds: ['skill-database-sql'],
  },

  // Module 8 (Final Capstone Project)
  {
    id: 'fs-l17',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-8',
    title: '01 — Full-Stack Workflow Manager Capstone',
    description: 'Integrate everything you built: React frontend, Express API, PostgreSQL storage, and automated tests.',
    type: 'project',
    durationMinutes: 180,
    order: 1,
    status: 'locked',
    isLocked: true,
    isRequired: true,
    xpReward: 250,
    skillIds: ['skill-react-core', 'skill-backend-node', 'skill-database-sql'],
    projectId: 'proj-fs-3',
  },
];

const fullstackJsModules: DetailedCourseModule[] = [
  {
    id: 'fs-mod-1',
    courseId: 'course-fullstack-js',
    title: 'Module 01: Web Foundations',
    description: 'Client-server architecture, HTTP protocol, DNS, and modern web protocols.',
    order: 1,
    durationHours: 3.5,
    lessons: fullstackJsLessons.slice(0, 4),
    progressPercent: 100,
    isUnlocked: true,
  },
  {
    id: 'fs-mod-2',
    courseId: 'course-fullstack-js',
    title: 'Module 02: HTML & Modern CSS',
    description: 'Semantic markup, accessibility compliance, Flexbox, and CSS Grid.',
    order: 2,
    durationHours: 4.0,
    lessons: fullstackJsLessons.slice(4, 7),
    progressPercent: 100,
    isUnlocked: true,
  },
  {
    id: 'fs-mod-3',
    courseId: 'course-fullstack-js',
    title: 'Module 03: Modern JavaScript Mastery',
    description: 'Execution context, closures, event loop, async/await, and functional array manipulation.',
    order: 3,
    durationHours: 6.0,
    lessons: fullstackJsLessons.slice(7, 11),
    progressPercent: 60,
    isUnlocked: true,
  },
  {
    id: 'fs-mod-4',
    courseId: 'course-fullstack-js',
    title: 'Module 04: React Component Architecture',
    description: 'Components, hooks, state synchronization, memoization, and custom hooks.',
    order: 4,
    durationHours: 5.5,
    lessons: fullstackJsLessons.slice(11, 13),
    progressPercent: 0,
    isUnlocked: false,
  },
  {
    id: 'fs-mod-5',
    courseId: 'course-fullstack-js',
    title: 'Module 05: REST APIs & Client Data Fetching',
    description: 'HTTP client patterns, error boundaries, optimistic UI, and cache invalidation.',
    order: 5,
    durationHours: 4.0,
    lessons: fullstackJsLessons.slice(13, 14),
    progressPercent: 0,
    isUnlocked: false,
  },
  {
    id: 'fs-mod-6',
    courseId: 'course-fullstack-js',
    title: 'Module 06: Server-Side Backend with Node & Express',
    description: 'Routing, middleware pipelines, authentication JWTs, and secure endpoints.',
    order: 6,
    durationHours: 5.0,
    lessons: fullstackJsLessons.slice(14, 15),
    progressPercent: 0,
    isUnlocked: false,
  },
  {
    id: 'fs-mod-7',
    courseId: 'course-fullstack-js',
    title: 'Module 07: Relational Database & SQL',
    description: 'Schema modeling, queries, indexes, connection pools, and migration strategies.',
    order: 7,
    durationHours: 4.0,
    lessons: fullstackJsLessons.slice(15, 16),
    progressPercent: 0,
    isUnlocked: false,
  },
  {
    id: 'fs-mod-8',
    courseId: 'course-fullstack-js',
    title: 'Module 08: Capstone Project & Deployment',
    description: 'Build, test, containerize, and deploy a complete production application.',
    order: 8,
    durationHours: 8.0,
    lessons: fullstackJsLessons.slice(16, 17),
    progressPercent: 0,
    isUnlocked: false,
  },
];

const fullstackJsProjects: CourseProject[] = [
  {
    id: 'proj-fs-1',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-2',
    title: 'Project 1: Responsive Developer Portfolio with WCAG AAA Compliance',
    objective: 'Build a production-ready, fully responsive multi-section portfolio using semantic HTML5 and modern CSS Grid/Flexbox without frameworks.',
    description: 'Put your foundational layout skills to the test. Create an accessible portfolio featuring responsive navigation, fluid typography, dark/light theme tokens, and clean semantic structure.',
    requirements: [
      'Semantic tags used throughout (<header>, <main>, <nav>, <section>, <footer>)',
      'Fluid responsive grid that adapts across mobile (375px), tablet (768px), and desktop (1280px)',
      'Passes Lighthouse accessibility audit with 100% score (WCAG AAA contrast ratios)',
      'Custom CSS variables for themes and spacing tokens',
    ],
    skills: ['HTML5', 'CSS Grid', 'Flexbox', 'Accessibility (a11y)'],
    difficulty: 'Beginner',
    estimatedHours: 6,
    status: 'completed',
    completionPercent: 100,
    milestones: [
      { id: 'ms-1-1', title: 'Setup semantic document outline & meta viewport', description: 'Configure head metadata, open graph tags, and landmark regions.', completed: true, order: 1 },
      { id: 'ms-1-2', title: 'Implement CSS variables & typographic scale', description: 'Define primary tokens, neutral shades, and modular scale font sizes.', completed: true, order: 2 },
      { id: 'ms-1-3', title: 'Build responsive project grid & skill chips', description: 'Use auto-fit grid cards with hover transitions and focus outlines.', completed: true, order: 3 },
      { id: 'ms-1-4', title: 'Audit contrast & test keyboard accessibility', description: 'Ensure all focusable elements show prominent rings and screen reader landmarks.', completed: true, order: 4 },
    ],
    starterCodeUrl: 'https://github.com/education-super-platform/portfolio-starter',
    submission: {
      githubUrl: 'https://github.com/learner/portfolio-v1',
      demoUrl: 'https://learner-portfolio.dev',
      notes: 'Completed with 100% Lighthouse score across performance, accessibility, and SEO.',
      submittedAt: 'June 2, 2026',
      feedback: 'Excellent semantic landmark usage and token structure! Contrast ratios exceed WCAG AAA standards.',
    },
  },
  {
    id: 'proj-fs-2',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-5',
    title: 'Project 2: RESTful Task Management API with Express & Validation',
    objective: 'Architect a robust backend API supporting CRUD operations, query filtering, pagination, and JSON schema validation.',
    description: 'Design and build the server that will power your task manager. Implement express routes, custom error middleware, input validation, and in-memory repository tests.',
    requirements: [
      'Endpoints for GET /tasks, POST /tasks, GET /tasks/:id, PUT /tasks/:id, DELETE /tasks/:id',
      'Query parameters for status filtering (?status=completed) and pagination (?page=1&limit=10)',
      'Validation middleware that returns 400 with actionable field-level errors',
      'Centralized error-handling middleware that logs errors and returns normalized JSON',
    ],
    skills: ['Node.js', 'Express', 'REST API', 'Middleware', 'Error Handling'],
    difficulty: 'Intermediate',
    estimatedHours: 10,
    status: 'in_progress',
    completionPercent: 50,
    milestones: [
      { id: 'ms-2-1', title: 'Setup Express server & routing structure', description: 'Initialize repository, configure npm scripts, and define route controllers.', completed: true, order: 1 },
      { id: 'ms-2-2', title: 'Implement CRUD controllers with mock in-memory store', description: 'Write handlers for listing, creating, updating, and deleting task items.', completed: true, order: 2 },
      { id: 'ms-2-3', title: 'Add schema validation middleware', description: 'Validate payload presence, string lengths, and enum values.', completed: false, order: 3 },
      { id: 'ms-2-4', title: 'Add pagination, sorting, and error boundaries', description: 'Support limit/offset and standardized error response payloads.', completed: false, order: 4 },
    ],
    starterCodeUrl: 'https://github.com/education-super-platform/express-task-api-starter',
  },
  {
    id: 'proj-fs-3',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-8',
    title: 'Project 3: Production Full-Stack Task & Workflow Platform',
    objective: 'Connect a modern React frontend to your Express backend with PostgreSQL persistence, user authentication, and deployment.',
    description: 'The definitive capstone project. Build a collaborative Kanban and list workflow platform with real-time optimistic state updates, database migrations, and CI/CD automated test verification.',
    requirements: [
      'Interactive Kanban board with drag-and-drop column transitions',
      'Persistent storage in PostgreSQL via SQL queries or lightweight query builder',
      'Secure token authentication with protected routes',
      'Automated end-to-end and unit test suite passing in CI pipeline',
    ],
    skills: ['React', 'Express', 'PostgreSQL', 'Full-Stack Architecture', 'Testing'],
    difficulty: 'Advanced',
    estimatedHours: 18,
    status: 'locked',
    completionPercent: 0,
    milestones: [
      { id: 'ms-3-1', title: 'Database schema design & initial migration', description: 'Create tables for users, boards, lists, and tasks with foreign keys.', completed: false, order: 1 },
      { id: 'ms-3-2', title: 'React Kanban UI & optimistic mutation hooks', description: 'Build component tree with responsive columns and modal task editor.', completed: false, order: 2 },
      { id: 'ms-3-3', title: 'Authentication flow & JWT token storage', description: 'Sign in, sign up, session renewal, and secure HTTP-only cookies.', completed: false, order: 3 },
      { id: 'ms-3-4', title: 'Integration testing & cloud deployment', description: 'Containerize with Docker and run automated integration suite.', completed: false, order: 4 },
    ],
  },
];

const fullstackJsAssessments: CourseAssessment[] = [
  {
    id: 'assess-fs-mid',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-3',
    title: 'Mid-Course Benchmark: JavaScript & Web Foundations',
    description: 'A comprehensive diagnostic evaluation testing your mental model of HTTP, DOM manipulation, closures, and async event loop behavior.',
    type: 'mid_course',
    passingScorePercent: 75,
    timeLimitMinutes: 20,
    xpReward: 120,
    skillsAssessed: [
      { skillId: 'skill-web-basics', name: 'Web Architecture & HTTP', weight: 30 },
      { skillId: 'skill-js-func', name: 'JavaScript Functions & Scope', weight: 40 },
      { skillId: 'skill-js-async', name: 'Asynchronous Event Loop', weight: 30 },
    ],
    activities: [
      mockProgrammingActivities[0], // MC Functions
      mockProgrammingActivities[1], // Arrow Syntax
      mockProgrammingActivities[2], // True/False
      mockProgrammingActivities[3], // Multiple Select
      mockProgrammingActivities[4], // Fill Blank
      mockProgrammingActivities[5], // Matching
      mockProgrammingActivities[8], // Debugging
      mockProgrammingActivities[9], // Scenario
    ],
  },
  {
    id: 'assess-fs-final',
    courseId: 'course-fullstack-js',
    moduleId: 'fs-mod-8',
    title: 'Full-Stack JavaScript Final Certification Exam',
    description: 'Rigorous final evaluation covering full-stack architecture, React reconciliation, Node.js concurrency, and SQL optimization.',
    type: 'final',
    passingScorePercent: 80,
    timeLimitMinutes: 45,
    xpReward: 300,
    skillsAssessed: [
      { skillId: 'skill-js-func', name: 'JavaScript Deep Dive', weight: 25 },
      { skillId: 'skill-react-core', name: 'React Component Design', weight: 25 },
      { skillId: 'skill-backend-node', name: 'Backend & API Engineering', weight: 25 },
      { skillId: 'skill-database-sql', name: 'Database & Data Integrity', weight: 25 },
    ],
    activities: mockProgrammingActivities,
  },
];

const fullstackJsReviews: CourseReview[] = [
  {
    id: 'rev-1',
    courseId: 'course-fullstack-js',
    userName: 'David Chen',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    userHeadline: 'Frontend Engineer at Stripe',
    rating: 5,
    createdAt: '3 days ago',
    comment: 'The transition from core JavaScript closures to React concurrency and real Express APIs is seamless. The code sandbox drills in Module 3 helped me pass senior technical interviews!',
    likes: 42,
  },
  {
    id: 'rev-2',
    courseId: 'course-fullstack-js',
    userName: 'Elena Rostova',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    userHeadline: 'Full-Stack Developer & Career Switcher',
    rating: 5,
    createdAt: '1 week ago',
    comment: 'Unlike typical video courses where you just watch someone type, the interactive activities and project milestones force you to genuinely understand the architectural reasons behind every line of code.',
    likes: 31,
  },
  {
    id: 'rev-3',
    courseId: 'course-fullstack-js',
    userName: 'Marcus Sterling',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    userHeadline: 'Computer Science Student',
    rating: 4.5,
    createdAt: '2 weeks ago',
    comment: 'Top-tier curriculum. The visual learning path tracking and instant XP feedback loops make consistent daily studying feel rewarding.',
    likes: 19,
  },
];

export const mockDetailedFullstackCourse: DetailedCourse = {
  id: 'course-fullstack-js',
  title: 'Full-Stack JavaScript & Modern Web Engineering',
  slug: 'full-stack-javascript-engineering',
  shortDescription: 'Build modern, resilient web applications from web fundamentals and JavaScript runtime mechanics to React, Express, and PostgreSQL.',
  description: 'A masterclass designed to take you from foundational principles to production-ready full-stack software development. Learn how browsers parse documents, how V8 executes asynchronous JavaScript, how React manages state trees, and how Express and relational databases power hyper-scale backend APIs.',
  thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=700&auto=format&fit=crop&q=80',
  categoryId: 'cat-tech',
  categoryName: 'Technology & Programming',
  instructor: mockInstructors[0],
  difficulty: 'Intermediate',
  durationHours: 36,
  lessonCount: 36,
  rating: 4.88,
  ratingCount: 2840,
  studentsCount: 14200,
  priceType: 'paid',
  priceAmount: 89,
  originalPrice: 129,
  currency: 'USD',
  enrollmentStatus: 'in_progress',
  progressPercent: 68,
  lastStudiedAt: 'Today',
  currentLessonId: 'fs-l10',
  currentLessonTitle: '03 — Code Sandbox: Array Transformations',
  tags: ['JavaScript', 'React', 'Node.js', 'Express', 'PostgreSQL', 'REST API', 'Full-Stack'],
  provider: 'Software Engineering Guild',
  format: 'Interactive + Project-Based',
  language: 'English',
  isFeatured: true,
  isPopular: true,
  isNew: false,

  // Step 5 Extensions
  courseType: 'interactive',
  learningPathId: 'path-fs-1',
  learningPathTitle: 'Full-Stack Web Architect Career Path',
  learningPathProgress: 34,
  whatYouWillLearn: [
    'Build responsive, accessible (WCAG AAA) web interfaces using semantic HTML5 and modern CSS Grid',
    'Master the JavaScript execution model: call stack, closures, prototypes, and the async event loop',
    'Architect robust React 19 single-page applications with custom hooks and resilient state synchronization',
    'Design and deploy RESTful microservices with Express.js, validation schemas, and error boundaries',
    'Model normalized relational databases and execute high-performance SQL queries in PostgreSQL',
    'Implement end-to-end authentication with JWTs, HTTP-only cookies, and role-based access control',
  ],
  whyItMatters: 'JavaScript is the universal language of the modern web. Understanding both frontend UI lifecycles and backend server architectures empowers you to build complete software products independently.',
  howYouKnowMastered: 'You will demonstrate true mastery by completing 3 full real-world projects, passing 2 comprehensive diagnostic benchmark assessments, and obtaining an 80%+ score on the practical coding sandboxes.',
  requirements: [
    'Basic computer literacy and comfort using a web browser',
    'No prior professional programming experience required (foundations covered in Module 1)',
    'A computer capable of running a modern web browser and code editor',
  ],
  prerequisites: [
    { id: 'prereq-1', title: 'Basic Computer Operations & File System', completed: true },
    { id: 'prereq-2', title: 'Introductory Command Line Navigation', completed: true },
    { id: 'prereq-3', title: 'Recommended: Git Version Control Basics', completed: false, recommendedCourseId: 'course-110', recommendedCourseTitle: 'Docker & Git Essentials' },
  ],
  courseIncludes: {
    lessonsCount: 36,
    practiceCount: 8,
    assessmentsCount: 4,
    projectsCount: 3,
    downloadableResourcesCount: 16,
    certificateEligible: true,
  },
  detailedModules: fullstackJsModules,
  skills: [
    { id: 'skill-js-func', name: 'JavaScript & Closures', level: 82, category: 'Core Language' },
    { id: 'skill-react-core', name: 'React Component Architecture', level: 61, category: 'Frontend' },
    { id: 'skill-api-design', name: 'REST API & HTTP Design', level: 78, category: 'Networking' },
    { id: 'skill-backend-node', name: 'Node.js & Express Architecture', level: 40, category: 'Backend' },
    { id: 'skill-database-sql', name: 'PostgreSQL Relational Schema', level: 30, category: 'Data' },
  ],
  projects: fullstackJsProjects,
  assessments: fullstackJsAssessments,
  reviews: fullstackJsReviews,
  recommendedNextCourses: ['course-102', 'course-108', 'course-104'],
  certificateEligibility: {
    isEligible: true,
    unlockedAt: 'Upon Capstone Completion',
    credentialId: 'ESP-2026-FSJS-8492',
  },
};

// ============================================================================
// 2. English Communication Fundamentals Course (Content-Agnostic Proof)
// ============================================================================

const englishCommLessons: DetailedLesson[] = [
  {
    id: 'eng-l1',
    courseId: 'course-english-comm',
    moduleId: 'eng-mod-1',
    title: '01 — Professional Workplace Introductions',
    description: 'Learn how to introduce yourself, articulate your role with clarity, and engage in high-impact executive presence.',
    type: 'text',
    durationMinutes: 10,
    order: 1,
    status: 'completed',
    isLocked: false,
    isRequired: true,
    xpReward: 25,
    skillIds: ['skill-eng-intro'],
    textContent: {
      summary: 'Professional introductions establish credibility, clarity of purpose, and collaborative rapport in modern workplace environments.',
      readingMinutes: 6,
      sections: [
        {
          id: 'sec-eng-1',
          heading: 'The 3-Part Elevator Introduction',
          paragraphs: [
            '1. State your current role and your primary area of responsibility.',
            '2. Share a specific business outcome or initiative you recently spearheaded.',
            '3. Connect to the stakeholder by asking an open, collaborative question.',
          ],
          keyConcept: {
            title: 'Executive Presence',
            description: 'Speak in concise, declarative sentences. Avoid filler qualifiers like "just" or "I guess" when describing your deliverables.',
          },
        },
      ],
    },
  },
  {
    id: 'eng-l2',
    courseId: 'course-english-comm',
    moduleId: 'eng-mod-1',
    title: '02 — Vocabulary & Professional Idioms Flashcards',
    description: 'Memorize high-frequency workplace business expressions with phonetics and contextual examples.',
    type: 'interactive',
    durationMinutes: 12,
    order: 2,
    status: 'in_progress',
    isLocked: false,
    isRequired: true,
    xpReward: 35,
    skillIds: ['skill-eng-vocab'],
    activities: [
      mockLanguageActivities[0], // Flashcard
      mockLanguageActivities[1], // Fill blank
      mockLanguageActivities[2], // Multiple choice
    ],
  },
  {
    id: 'eng-l3',
    courseId: 'course-english-comm',
    moduleId: 'eng-mod-2',
    title: '01 — Active Listening & Clarification Strategies',
    description: 'Techniques for paraphrasing requirements, confirming alignment, and politely challenging assumptions.',
    type: 'video',
    durationMinutes: 15,
    order: 1,
    status: 'available',
    isLocked: false,
    isRequired: true,
    xpReward: 35,
    skillIds: ['skill-eng-listen'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoDurationSeconds: 900,
  },
  {
    id: 'eng-l4',
    courseId: 'course-english-comm',
    moduleId: 'eng-mod-2',
    title: '02 — Clarification & Negotiation Scenarios',
    description: 'Evaluate conversational trade-offs when resolving ambiguous client specifications.',
    type: 'interactive',
    durationMinutes: 14,
    order: 2,
    status: 'locked',
    isLocked: true,
    isRequired: true,
    xpReward: 40,
    skillIds: ['skill-eng-negotiate'],
    activities: [
      mockLanguageActivities[3], // Matching
      mockLanguageActivities[4], // Scenario decision
    ],
  },
  {
    id: 'eng-l5',
    courseId: 'course-english-comm',
    moduleId: 'eng-mod-3',
    title: '01 — Capstone: Executive Project Pitch Recording',
    description: 'Deliver a structured 3-minute project pitch summarizing problem statement, solution, and roadmap.',
    type: 'project',
    durationMinutes: 60,
    order: 1,
    status: 'locked',
    isLocked: true,
    isRequired: true,
    xpReward: 150,
    skillIds: ['skill-eng-intro', 'skill-eng-negotiate'],
    projectId: 'proj-eng-1',
  },
];

const englishCommModules: DetailedCourseModule[] = [
  {
    id: 'eng-mod-1',
    courseId: 'course-english-comm',
    title: 'Module 01: Professional Introductions & Rapport',
    description: 'Executive presence, elevator introductions, and high-frequency workplace idioms.',
    order: 1,
    durationHours: 2.5,
    lessons: englishCommLessons.slice(0, 2),
    progressPercent: 50,
    isUnlocked: true,
  },
  {
    id: 'eng-mod-2',
    courseId: 'course-english-comm',
    title: 'Module 02: Active Listening & Clarification',
    description: 'Paraphrasing techniques, ambiguity resolution, and cross-functional alignment.',
    order: 2,
    durationHours: 3.0,
    lessons: englishCommLessons.slice(2, 4),
    progressPercent: 0,
    isUnlocked: true,
  },
  {
    id: 'eng-mod-3',
    courseId: 'course-english-comm',
    title: 'Module 03: Executive Project Pitch Capstone',
    description: 'Synthesize communication skills into a compelling project pitch presentation.',
    order: 3,
    durationHours: 2.0,
    lessons: englishCommLessons.slice(4, 5),
    progressPercent: 0,
    isUnlocked: false,
  },
];

const englishCommProjects: CourseProject[] = [
  {
    id: 'proj-eng-1',
    courseId: 'course-english-comm',
    moduleId: 'eng-mod-3',
    title: 'Executive Project Pitch & Alignment Brief',
    objective: 'Record or draft a concise executive project briefing for international stakeholders, addressing scope, risks, and next steps.',
    description: 'Apply high-impact business communication structures to pitch an organizational feature initiative with clarity and diplomacy.',
    requirements: [
      'Structure follows the Situation-Complication-Resolution (SCR) framework',
      'Uses at least 4 professional idioms or framing phrases learned in Module 1',
      'Anticipates stakeholder objections with clarifying questions',
    ],
    skills: ['Executive Presence', 'Business English', 'SCR Framework', 'Diplomatic Communication'],
    difficulty: 'Intermediate',
    estimatedHours: 4,
    status: 'not_started',
    completionPercent: 0,
    milestones: [
      { id: 'eng-ms-1', title: 'Outline Situation, Complication, and Resolution', description: 'Define the core business problem and desired alignment outcome.', completed: false, order: 1 },
      { id: 'eng-ms-2', title: 'Integrate active listening question hooks', description: 'Draft 3 clarifying questions to confirm stakeholder buy-in.', completed: false, order: 2 },
      { id: 'eng-ms-3', title: 'Finalize briefing notes and deliver pitch', description: 'Self-evaluate against vocabulary and tone rubric.', completed: false, order: 3 },
    ],
  },
];

export const mockDetailedEnglishCourse: DetailedCourse = {
  id: 'course-english-comm',
  title: 'English Communication Fundamentals for Global Teams',
  slug: 'english-communication-fundamentals',
  shortDescription: 'Master international workplace dialogue, active listening, executive presence, and diplomatic negotiation.',
  description: 'A practical, scenario-driven communications course built for software engineers, product managers, and global knowledge workers. Learn to articulate complex technical ideas with clarity, lead cross-cultural syncs, and resolve project ambiguity with diplomacy.',
  thumbnailUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=700&auto=format&fit=crop&q=80',
  categoryId: 'cat-business',
  categoryName: 'Business & Communication',
  instructor: mockInstructors[2],
  difficulty: 'Beginner',
  durationHours: 12,
  lessonCount: 16,
  rating: 4.92,
  ratingCount: 1120,
  studentsCount: 8900,
  priceType: 'free',
  priceAmount: 0,
  currency: 'USD',
  enrollmentStatus: 'not_enrolled',
  progressPercent: 0,
  tags: ['English', 'Communication', 'Workplace', 'Business', 'Soft Skills'],
  provider: 'Global Workplace Language Guild',
  format: 'Interactive Scenarios',
  language: 'English',
  isFeatured: false,
  isPopular: true,
  isNew: true,

  courseType: 'interactive',
  whatYouWillLearn: [
    'Deliver concise 3-minute executive elevator introductions with confidence',
    'Use active listening hooks to eliminate miscommunication during technical syncs',
    'Structure constructive feedback and negotiate timeline compromises diplomatically',
    'Master 50+ high-frequency idioms and professional expressions used in tech teams',
  ],
  whyItMatters: 'Clear, empathetic communication is the highest-leverage multiplier for career progression in distributed and remote teams.',
  howYouKnowMastered: 'You will complete interactive dialogue simulations and deliver an executive project pitch graded against professional fluency rubrics.',
  requirements: [
    'Basic conversational reading comprehension in English',
    'Willingness to practice verbal pacing and constructive dialogue drills',
  ],
  prerequisites: [],
  courseIncludes: {
    lessonsCount: 16,
    practiceCount: 6,
    assessmentsCount: 2,
    projectsCount: 1,
    downloadableResourcesCount: 8,
    certificateEligible: true,
  },
  detailedModules: englishCommModules,
  skills: [
    { id: 'skill-eng-intro', name: 'Executive Introductions', level: 75, category: 'Speaking' },
    { id: 'skill-eng-vocab', name: 'Workplace Idioms & Vocabulary', level: 85, category: 'Language' },
    { id: 'skill-eng-listen', name: 'Active Listening & Paraphrasing', level: 60, category: 'Comprehension' },
    { id: 'skill-eng-negotiate', name: 'Diplomatic Negotiation', level: 45, category: 'Professional' },
  ],
  projects: englishCommProjects,
  assessments: [],
  reviews: [
    {
      id: 'rev-eng-1',
      courseId: 'course-english-comm',
      userName: 'Taro Takahashi',
      userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      userHeadline: 'Backend Engineer in Tokyo',
      rating: 5,
      createdAt: '5 days ago',
      comment: 'The scenario decision questions are remarkably accurate to real daily standups with US engineering partners!',
      likes: 18,
    },
  ],
  recommendedNextCourses: ['course-fullstack-js'],
  certificateEligibility: {
    isEligible: true,
    unlockedAt: 'Upon Pitch Completion',
    credentialId: 'ESP-2026-ENG-4109',
  },
};

// ============================================================================
// Centralized Registry of Detailed Courses
// ============================================================================

export const mockDetailedCourses: DetailedCourse[] = [
  mockDetailedFullstackCourse,
  mockDetailedEnglishCourse,
];
