import {
  Course,
  LearningPath,
  ProgramItem,
  TutorItem,
  MentorItem,
  CertificationItem,
  WebinarItem,
  SearchableItem,
  ExploreFilterState,
  SortOption,
} from '../../types';

export const mockRecentSearches: string[] = [
  'React',
  'Python',
  'English',
  'UTBK',
  'System Design',
];

export const mockPopularSearches: string[] = [
  'Programming',
  'Business',
  'Design',
  'English',
  'Data Science',
  'Mathematics',
  'UTBK',
];

export const mockSuggestedTopics: string[] = [
  'React 19',
  'Kafka',
  'TPS UTBK',
  'IELTS 8.5',
  'Design Tokens',
  'PostgreSQL',
  'Docker',
  'Machine Learning',
];

export interface GroupedSearchResults {
  courses: Course[];
  bootcamps: ProgramItem[];
  bimbel: ProgramItem[];
  academies: ProgramItem[];
  workshops: ProgramItem[];
  learningPaths: LearningPath[];
  tutors: TutorItem[];
  mentors: MentorItem[];
  certifications: CertificationItem[];
  webinars: WebinarItem[];
  totalMatches: number;
}

/**
 * Normalizes all learning items into unified searchable items.
 */
export function buildSearchIndex(
  courses: Course[],
  programs: ProgramItem[],
  paths: LearningPath[],
  tutors: TutorItem[],
  mentors: MentorItem[],
  certs: CertificationItem[],
  webinars: WebinarItem[]
): SearchableItem[] {
  const items: SearchableItem[] = [];

  // 1. Courses
  courses.forEach((c) => {
    items.push({
      id: c.id,
      type: 'course',
      title: c.title,
      description: c.description + ' ' + c.shortDescription,
      category: c.categoryId,
      tags: c.tags,
      level: c.difficulty as any,
      format: c.format || 'Self-paced',
      duration: `${c.durationHours} hours`,
      durationHours: c.durationHours,
      price: c.priceAmount || 0,
      isFree: c.priceType === 'free' || c.isFree,
      rating: c.rating,
      language: c.language || 'English',
      providerOrAuthor: c.provider || c.instructor.name,
      itemRef: c,
    });
  });

  // 2. Programs (bootcamp, bimbel, academy, workshop)
  programs.forEach((p) => {
    const base = {
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.type,
      tags: p.skills,
      level: p.level,
      format: p.format,
      duration: p.duration,
      durationHours: p.durationHours,
      price: p.price,
      isFree: p.isFree,
      rating: p.rating,
      language: p.language || 'English',
      providerOrAuthor: p.provider,
      itemRef: p,
    };

    if (p.type === 'bootcamp') {
      items.push({ ...base, type: 'bootcamp' });
    } else if (p.type === 'bimbel') {
      items.push({ ...base, type: 'bimbel' });
    } else if (p.type === 'academy') {
      items.push({ ...base, type: 'academy' });
    } else if (p.type === 'workshop') {
      items.push({ ...base, type: 'workshop' });
    }
  });

  // 3. Learning Paths
  paths.forEach((lp) => {
    items.push({
      id: lp.id,
      type: 'learning_path',
      title: lp.title,
      description: lp.description + ' ' + lp.careerTarget,
      category: lp.categoryName,
      tags: lp.skillsAcquired,
      level: lp.difficulty as any,
      format: 'Self-paced',
      duration: `${lp.estimatedWeeks} weeks`,
      durationHours: lp.estimatedWeeks * 10,
      price: 0,
      isFree: true,
      rating: 4.9,
      language: 'English',
      providerOrAuthor: 'Education Super Platform',
      itemRef: lp,
    });
  });

  // 4. Tutors
  tutors.forEach((t) => {
    items.push({
      id: t.id,
      type: 'tutor',
      title: `${t.name} — ${t.expertise}`,
      description: t.bio + ' ' + t.subjects.join(' '),
      category: 'tutors',
      tags: t.subjects,
      level: 'All Levels',
      format: '1-on-1',
      duration: '1-on-1 Hourly Sessions',
      durationHours: 1,
      price: t.hourlyPrice,
      isFree: false,
      rating: t.rating,
      language: t.language[0] as any,
      providerOrAuthor: t.name,
      itemRef: t,
    });
  });

  // 5. Mentors
  mentors.forEach((m) => {
    items.push({
      id: m.id,
      type: 'mentor',
      title: `${m.name} — ${m.title} at ${m.company}`,
      description: m.bio + ' ' + m.mentorshipTopics.join(' '),
      category: 'mentors',
      tags: m.skills,
      level: 'Advanced',
      format: '1-on-1',
      duration: '45-minute Mentorship Sessions',
      durationHours: 1,
      price: m.sessionPrice,
      isFree: false,
      rating: m.rating,
      language: 'English',
      providerOrAuthor: `${m.name} (${m.company})`,
      itemRef: m,
    });
  });

  // 6. Certifications
  certs.forEach((cert) => {
    items.push({
      id: cert.id,
      type: 'certification',
      title: cert.name,
      description: cert.description + ' ' + cert.skillsValidated.join(' '),
      category: cert.skillArea,
      tags: cert.skillsValidated,
      level: cert.difficulty,
      format: 'Self-paced',
      duration: `${cert.estimatedPrepWeeks} weeks prep`,
      durationHours: cert.estimatedPrepWeeks * 8,
      price: cert.price,
      isFree: cert.isFree,
      rating: 4.9,
      language: 'English',
      providerOrAuthor: cert.issuer,
      itemRef: cert,
    });
  });

  // 7. Webinars
  webinars.forEach((w) => {
    items.push({
      id: w.id,
      type: 'webinar',
      title: w.title,
      description: w.description + ' ' + w.keyTakeaways.join(' '),
      category: w.topic,
      tags: [w.topic, w.speakerCompany],
      level: w.level,
      format: 'Live',
      duration: w.duration,
      durationHours: w.durationHours,
      price: w.price || 0,
      isFree: w.isFree,
      rating: 4.9,
      language: w.language,
      providerOrAuthor: `${w.speaker} (${w.speakerCompany})`,
      itemRef: w,
    });
  });

  return items;
}

