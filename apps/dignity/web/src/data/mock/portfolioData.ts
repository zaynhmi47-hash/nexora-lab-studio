/**
 * Education Super Platform - Mock Portfolio Data
 * Provides comprehensive portfolio models including Alex Chen's primary portfolio
 * and peer profiles for benchmarking and inspiration.
 */

import { Portfolio, PortfolioProject } from '../../types/portfolio';
import { mockProjectSkillEvidence } from './projectData';

// ==========================================
// Alex Chen's Flagship Projects in Portfolio
// ==========================================
export const mockAlexPortfolioProjects: PortfolioProject[] = [
  {
    id: 'port-proj-1',
    projectId: 'proj-task-mgmt',
    title: 'TaskFlow: Collaborative Full-Stack Kanban Application',
    description:
      'A responsive, high-performance task management system featuring fluid drag-and-drop interactions, atomic SQL transactions, and containerized Cloud Run deployment.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
    problemSummary:
      'Modern remote teams suffer from sluggish, overloaded task boards with confusing state sync and poor keyboard accessibility.',
    solutionSummary:
      'Engineered an optimistic UI architecture with native HTML5 drag-and-drop and robust PostgreSQL backend ensuring sub-50ms interaction feedback and 100% keyboard accessibility.',
    skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Git & CI/CD', 'System Architecture'],
    tools: ['React 18', 'TypeScript', 'Tailwind CSS', 'Express', 'PostgreSQL', 'Docker'],
    role: 'Lead Full-Stack Developer & UI Architect',
    courseTitle: 'Full-Stack JavaScript: From Zero to Production',
    completedDate: 'June 2026',
    deliverablesCount: 4,
    demoUrl: 'https://taskflow-prod.live',
    repositoryUrl: 'https://github.com/alexchen/taskflow-fullstack-app',
    isFeatured: true,
    order: 1,
    caseStudy: {
      id: 'cs-1',
      projectId: 'proj-task-mgmt',
      problem:
        'Remote engineering squads frequently battle task board desynchronization, layout shifts when dragging cards across columns, and completely unusable interfaces for keyboard-only or screen reader users.',
      research:
        'Audited 6 market-leading Kanban boards (Trello, Jira, Linear, Asana). Identified that over 70% of interaction delays happen when waiting for server acknowledgement before visually repositioning a card. Furthermore, keyboard-based column moves were either missing or deeply nested under multi-click dropdowns.',
      approach:
        'Adopted an optimistic UI state model paired with transactional SQL rollback handlers. Divided the workspace into modular decoupled packages: custom hook state managers, accessible keyboard navigation hooks, and Express route controllers.',
      process:
        '1. Formulated relational schema ensuring board_id, column_id, and position_index were composite-indexed.\n2. Implemented WAI-ARIA compliant drag-and-drop primitives with live region announcements.\n3. Built Express REST endpoints protected by JWT auth middleware and rate limiting.\n4. Configured Docker multi-stage builds reducing container size by 65%.',
      implementation:
        'Frontend built with React 18, utilizing `useOptimistic` patterns and custom drag listeners. Backend built with Node.js/Express communicating with PostgreSQL via parameterized queries wrapped in `BEGIN ... COMMIT` transactional blocks.',
      challenges:
        'Race conditions occurred when rapid successive card reorders happened before the previous SQL transaction committed. Solved this by introducing client-side sequence versioning with exponential backoff conflict resolution.',
      solution:
        'The final architecture delivered sub-16ms render times during drag operations, automated error rollback with user-friendly toast alerts, and 100% WCAG AA contrast and keyboard tab index compliance.',
      results:
        'Lighthouse audit yielded 98/100 performance, 100/100 accessibility, and 100/100 SEO scores. Over 1,200 simulated tasks were moved concurrently in test harnesses with zero orphaned records.',
      lessonsLearned:
        'Optimistic interfaces dramatically elevate perceived product quality, but require bulletproof database transaction boundaries and idempotent API design to safely manage network disconnects.',
      updatedAt: '2026-06-09T16:00:00Z',
    },
  },
  {
    id: 'port-proj-2',
    projectId: 'proj-data-dash',
    title: 'Climate & Health Geospatial Analytics Dashboard',
    description:
      'High-throughput data visualization web platform synthesizing multivariate open datasets with custom D3.js SVG choropleths and brushable time series.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
    problemSummary:
      'Public health researchers struggle to cross-reference multi-gigabyte regional climate telemetry against epidemic trendlines due to static spreadsheet tools.',
    solutionSummary:
      'Constructed a client-side D3 rendering engine backed by Parquet chunking that allows instant multi-metric cross-filtering across 500,000 data points.',
    skills: ['Python', 'Data Analysis', 'Data Visualization', 'D3.js', 'Pandas'],
    tools: ['D3.js', 'React', 'Python', 'Pandas', 'FastAPI'],
    role: 'Data Engineer & Visualization Specialist',
    courseTitle: 'Data Science & Statistical Modeling in Python',
    completedDate: 'May 2026',
    deliverablesCount: 2,
    demoUrl: 'https://alex-data-atlas.vercel.app',
    repositoryUrl: 'https://github.com/alexchen/climate-covid-etl',
    isFeatured: true,
    order: 2,
  },
  {
    id: 'port-proj-3',
    projectId: 'proj-mobile-habit',
    title: 'HabitZen: Offline-First Habit Formation App',
    description:
      'A cross-platform React Native habit tracking application with local SQLite embedded persistence and background delta synchronization.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80',
    problemSummary:
      'Habit apps fail when users lose connectivity on subways or flights, causing broken daily streaks and lost motivation.',
    solutionSummary:
      'Engineered an offline-first architecture with vector clocks and local SQLite databases that synchronize automatically once network reconnects.',
    skills: ['Mobile Development', 'React Native', 'SQLite', 'TypeScript'],
    tools: ['React Native', 'Expo', 'SQLite', 'Node.js'],
    role: 'Mobile Software Engineer',
    courseTitle: 'React Native & Mobile App Architecture',
    completedDate: 'March 2026',
    deliverablesCount: 1,
    demoUrl: 'https://loom.com/share/habit-tracker-offline-demo',
    repositoryUrl: 'https://github.com/alexchen/habit-zen-mobile',
    isFeatured: false,
    order: 3,
  },
];

