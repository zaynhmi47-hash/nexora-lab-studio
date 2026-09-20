import React from 'react';
import { Award, ChevronRight, TrendingUp, Sparkles } from 'lucide-react';
import { Card, CardBody } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';

export interface SkillItem {
  name: string;
  level: number; // 0 - 100
}

export interface SkillProgressSectionProps {
  skills: SkillItem[];
  onSelectSkill: (skill: SkillItem) => void;
}

export const SkillProgressSection: React.FC<SkillProgressSectionProps> = ({
  skills,
  onSelectSkill,
}) => {
  // Color classification based on level
  const getSkillVariant = (level: number) => {
    if (level >= 80) return 'primary';
    if (level >= 60) return 'success';
    if (level >= 40) return 'warning';
    return 'neutral';
  };

  const getTierLabel = (level: number) => {
    if (level >= 85) return 'Mastery';
    if (level >= 70) return 'Proficient';
    if (level >= 50) return 'Intermediate';
    return 'Developing';
  };

  return (
    <section aria-labelledby="skills-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Competency Radar
          </span>
          <h2
            id="skills-heading"
            className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight"
          >
            Your Skills
          </h2>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          Tap a skill for benchmark
        </span>
      </div>

      <Card elevation="subtle" className="border border-slate-200/90 dark:border-slate-800/90">
        <CardBody className="p-4 sm:p-5">
          <div className="space-y-3.5">
            {skills.map((skill) => {
              const tier = getTierLabel(skill.level);
              return (
                <button
                  key={skill.name}
                  onClick={() => onSelectSkill(skill)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60 transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {skill.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {tier}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-900 dark:text-white font-mono">
                        {skill.level}%
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>

                  <ProgressBar
                    value={skill.level}
                    max={100}
                    variant={getSkillVariant(skill.level) as any}
                    size="sm"
                    showValue={false}
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>+6% average growth this month</span>
            </span>
            <span className="text-[11px] text-slate-400">Verified via Coding Assessments</span>
          </div>
        </CardBody>
      </Card>
    </section>
  );
};
