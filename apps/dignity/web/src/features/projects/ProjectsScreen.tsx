import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Filter,
  FolderKanban,
  Search,
  Star,
} from 'lucide-react';

import { mockProjects } from '../../data/mock/projectData';
import type { Project } from '../../types/project';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';

interface ProjectsScreenProps {
  onSelectProject: (project: Project) => void;
  onOpenWorkspace: (project: Project) => void;
}

type ProjectFilter = 'all' | 'in_progress' | 'completed' | 'available';

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({
  onSelectProject,
  onOpenWorkspace,
}) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ProjectFilter>('all');

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return mockProjects.filter((project) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'in_progress' && project.status === 'in_progress') ||
        (filter === 'completed' && project.status === 'completed') ||
        (filter === 'available' && project.status === 'available');

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        project.title,
        project.description,
        project.category,
        project.courseTitle,
        ...project.tags,
        ...project.requiredSkills,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [filter, query]);

  const stats = {
    total: mockProjects.length,
    completed: mockProjects.filter((project) => project.status === 'completed').length,
    inProgress: mockProjects.filter((project) => project.status === 'in_progress').length,
    available: mockProjects.filter((project) => project.status === 'available').length,
  };

  return (
    <main className="min-h-screen bg-[var(--surface-main)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--primary-main)]">
                <FolderKanban className="h-4 w-4" />
                Project Lab
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                Projects
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)] sm:text-base">
                Build practical projects, demonstrate your skills, and turn completed work
                into portfolio evidence.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total Projects" value={stats.total} icon={<FolderKanban />} />
          <StatCard label="In Progress" value={stats.inProgress} icon={<Clock3 />} />
          <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 />} />
          <StatCard label="Available" value={stats.available} icon={<BookOpen />} />
        </section>

        <Card padding="md">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
                aria-hidden="true"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects, skills, courses..."
                className="w-full rounded-xl border border-[var(--border-main)] bg-[var(--surface-main)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary-main)] focus:ring-2 focus:ring-[var(--primary-main)]/20"
                aria-label="Search projects"
              />
            </label>

            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              {([
                ['all', 'All'],
                ['in_progress', 'In Progress'],
                ['completed', 'Completed'],
                ['available', 'Available'],
              ] as const).map(([value, label]) => (
                <Button
                  key={value}
                  size="sm"
                  variant={filter === value ? 'primary' : 'outline'}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {filteredProjects.length === 0 ? (
          <Card padding="lg" className="text-center">
            <FolderKanban className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
            <h2 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">
              No projects found
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Try another search term or change the project filter.
            </p>
          </Card>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onSelect={() => onSelectProject(project)}
                onOpenWorkspace={() => onOpenWorkspace(project)}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  );
};

interface ProjectCardProps {
  project: Project;
  onSelect: () => void;
  onOpenWorkspace: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onSelect,
  onOpenWorkspace,
}) => {
  return (
    <Card
      variant="interactive"
      padding="none"
      className="overflow-hidden"
    >
      <button
        type="button"
        onClick={onSelect}
        className="block w-full text-left"
        aria-label={`Open ${project.title}`}
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-[var(--secondary-soft)]">
          <img
            src={project.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {project.isFeatured && (
              <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-sm">
                Featured
              </span>
            )}
            {project.isCapstone && (
              <span className="rounded-full bg-[var(--primary-main)] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                Capstone
              </span>
            )}
          </div>
        </div>
      </button>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary-main)]">
              {project.category}
            </p>
            <button
              type="button"
              onClick={onSelect}
              className="mt-1 text-left text-lg font-bold leading-tight text-[var(--text-primary)] hover:text-[var(--primary-main)]"
            >
              {project.title}
            </button>
          </div>

          <span className="shrink-0 rounded-lg bg-[var(--secondary-soft)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)]">
            {project.difficulty}
          </span>
        </div>

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">
          {project.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {project.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5">
            <Clock3 className="h-4 w-4" />
            {project.estimatedHours}h
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4" />
            {project.xpReward} XP
          </div>
        </div>

        <div className="mt-5">
          <ProgressBar
            value={project.progressPercent}
            label="Progress"
            showPercentText
            size="sm"
            variant={project.isCompleted ? 'success' : 'primary'}
          />
        </div>

        <div className="mt-5 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={onSelect}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            View Details
          </Button>

          <Button
            size="sm"
            fullWidth
            onClick={onOpenWorkspace}
          >
            {project.isCompleted ? 'Review Project' : 'Open Workspace'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => (
  <Card padding="sm">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary-main)]">
        {React.cloneElement(icon as React.ReactElement, {
          className: 'h-5 w-5',
        })}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
        <p className="truncate text-xs text-[var(--text-secondary)]">{label}</p>
      </div>
    </div>
  </Card>
);

export default ProjectsScreen;
