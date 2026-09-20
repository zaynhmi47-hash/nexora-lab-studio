import React from 'react';
import { DetailedCourse } from '../../../types/courseExperience';
import { Card } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Badge } from '../../../components/ui/Badge';
import { Sparkles, ArrowUpRight, Award, Target } from 'lucide-react';

interface CourseSkillsTabProps {
  course: DetailedCourse;
  onPracticeSkill?: (skillId: string, skillName: string) => void;
}

export const CourseSkillsTab: React.FC<CourseSkillsTabProps> = ({
  course,
  onPracticeSkill,
}) => {
  const getStatusBadge = (level: number) => {
    if (level >= 90) return <Badge variant="success" size="sm">Mastered</Badge>;
    if (level >= 75) return <Badge variant="primary" size="sm">Proficient</Badge>;
    if (level >= 50) return <Badge variant="warning" size="sm">Practicing</Badge>;
    return <Badge variant="neutral" size="sm">Learning</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Skills You Will Develop
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Every lesson and assessment continuously measures and levels up your verified competencies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {course.skills.map((skill) => (
          <Card
            key={skill.id}
            padding="md"
            className="flex flex-col justify-between border-slate-200/80 dark:border-slate-800 hover:border-blue-400/50 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {skill.category}
                </span>
                {getStatusBadge(skill.level)}
              </div>

              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-2">
                {skill.name}
              </h4>

              <div className="space-y-1.5 my-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span>Mastery Level</span>
                  <span>{skill.level}%</span>
                </div>
                <ProgressBar
                  value={skill.level}
                  size="md"
                  color={skill.level >= 80 ? 'success' : skill.level >= 50 ? 'primary' : 'warning'}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-blue-500" />
                Adaptive practice available
              </span>

              {onPracticeSkill && (
                <button
                  type="button"
                  onClick={() => onPracticeSkill(skill.id, skill.name)}
                  className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>Drill Skill</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Global Mastery Radar note */}
      <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/40 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            Seamless Global Skill Synchronization
          </h5>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Completing interactive activities inside this course instantly updates your profile's
            Competency Radar and Daily Missions on your Home Dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};
