import React from 'react';
import {
  FolderGit2,
  Heart,
  MessageSquare,
  Eye,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { ProjectShowcase } from '../../../types/community';
import { Badge } from '../../../components/ui/Badge';

export interface ProjectShowcaseCardProps {
  project: ProjectShowcase;
  onSelect: (project: ProjectShowcase) => void;
  onLike?: (id: string) => void;
}

export const ProjectShowcaseCard: React.FC<ProjectShowcaseCardProps> = ({
  project,
  onSelect,
  onLike,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 rounded-2xl overflow-hidden transition-all shadow-xs hover:shadow-md flex flex-col justify-between">
      <div>
        {/* Cover thumbnail */}
        <div className="h-44 w-full relative overflow-hidden bg-slate-800 cursor-pointer" onClick={() => onSelect(project)}>
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

          <div className="absolute top-3 right-3">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md ${
                project.completionStatus === 'Completed'
                  ? 'bg-emerald-600/90 text-white'
                  : 'bg-amber-600/90 text-white'
              }`}
            >
              {project.completionStatus}
            </span>
          </div>

          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-2">
              <img
                src={project.creator.avatar}
                alt={project.creator.name}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-white/50"
                referrerPolicy="no-referrer"
              />
              <span className="font-semibold drop-shadow-xs">{project.creator.name}</span>
            </div>
            {project.courseTitle && (
              <span className="text-[11px] text-slate-300 drop-shadow-xs truncate max-w-[150px]">
                {project.courseTitle}
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 sm:p-5">
          <h3
            onClick={() => onSelect(project)}
            className="text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors cursor-pointer"
          >
            {project.title}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {project.description}
          </p>

          {/* Skills pills */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {project.skills.map((s) => (
              <span
                key={s}
                className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer engagement */}
      <div className="px-4 py-3 sm:px-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onLike?.(project.id)}
            className={`inline-flex items-center gap-1 font-semibold transition-colors ${
              project.userLiked ? 'text-rose-600 dark:text-rose-400' : 'hover:text-rose-600'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${project.userLiked ? 'fill-rose-500' : ''}`} />
            <span>{project.likesCount}</span>
          </button>

          <span className="inline-flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{project.commentsCount}</span>
          </span>

          <span className="inline-flex items-center gap-1 text-[11px]">
            <Eye className="w-3.5 h-3.5" />
            <span>{project.viewsCount}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => onSelect(project)}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
        >
          View Project →
        </button>
      </div>
    </div>
  );
};
