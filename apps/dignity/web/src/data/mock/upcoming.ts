import { NotificationItem, UpcomingEvent } from '../../types';

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Live Workshop Starting Soon',
    message: 'Marcus Vance is hosting "Live Debugging of Raft Partition Failures" at 5:00 PM EST today.',
    timestamp: '25 min ago',
    read: false,
    type: 'course',
  },
  {
    id: 'notif-2',
    title: 'Quiz Feedback Available',
    message: 'Your score for "Module 1 Knowledge Benchmark" was 95%. Review instructor notes.',
    timestamp: '2 hours ago',
    read: false,
    type: 'deadline',
  },
  {
    id: 'notif-3',
    title: 'Achievement Unlocked: Consistency Flame',
    message: 'You have logged into your learning schedule 12 days in a row! Keep going.',
    timestamp: '1 day ago',
    read: true,
    type: 'achievement',
  },
  {
    id: 'notif-4',
    title: 'New Course Released in AI Track',
    message: 'Generative AI & LLM Systems Engineering is now available in your enrolled path.',
    timestamp: '3 days ago',
    read: true,
    type: 'system',
  },
];

export const mockUpcomingEvents: UpcomingEvent[] = [
  {
    id: 'event-1',
    title: 'React Advanced',
    type: 'live_class',
    courseTitle: 'Modern React Development',
    scheduledTime: 'Today 19:00',
    durationMinutes: 60,
    instructorName: 'Sarah Jenkins',
    linkText: 'Join class',
  },
  {
    id: 'event-2',
    title: 'Build REST API',
    type: 'assignment_due',
    courseTitle: 'REST API Design',
    scheduledTime: 'Due tomorrow',
    durationMinutes: 45,
    linkText: 'View assignment',
  },
  {
    id: 'event-3',
    title: 'PostgreSQL Indexing & Optimization',
    type: 'quiz_due',
    courseTitle: 'PostgreSQL Fundamentals',
    scheduledTime: 'Due in 3 days',
    durationMinutes: 20,
    linkText: 'Take quiz',
  },
  {
    id: 'event-4',
    title: 'Full-Stack Architecture 1-on-1',
    type: 'mentorship_session',
    courseTitle: 'Mentorship Program',
    scheduledTime: 'Thursday 15:00',
    durationMinutes: 30,
    instructorName: 'Dr. Elena Rostova',
    linkText: 'Join session',
  },
];