// ==========================================
// Alex Chen's Portfolio Model
// ==========================================
export const mockAlexPortfolio: Portfolio = {
  id: 'portfolio-alex-chen',
  userId: 'usr-alex',
  name: 'Alex Chen',
  headline: 'Full-Stack Software Engineer & Interactive Systems Builder',
  bio: 'Passionate full-stack developer specializing in modern TypeScript, React, and scalable backend services. Dedicated to building accessible, high-performance web products backed by clean relational architectures and robust test coverage.',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
  learningGoal: 'Transitioning to Senior Full-Stack Engineer / Distributed Systems Specialist',
  location: 'San Francisco, CA (Open to Remote)',
  websiteUrl: 'https://alexchen.dev',
  githubUrl: 'https://github.com/alexchen',
  linkedinUrl: 'https://linkedin.com/in/alexchen-dev',
  twitterUrl: 'https://x.com/alexchen_dev',

  visibility: 'public',
  theme: 'professional',
  shareableSlug: 'alex-chen',
  lastUpdated: 'June 2026',

  sections: [
    { id: 'sec-about', type: 'about', title: 'About & Professional Philosophy', isVisible: true, order: 1 },
    { id: 'sec-skills', type: 'skills', title: 'Verified Skills & Evidence Matrix', isVisible: true, order: 2 },
    { id: 'sec-projects', type: 'projects', title: 'Featured Projects & Case Studies', isVisible: true, order: 3 },
    { id: 'sec-certs', type: 'certificates', title: 'Verified Credentials & Certifications', isVisible: true, order: 4 },
    { id: 'sec-exp', type: 'experience', title: 'Industry & Internship Experience', isVisible: true, order: 5 },
    { id: 'sec-edu', type: 'education', title: 'Education & Formal Training', isVisible: true, order: 6 },
    { id: 'sec-achieve', type: 'achievements', title: 'Platform Honors & Badges', isVisible: true, order: 7 },
  ],

  skills: [
    {
      name: 'JavaScript',
      category: 'Frontend & Backend',
      masteryPercentage: 88,
      evidenceCount: 6,
      evidenceItems: mockProjectSkillEvidence.filter((se) => se.skillName === 'JavaScript'),
      verifiedByCertificate: true,
    },
    {
      name: 'React',
      category: 'Frontend',
      masteryPercentage: 81,
      evidenceCount: 4,
      evidenceItems: mockProjectSkillEvidence.filter((se) => se.skillName === 'React'),
      verifiedByCertificate: true,
    },
    {
      name: 'TypeScript',
      category: 'Languages',
      masteryPercentage: 74,
      evidenceCount: 3,
      evidenceItems: [],
      verifiedByCertificate: false,
    },
    {
      name: 'Node.js',
      category: 'Backend',
      masteryPercentage: 69,
      evidenceCount: 3,
      evidenceItems: mockProjectSkillEvidence.filter((se) => se.skillName === 'Node.js'),
      verifiedByCertificate: true,
    },
    {
      name: 'SQL',
      category: 'Databases',
      masteryPercentage: 62,
      evidenceCount: 2,
      evidenceItems: mockProjectSkillEvidence.filter((se) => se.skillName === 'SQL'),
      verifiedByCertificate: false,
    },
    {
      name: 'Tailwind CSS',
      category: 'Design & UI',
      masteryPercentage: 85,
      evidenceCount: 4,
      evidenceItems: [],
      verifiedByCertificate: true,
    },
    {
      name: 'Git & CI/CD',
      category: 'DevOps & Tooling',
      masteryPercentage: 70,
      evidenceCount: 2,
      evidenceItems: mockProjectSkillEvidence.filter((se) => se.skillName === 'Git & CI/CD'),
      verifiedByCertificate: true,
    },
    {
      name: 'System Architecture',
      category: 'Architecture',
      masteryPercentage: 58,
      evidenceCount: 2,
      evidenceItems: mockProjectSkillEvidence.filter((se) => se.skillName === 'System Architecture'),
      verifiedByCertificate: false,
    },
  ],

  projects: mockAlexPortfolioProjects,

  certificates: [
    {
      id: 'cert-1',
      title: 'Full-Stack Web Development Professional Certificate',
      issuer: 'Super Education Platform & Global Tech Consortium',
      issueDate: 'June 2026',
      credentialId: 'CERT-FS-2026-89421',
      credentialUrl: 'https://edu.superplatform.com/verify/CERT-FS-2026-89421',
      skillsValidated: ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'RESTful APIs'],
      isVerified: true,
    },
    {
      id: 'cert-2',
      title: 'Modern Frontend Architecture & Web Performance',
      issuer: 'Frontend Masters & Super Platform',
      issueDate: 'April 2026',
      credentialId: 'CERT-FE-2026-11409',
      skillsValidated: ['React', 'TypeScript', 'Web Accessibility (WCAG)', 'State Management'],
      isVerified: true,
    },
  ],

  experience: [
    {
      id: 'exp-1',
      role: 'Junior Frontend Developer (Apprentice)',
      company: 'OmniVerve Labs',
      location: 'San Francisco, CA',
      startDate: 'Jan 2025',
      endDate: 'Dec 2025',
      isCurrent: false,
      description:
        'Contributed to the core design system repository, authored reusable TypeScript components, and reduced dashboard bundle sizes by 28% through dynamic imports.',
      skillsUsed: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Storybook'],
    },
    {
      id: 'exp-2',
      role: 'Freelance Web Developer',
      company: 'Self-Employed',
      location: 'Remote',
      startDate: 'May 2024',
      endDate: 'Present',
      isCurrent: true,
      description:
        'Delivered responsive marketing pages and dynamic booking portals for small businesses and creative agencies, maintaining 100% on-time project completion.',
      skillsUsed: ['JavaScript', 'HTML5/CSS3', 'Node.js', 'SEO Optimization'],
    },
  ],

  education: [
    {
      id: 'edu-1',
      degree: 'B.S. in Computer Science',
      institution: 'University of California, Davis',
      fieldOfStudy: 'Software Engineering & Data Structures',
      startYear: '2021',
      endYear: '2025',
      grade: '3.82 GPA',
      activities: 'ACM Student Chapter Vice President, Hackathon Organizer',
    },
  ],

  achievements: [
    {
      id: 'ach-1',
      title: 'Capstone Excellence Award',
      description: 'Awarded top 5% recognition for the TaskFlow Kanban project architecture.',
      date: 'June 2026',
      badgeIcon: 'Trophy',
      category: 'Excellence',
    },
    {
      id: 'ach-2',
      title: '100-Day Consistent Learning Streak',
      description: 'Maintained uninterrupted daily coding and practice sessions on the platform.',
      date: 'May 2026',
      badgeIcon: 'Flame',
      category: 'Consistency',
    },
  ],

  publications: [
    {
      id: 'pub-1',
      title: 'Optimistic UI Patterns Without State Collisions in React 18',
      publisher: 'Super Platform Tech Journal',
      date: 'June 2026',
      url: 'https://superplatform.edu/blog/optimistic-ui-patterns',
      summary:
        'An in-depth architectural breakdown of managing concurrent optimistic mutations against relational database constraints.',
    },
  ],

  completeness: {
    score: 92,
    level: 'All-Star',
    items: [
      {
        id: 'comp-1',
        label: 'Add Profile Photo & Headline',
        description: 'Ensure recruiters know who you are at a glance.',
        isCompleted: true,
        actionText: 'Edit Header',
        sectionTarget: 'about',
      },
      {
        id: 'comp-2',
        label: 'Feature at Least 2 Capstone Projects',
        description: 'Include detailed problem-solving and code repositories.',
        isCompleted: true,
        actionText: 'Manage Projects',
        sectionTarget: 'projects',
      },
      {
        id: 'comp-3',
        label: 'Write an In-Depth Project Case Study',
        description: 'Detail your research, architectural choices, challenges, and results.',
        isCompleted: true,
        actionText: 'Edit Case Study',
        sectionTarget: 'projects',
      },
      {
        id: 'comp-4',
        label: 'Connect Verified Skill Evidence Records',
        description: 'Back up your self-reported skill percentages with proven course projects.',
        isCompleted: true,
        actionText: 'View Skills',
        sectionTarget: 'skills',
      },
      {
        id: 'comp-5',
        label: 'Add Social & GitHub Links',
        description: 'Help collaborators and hiring managers inspect your public commits.',
        isCompleted: true,
        actionText: 'Update Links',
        sectionTarget: 'about',
      },
      {
        id: 'comp-6',
        label: 'Add Video Demonstration Walkthrough',
        description: 'Record a 2-minute Loom video walking through your application.',
        isCompleted: false,
        actionText: 'Upload Video',
        sectionTarget: 'projects',
      },
    ],
  },
};