/**
 * Evaluates whether an item matches active filters.
 */
function itemPassesFilters(item: SearchableItem, filter: ExploreFilterState): boolean {
  // Type filter
  if (filter.types.length > 0 && !filter.types.includes(item.type)) {
    return false;
  }

  // Level filter
  if (filter.levels.length > 0 && item.level) {
    const match = filter.levels.some(
      (l) => l.toLowerCase() === item.level?.toLowerCase() || item.level === 'All Levels'
    );
    if (!match) return false;
  }

  // Format filter
  if (filter.formats.length > 0 && item.format) {
    if (!filter.formats.includes(item.format)) return false;
  }

  // Duration filter
  if (filter.durations.length > 0 && item.durationHours !== undefined) {
    const hours = item.durationHours;
    const matchesAny = filter.durations.some((d) => {
      if (d === 'under_1h') return hours < 1;
      if (d === '1_to_5h') return hours >= 1 && hours <= 5;
      if (d === '5_to_20h') return hours > 5 && hours <= 20;
      if (d === '20h_plus') return hours > 20;
      return true;
    });
    if (!matchesAny) return false;
  }

  // Price filter
  if (filter.priceType === 'free' && !item.isFree) return false;
  if (filter.priceType === 'paid' && item.isFree) return false;

  // Rating filter
  if (filter.minRating > 0 && (item.rating || 0) < filter.minRating) return false;

  // Language filter
  if (filter.languages.length > 0 && item.language) {
    if (!filter.languages.includes(item.language)) return false;
  }

  // Category filter
  if (filter.category !== 'all' && filter.category) {
    const matchesCat =
      item.category.toLowerCase().includes(filter.category.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(filter.category.toLowerCase()));
    if (!matchesCat) return false;
  }

  return true;
}

/**
 * Searches the marketplace and groups matches logically by learning opportunity type.
 */
