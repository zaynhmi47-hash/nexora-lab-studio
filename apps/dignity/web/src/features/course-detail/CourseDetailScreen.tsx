import React, { useState, useEffect } from 'react';
import { Course, AppRoute } from '../../types';
import { DetailedCourse, DetailedLesson } from '../../types/courseExperience';
import { courseService } from '../../services/course/courseService';
import { mockDetailedCourses } from '../../data/mock/courseExperienceData';
import { Breadcrumb } from '../../components/navigation/Breadcrumb';
import { Badge } from '../../components/ui/Badge';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Card } from '../../components/ui/Card';

// Tabs
import { CourseOverviewTab } from './components/CourseOverviewTab';
import { CourseCurriculumTab } from './components/CourseCurriculumTab';
import { CourseSkillsTab } from './components/CourseSkillsTab';
import { CourseProjectsTab } from './components/CourseProjectsTab';
import { CourseInstructorTab } from './components/CourseInstructorTab';
import { CourseReviewsTab } from './components/CourseReviewsTab';
import { CourseCompletionModal } from './components/CourseCompletionModal';

import {
  Clock,
  BookOpen,
  Star,
  Users,
  PlayCircle,
  CheckCircle2,
  Bookmark,
  Award,
  Layers,
  Sparkles,
  Share2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export interface CourseDetailScreenProps {
  course: Course | DetailedCourse;
  onBack: () => void;
  onNavigate: (route: AppRoute, params?: any) => void;
  onStartLesson?: (lessonId: string, courseId: string) => void;
  onOpenProject?: (projectId: string, courseTitle?: string) => void;
  onOpenAssessment?: (assessmentId: string, courseTitle?: string) => void;
  onPracticeSkill?: (skillId: string, skillName: string) => void;
}

export const CourseDetailScreen: React.FC<CourseDetailScreenProps> = ({
  course: initialCourse,
  onBack,
  onNavigate,
  onStartLesson,
  onOpenProject,
  onOpenAssessment,
  onPracticeSkill,
}) => {
  // Detailed course state from service
  const [detailedCourse, setDetailedCourse] = useState<DetailedCourse | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'skills' | 'projects' | 'instructor' | 'reviews'>('overview');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    async function load() {
      // Find matching detailed course or fallback to first detailed course
      const match = await courseService.getCourseById(initialCourse.id);
      if (match) {
        setDetailedCourse(match);
      } else {
        // Adapt or fallback to rich mock
        const fallback = mockDetailedCourses[0];
        setDetailedCourse({
          ...fallback,
          id: initialCourse.id,
          title: initialCourse.title,
          description: initialCourse.description,
          thumbnailUrl: initialCourse.thumbnailUrl || fallback.thumbnailUrl,
          categoryName: initialCourse.categoryName || fallback.categoryName,
          difficulty: initialCourse.difficulty || fallback.difficulty,
          studentsCount: initialCourse.studentsCount || fallback.studentsCount,
          rating: initialCourse.rating || fallback.rating,
          ratingCount: initialCourse.ratingCount || fallback.ratingCount,
          enrollmentStatus: initialCourse.enrollmentStatus || 'not_enrolled',
          progressPercent: initialCourse.progressPercent ?? 0,
        });
      }
    }
    load();
  }, [initialCourse]);

  if (!detailedCourse) {
    return (
      <div className="min-h-96 flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const isEnrolled = detailedCourse.enrollmentStatus !== 'not_enrolled';
  const isCompleted = detailedCourse.enrollmentStatus === 'completed' || detailedCourse.progressPercent === 100;

  const handleEnroll = async () => {
    const updated = await courseService.enrollInCourse(detailedCourse.id);
    setDetailedCourse({ ...updated });
  };

  const handleResumeLearning = () => {
    // Locate first in_progress or available lesson
    let targetLessonId: string | undefined;
    for (const mod of detailedCourse.detailedModules) {
      const found = mod.lessons.find((l) => l.status === 'in_progress' || (l.status === 'available' && !l.isLocked));
      if (found) {
        targetLessonId = found.id;
        break;
      }
    }
    if (!targetLessonId && detailedCourse.detailedModules.length > 0) {
      targetLessonId = detailedCourse.detailedModules[0].lessons[0].id;
    }

    if (onStartLesson && targetLessonId) {
      onStartLesson(targetLessonId, detailedCourse.id);
    } else {
      onNavigate('lesson-view', { lessonId: targetLessonId, courseId: detailedCourse.id });
    }
  };

  const handleSelectLessonFromCurriculum = (lesson: DetailedLesson) => {
    if (onStartLesson) {
      onStartLesson(lesson.id, detailedCourse.id);
    } else {
      onNavigate('lesson-view', { lessonId: lesson.id, courseId: detailedCourse.id });
    }
  };

  const handleOpenProjectWorkspace = (projectId: string) => {
    if (onOpenProject) {
      onOpenProject(projectId, detailedCourse.title);
    } else {
      onNavigate('project-view', { projectId, courseTitle: detailedCourse.title });
    }
  };

  const handleOpenAssessmentRunner = (assessmentId: string) => {
    if (onOpenAssessment) {
      onOpenAssessment(assessmentId, detailedCourse.title);
    } else {
      onNavigate('assessment-view', { assessmentId, courseTitle: detailedCourse.title });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Home', onClick: onBack },
          { label: 'Explore', onClick: () => onNavigate('explore') },
          { label: detailedCourse.categoryName, onClick: () => onNavigate('explore') },
          { label: detailedCourse.title, isCurrent: true },
        ]}
      />

      {/* Hero Course Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Hero Left */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="primary" size="sm">
                {detailedCourse.categoryName}
              </Badge>
              <Badge variant="default" size="sm">
                {detailedCourse.difficulty}
              </Badge>
              {detailedCourse.isFeatured && (
                <Badge variant="warning" size="sm">
                  Featured Masterclass
                </Badge>
              )}
              {isCompleted && (
                <Badge variant="success" size="sm" className="gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {detailedCourse.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {detailedCourse.description}
            </p>

            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 font-semibold text-amber-500">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{detailedCourse.rating.toFixed(1)}</span>
                <span className="text-slate-400 font-normal">({detailedCourse.ratingCount} ratings)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-500" />
                <span>{detailedCourse.studentsCount.toLocaleString()} learners enrolled</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{detailedCourse.durationHours} hours total</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <span>{detailedCourse.courseIncludes.lessonsCount} lessons</span>
              </div>
            </div>

            {/* Instructor Highlight Snippet */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <img
                src={detailedCourse.instructor.avatarUrl}
                alt={detailedCourse.instructor.name}
                className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {detailedCourse.instructor.name}
                  </h4>
                  {detailedCourse.instructor.isVerified && (
                    <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{detailedCourse.instructor.headline}</p>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                  {detailedCourse.instructor.organization}
                </p>
              </div>
            </div>
          </div>

          {/* Action / Enrollment Box (Right Column) */}
          <div className="lg:col-span-1">
            <Card padding="md" className="sticky top-24 border-2 border-blue-500/20 shadow-md">
              <div className="aspect-16/9 rounded-2xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-800 relative">
                <img
                  src={detailedCourse.thumbnailUrl}
                  alt={detailedCourse.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleResumeLearning}
                    className="w-12 h-12 rounded-full bg-white/90 dark:bg-slate-900/90 text-blue-600 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                    aria-label="Preview course"
                  >
                    <PlayCircle className="w-7 h-7 ml-0.5" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {detailedCourse.priceType === 'free' ? 'Free Access' : `$${detailedCourse.priceAmount}`}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Full lifetime access</span>
                </div>
              </div>

              {isEnrolled ? (
                <div className="space-y-3 mb-4">
                  <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60">
                    <div className="flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1.5">
                      <span>Course Progress</span>
                      <span>{detailedCourse.progressPercent}%</span>
                    </div>
                    <ProgressBar value={detailedCourse.progressPercent} size="sm" />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-1">
                      Current: {detailedCourse.currentLessonTitle || 'Foundations & Architecture'}
                    </p>
                  </div>

                  <PrimaryButton
                    fullWidth
                    size="lg"
                    leftIcon={<PlayCircle className="w-5 h-5" />}
                    onClick={handleResumeLearning}
                  >
                    {isCompleted ? 'Review Course Material' : 'Resume Learning'}
                  </PrimaryButton>

                  {isCompleted && (
                    <SecondaryButton
                      fullWidth
                      size="md"
                      leftIcon={<Award className="w-4 h-4 text-amber-500" />}
                      onClick={() => setShowCompletionModal(true)}
                    >
                      View Certificate of Completion
                    </SecondaryButton>
                  )}
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  <PrimaryButton fullWidth size="lg" onClick={handleEnroll}>
                    Enroll in Course Now
                  </PrimaryButton>
                  <SecondaryButton
                    fullWidth
                    size="md"
                    leftIcon={<Bookmark className="w-4 h-4" />}
                    onClick={() => setIsBookmarked(!isBookmarked)}
                  >
                    {isBookmarked ? 'Saved to Wishlist' : 'Save to Wishlist'}
                  </SecondaryButton>
                </div>
              )}

              {/* Includes Matrix Checklist */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{detailedCourse.courseIncludes.lessonsCount} interactive lessons & drills</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{detailedCourse.courseIncludes.projectsCount} capstone portfolio projects</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Verified completion certificate included</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Automated AI code review & mentor checks</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'curriculum', label: `Curriculum (${detailedCourse.courseIncludes.lessonsCount})` },
          { id: 'skills', label: `Skills (${detailedCourse.skills.length})` },
          { id: 'projects', label: `Projects (${detailedCourse.projects.length})` },
          { id: 'instructor', label: 'Instructor' },
          { id: 'reviews', label: `Reviews (${detailedCourse.reviews.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'overview' && (
          <CourseOverviewTab
            course={detailedCourse}
            onNavigateToCourse={(id) => onNavigate('course-detail', { courseId: id })}
            onNavigateToPath={() => onNavigate('learning')}
          />
        )}

        {activeTab === 'curriculum' && (
          <CourseCurriculumTab
            course={detailedCourse}
            onSelectLesson={handleSelectLessonFromCurriculum}
            onSelectProject={handleOpenProjectWorkspace}
            onSelectAssessment={handleOpenAssessmentRunner}
          />
        )}

        {activeTab === 'skills' && (
          <CourseSkillsTab
            course={detailedCourse}
            onPracticeSkill={(skillId, skillName) => {
              if (onPracticeSkill) {
                onPracticeSkill(skillId, skillName);
              } else {
                onNavigate('practice');
              }
            }}
          />
        )}

        {activeTab === 'projects' && (
          <CourseProjectsTab
            course={detailedCourse}
            onOpenProject={handleOpenProjectWorkspace}
          />
        )}

        {activeTab === 'instructor' && (
          <CourseInstructorTab instructor={detailedCourse.instructor} />
        )}

        {activeTab === 'reviews' && (
          <CourseReviewsTab
            reviews={detailedCourse.reviews}
            rating={detailedCourse.rating}
            ratingCount={detailedCourse.ratingCount}
          />
        )}
      </div>

      {/* Certificate Completion Celebration Modal */}
      <CourseCompletionModal
        course={detailedCourse}
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onViewCertificate={() => {
          setShowCompletionModal(false);
          onNavigate('certificates');
        }}
        onExploreNext={() => {
          setShowCompletionModal(false);
          onNavigate('explore');
        }}
      />
    </div>
  );
};