// ==========================================
// Peer Portfolios for Showcase & Inspiration
// ==========================================
export const mockPeerPortfolios: Portfolio[] = [
  mockAlexPortfolio,
  {
    id: 'portfolio-elena-rostova',
    userId: 'usr-elena',
    name: 'Elena Rostova',
    headline: 'Senior Design Systems Architect & Accessibility Advocate',
    bio: 'Bridging the gap between Figma design tokens and production React component libraries with an unwavering commitment to WCAG AAA accessibility.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    learningGoal: 'Design Technology Leadership & Token Standardization',
    location: 'Berlin, Germany',
    visibility: 'public',
    theme: 'creative',
    shareableSlug: 'elena-rostova',
    lastUpdated: 'May 2026',
    sections: [
      { id: 'sec-1', type: 'about', title: 'Design Philosophy', isVisible: true, order: 1 },
      { id: 'sec-2', type: 'projects', title: 'Design Systems', isVisible: true, order: 2 },
      { id: 'sec-3', type: 'skills', title: 'Core Competencies', isVisible: true, order: 3 },
    ],
    skills: [
      { name: 'UI Design', category: 'Design', masteryPercentage: 96, evidenceCount: 8, evidenceItems: [], verifiedByCertificate: true },
      { name: 'Design Systems', category: 'Design', masteryPercentage: 94, evidenceCount: 7, evidenceItems: [], verifiedByCertificate: true },
      { name: 'Accessibility (WAI-ARIA)', category: 'Engineering', masteryPercentage: 90, evidenceCount: 5, evidenceItems: [], verifiedByCertificate: true },
    ],
    projects: [
      {
        id: 'p-elena-1',
        title: 'Aurora Enterprise Design System',
        description: 'Multi-brand tokenized design system powering 14 fintech web and mobile products.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800',
        skills: ['Figma', 'Design Systems', 'Tailwind CSS', 'Accessibility'],
        tools: ['Figma', 'Tokens Studio', 'React', 'Storybook'],
        role: 'Principal Design Technologist',
        completedDate: 'May 2026',
        isFeatured: true,
        order: 1,
      },
    ],
    certificates: [],
    education: [],
    experience: [],
    achievements: [],
    publications: [],
    completeness: { score: 88, level: 'Professional', items: [] },
  },
  {
    id: 'portfolio-marcus-thorne',
    userId: 'usr-marcus',
    name: 'Marcus Thorne',
    headline: 'SaaS Strategy Consultant & Quantitative Finance Analyst',
    bio: 'Synthesizing market research, customer acquisition economics, and statistical models to guide early-stage enterprise SaaS expansion.',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    learningGoal: 'Fintech Product Management & VC Analytics',
    location: 'London, UK',
    visibility: 'public',
    theme: 'minimal',
    shareableSlug: 'marcus-thorne',
    lastUpdated: 'April 2026',
    sections: [
      { id: 'sec-1', type: 'about', title: 'Executive Summary', isVisible: true, order: 1 },
      { id: 'sec-2', type: 'projects', title: 'Commercial Case Studies', isVisible: true, order: 2 },
      { id: 'sec-3', type: 'skills', title: 'Financial Modeling & Valuation', isVisible: true, order: 3 },
    ],
    skills: [
      { name: 'Financial Modeling', category: 'Finance', masteryPercentage: 92, evidenceCount: 6, evidenceItems: [], verifiedByCertificate: true },
      { name: 'Market Research', category: 'Strategy', masteryPercentage: 88, evidenceCount: 5, evidenceItems: [], verifiedByCertificate: true },
    ],
    projects: [
      {
        id: 'p-marcus-1',
        title: 'Southeast Asia SaaS Expansion Case Study',
        description: 'Detailed 3-year pro forma cash flow modeling and unit economics sensitivity analysis.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
        skills: ['Financial Modeling', 'Market Research', 'Presentation'],
        tools: ['Excel', 'Tableau', 'PowerPoint'],
        role: 'Strategy Consultant',
        completedDate: 'April 2026',
        isFeatured: true,
        order: 1,
      },
    ],
    certificates: [],
    education: [],
    experience: [],
    achievements: [],
    publications: [],
    completeness: { score: 85, level: 'Professional', items: [] },
  },
  {
    id: 'portfolio-aisha-patel',
    userId: 'usr-aisha',
    name: 'Aisha Patel',
    headline: 'Growth Marketing Engineer & Performance Analytics Specialist',
    bio: 'Data-informed marketer orchestrating conversion rate optimization, multivariate A/B testing sprints, and algorithmic retention funnels.',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
    learningGoal: 'Director of Growth & Product Analytics',
    location: 'Austin, TX',
    visibility: 'public',
    theme: 'professional',
    shareableSlug: 'aisha-patel',
    lastUpdated: 'May 2026',
    sections: [],
    skills: [
      { name: 'Growth Marketing', category: 'Marketing', masteryPercentage: 91, evidenceCount: 5, evidenceItems: [], verifiedByCertificate: true },
      { name: 'A/B Testing', category: 'Analytics', masteryPercentage: 89, evidenceCount: 4, evidenceItems: [], verifiedByCertificate: true },
    ],
    projects: [],
    certificates: [],
    education: [],
    experience: [],
    achievements: [],
    publications: [],
    completeness: { score: 80, level: 'Professional', items: [] },
  },
  {
    id: 'portfolio-carlos-mendez',
    userId: 'usr-carlos',
    name: 'Carlos Mendez',
    headline: 'Mobile Software Engineer & Offline-First Specialist',
    bio: 'Crafting 60fps React Native experiences backed by embedded SQLite engines and real-time mesh synchronization.',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200',
    learningGoal: 'Staff Mobile Systems Architect',
    location: 'Toronto, Canada',
    visibility: 'public',
    theme: 'minimal',
    shareableSlug: 'carlos-mendez',
    lastUpdated: 'March 2026',
    sections: [],
    skills: [
      { name: 'React Native', category: 'Mobile', masteryPercentage: 94, evidenceCount: 6, evidenceItems: [], verifiedByCertificate: true },
      { name: 'SQLite', category: 'Databases', masteryPercentage: 86, evidenceCount: 4, evidenceItems: [], verifiedByCertificate: true },
    ],
    projects: [],
    certificates: [],
    education: [],
    experience: [],
    achievements: [],
    publications: [],
    completeness: { score: 82, level: 'Professional', items: [] },
  },
];
