import type { DetailedCourse } from '../../types/courseExperience';
import { mockDetailedCourses } from '../../data/mock/courseExperienceData';

export interface CourseService {
  getCourseById(courseId: string): Promise<DetailedCourse | null>;
  enrollInCourse(courseId: string): Promise<DetailedCourse>;
}

const cloneCourse = (course: DetailedCourse): DetailedCourse => ({
  ...course,
  detailedModules: course.detailedModules.map((module) => ({
    ...module,
    lessons: module.lessons.map((lesson) => ({
      ...lesson,
      resources: lesson.resources ? [...lesson.resources] : lesson.resources,
      activities: lesson.activities ? [...lesson.activities] : lesson.activities,
      learningObjectives: lesson.learningObjectives
        ? [...lesson.learningObjectives]
        : lesson.learningObjectives,
    })),
  })),
  projects: course.projects.map((project) => ({
    ...project,
    requirements: [...project.requirements],
    skills: [...project.skills],
    milestones: project.milestones.map((milestone) => ({ ...milestone })),
    submission: project.submission
      ? { ...project.submission }
      : project.submission,
  })),
  assessments: course.assessments.map((assessment) => ({
    ...assessment,
    skillsAssessed: assessment.skillsAssessed.map((skill) => ({ ...skill })),
    activities: [...assessment.activities],
  })),
  reviews: course.reviews.map((review) => ({ ...review })),
  prerequisites: course.prerequisites.map((prerequisite) => ({
    ...prerequisite,
  })),
  skills: course.skills.map((skill) => ({ ...skill })),
  recommendedNextCourses: [...course.recommendedNextCourses],
  whatYouWillLearn: [...course.whatYouWillLearn],
  requirements: [...course.requirements],
  courseIncludes: { ...course.courseIncludes },
  certificateEligibility: { ...course.certificateEligibility },
});

export const courseService: CourseService = {
  async getCourseById(courseId) {
    const course = mockDetailedCourses.find((item) => item.id === courseId);

    return course ? cloneCourse(course) : null;
  },

  async enrollInCourse(courseId) {
    const course = mockDetailedCourses.find((item) => item.id === courseId);

    if (!course) {
      throw new Error(`Course not found: ${courseId}`);
    }

    const enrolledCourse = cloneCourse(course);

    return {
      ...enrolledCourse,
      enrollmentStatus: 'in_progress',
      progressPercent: enrolledCourse.progressPercent ?? 0,
      lastStudiedAt: enrolledCourse.lastStudiedAt ?? new Date().toISOString(),
    };
  },
};
