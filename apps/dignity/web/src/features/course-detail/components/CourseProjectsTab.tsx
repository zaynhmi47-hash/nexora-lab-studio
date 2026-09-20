import React from 'react';
import { DetailedCourse, CourseProject } from '../../../types/courseExperience';
import { Card } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Badge } from '../../../components/ui/Badge';
import { PrimaryButton, SecondaryButton } from '../../../components/ui/Button';
import {
  Code,
  CheckCircle2,
  Clock,
  Layers,
  Lock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface CourseProjectsTabProps {
  course: DetailedCourse;
  onOpenProject: (projectId: string) => void;
}

export const CourseProjectsTab: React.FC<CourseProjectsTabProps> = ({
  course,
  onOpenProject,
}) => {
  const getDifficultyBadge = (difficulty: CourseProject['difficulty']) => {
    switch (difficulty) {
      case 'Beginner':
        return <Badge variant="success" size="sm">Beginner</Badge>;
      case 'Intermediate':
        return <Badge variant="primary" size="sm">Intermediate</Badge>;
      case 'Advanced':
        return <Badge variant="warning" size="sm">Advanced</Badge>;
    }
  };

  const getStatusBadge = (status: CourseProject['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="success" size="sm" className="gap-1">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="primary" size="sm" className="gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> In Progress
          </Badge>
        );
      case 'locked':
        return (
          <Badge variant="neutral" size="sm" className="gap-1">
            <Lock className="w-3 h-3" /> Locked
          </Badge>
        );
      default:
        return <Badge variant="neutral" size="sm">Not Started</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Practical Hands-On Projects
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Build real software, integrate with GitHub, and receive automated and mentor evaluations.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {course.projects.map((project) => {
          const completedMilestones = project.milestones.filter((m) => m.completed).length;

          return (
            <Card
              key={project.id}
              padding="lg"
              className={`border transition-all ${
                project.status === 'locked'
                  ? 'border-slate-200/60 dark:border-slate-800/60 opacity-80'
                  : 'border-slate-200/90 dark:border-slate-800 hover:border-blue-500/40 shadow-2xs'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                {/* Left details */}
                <div className="space-y-3 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getDifficultyBadge(project.difficulty)}
                    {getStatusBadge(project.status)}
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      ~{project.estimatedHours} hours
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {project.title}
                  </h4>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Skills tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-400 mr-1">Skills:</span>
                    {project.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Progress & Action Box */}
                <div className="lg:w-72 shrink-0 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      <span>Project Milestones</span>
                      <span>
                        {completedMilestones} / {project.milestones.length}
                      </span>
                    </div>
                    <ProgressBar value={project.completionPercent} size="sm" />
                  </div>

                  {project.submission?.submittedAt && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Submitted on {project.submission.submittedAt}
                    </div>
                  )}

                  {project.status === 'locked' ? (
                    <button
                      disabled
                      className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Unlock by Progressing Course
                    </button>
                  ) : (
                    <PrimaryButton
                      fullWidth
                      size="sm"
                      onClick={() => onOpenProject(project.id)}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      {project.status === 'completed'
                        ? 'View Project Workspace'
                        : project.status === 'in_progress'
                        ? 'Continue Project'
                        : 'Start Project'}
                    </PrimaryButton>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