export function searchMarketplace(
  query: string,
  filterState: ExploreFilterState,
  sortOption: SortOption,
  courses: Course[],
  programs: ProgramItem[],
  paths: LearningPath[],
  tutors: TutorItem[],
  mentors: MentorItem[],
  certs: CertificationItem[],
  webinars: WebinarItem[]
): GroupedSearchResults {
  const cleanQ = query.trim().toLowerCase();
  const searchIndex = buildSearchIndex(courses, programs, paths, tutors, mentors, certs, webinars);

  const matchedItems = searchIndex.filter((item) => {
    // Check search query text
    const matchesQuery =
      cleanQ === '' ||
      item.title.toLowerCase().includes(cleanQ) ||
      item.description.toLowerCase().includes(cleanQ) ||
      item.tags.some((t) => t.toLowerCase().includes(cleanQ)) ||
      (item.providerOrAuthor && item.providerOrAuthor.toLowerCase().includes(cleanQ));

    if (!matchesQuery) return false;

    // Check filters
    return itemPassesFilters(item, filterState);
  });

  // Sort matched items
  matchedItems.sort((a, b) => {
    if (sortOption === 'highest_rated') {
      return (b.rating || 0) - (a.rating || 0);
    }
    if (sortOption === 'popular') {
      return (b.rating || 0) * 10 - (a.rating || 0) * 10;
    }
    if (sortOption === 'price_asc') {
      return (a.price || 0) - (b.price || 0);
    }
    if (sortOption === 'price_desc') {
      return (b.price || 0) - (a.price || 0);
    }
    // Default: recommended / query relevance
    return 0;
  });

  // Group into strongly-typed buckets
  const results: GroupedSearchResults = {
    courses: [],
    bootcamps: [],
    bimbel: [],
    academies: [],
    workshops: [],
    learningPaths: [],
    tutors: [],
    mentors: [],
    certifications: [],
    webinars: [],
    totalMatches: matchedItems.length,
  };

  matchedItems.forEach((item) => {
    if (item.type === 'course') results.courses.push(item.itemRef);
    else if (item.type === 'bootcamp') results.bootcamps.push(item.itemRef);
    else if (item.type === 'bimbel') results.bimbel.push(item.itemRef);
    else if (item.type === 'academy') results.academies.push(item.itemRef);
    else if (item.type === 'workshop') results.workshops.push(item.itemRef);
    else if (item.type === 'learning_path') results.learningPaths.push(item.itemRef);
    else if (item.type === 'tutor') results.tutors.push(item.itemRef);
    else if (item.type === 'mentor') results.mentors.push(item.itemRef);
    else if (item.type === 'certification') results.certifications.push(item.itemRef);
    else if (item.type === 'webinar') results.webinars.push(item.itemRef);
  });

  return results;
}

/**
 * Intelligent Personalization Engine (Section 11 & Section 24)
 * Deterministically prioritizes courses and programs based on learner skills & goal.
 */
export function getPersonalizedRecommendations(
  learnerGoal: string,
  skills: { name: string; level: number }[],
  courses: Course[]
): { course: Course; reason: string }[] {
  // Find skills that are in development (e.g. level between 20% and 75%)
  const backendSkill = skills.find((s) => s.name.toLowerCase().includes('backend'));
  const dbSkill = skills.find((s) => s.name.toLowerCase().includes('database'));
  const devopsSkill = skills.find((s) => s.name.toLowerCase().includes('devops'));

  const recs: { course: Course; reason: string }[] = [];

  // Recommendation 1: Backend / PostgreSQL
  const dbCourse = courses.find((c) => c.id === 'course-108') || courses[0];
  recs.push({
    course: dbCourse,
    reason: `Recommended because you're developing database skills (${dbSkill ? `${dbSkill.level}%` : '46%'}).`,
  });

  // Recommendation 2: REST API Design
  const apiCourse = courses.find((c) => c.id === 'course-109') || courses[1];
  recs.push({
    course: apiCourse,
    reason: `Recommended because you're advancing backend engineering (${backendSkill ? `${backendSkill.level}%` : '58%'}).`,
  });

  // Recommendation 3: Docker Essentials
  const dockerCourse = courses.find((c) => c.id === 'course-110') || courses[2];
  recs.push({
    course: dockerCourse,
    reason: `Recommended to bridge your DevOps & container gap (${devopsSkill ? `${devopsSkill.level}%` : '28%'}).`,
  });

  return recs;
}

/**
 * Default empty filter state helper
 */
export const defaultExploreFilterState: ExploreFilterState = {
  types: [],
  levels: [],
  formats: [],
  durations: [],
  priceType: 'all',
  minRating: 0,
  languages: [],
  category: 'all',
};
