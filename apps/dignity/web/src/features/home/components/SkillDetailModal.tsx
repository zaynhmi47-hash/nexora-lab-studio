import React from 'react';
import { Award, CheckCircle2, BookOpen, PlayCircle, X, TrendingUp, Sparkles, Target } from 'lucide-react';
import { Modal } from '../../../components/ui/Overlay';
import { PrimaryButton, SecondaryButton } from '../../../components/ui/Button';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { SkillItem } from './SkillProgressSection';

export interface SkillDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill: SkillItem | null;
  onStartPractice?: (skillName: string) => void;
}

export const SkillDetailModal: React.FC<SkillDetailModalProps> = ({
  isOpen,
  onClose,
  skill,
  onStartPractice,
}) => {
  if (!skill) return null;

  // Mock concepts tailored to skill name
  const getSkillConcepts = (name: string) => {
    switch (name.toLowerCase()) {
      case 'database':
        return {
          mastered: ['Relational Normalization (3NF)', 'Basic CRUD & Joins', 'ACID Transactions'],
          nextToLearn: ['B-Tree Indexing & EXPLAIN ANALYZE', 'Partitioning Strategies', 'Connection Pooling'],
          recommendedCourse: 'PostgreSQL Fundamentals & Query Optimization',
        };
      case 'react':
        return {
          mastered: ['Functional Components & Hooks', 'Context API & State Lifting', 'Custom Hooks Pattern'],
          nextToLearn: ['Server-Side Suspense & Streaming', 'Fiber Reconciler Architecture', 'Compiler Optimizations'],
          recommendedCourse: 'Advanced React Patterns & Micro-Frontends',
        };
      case 'devops':
        return {
          mastered: ['Dockerfile Multi-Stage Builds', 'Basic GitHub Actions CI', 'Docker Compose'],
          nextToLearn: ['Kubernetes StatefulSets & Ingress', 'ArgoCD GitOps Workflows', 'OpenTelemetry Tracing'],
          recommendedCourse: 'Cloud-Native Kubernetes & SRE Best Practices',
        };
      case 'backend':
        return {
          mastered: ['RESTful API Design', 'JWT Authentication & Refresh Tokens', 'Middleware Pipelines'],
          nextToLearn: ['Event-Driven Microservices with Kafka', 'Idempotency Keys & Deduplication', 'Distributed Caching'],
          recommendedCourse: 'Modern Distributed Systems Architecture',
        };
      default:
        return {
          mastered: ['Core Syntax & Type Primitives', 'Event Loop & Promises', 'Array Transformations'],
          nextToLearn: ['Memory Profiling & V8 Internals', 'Web Workers & SharedArrayBuffer', 'TypeScript AST Manipulations'],
          recommendedCourse: 'Modern Distributed Systems Architecture',
        };
    }
  };

  const concepts = getSkillConcepts(skill.name);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Skill Competency Benchmark
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {skill.name} Mastery
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Score Breakdown */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              Verified Benchmark Score
            </span>
            <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 font-mono">
              {skill.level}%
            </span>
          </div>

          <ProgressBar value={skill.level} max={100} variant="primary" size="md" showValue={false} />

          <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Outperforms <strong>{Math.min(96, skill.level + 6)}%</strong> of peers in this learning track.</span>
          </p>
        </div>

        {/* Mastered concepts */}
        <div>
          <span className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
            Concepts Mastered:
          </span>
          <div className="space-y-1.5">
            {concepts.mastered.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Next to level up */}
        <div>
          <span className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
            Next Topics to Level Up (+12% XP):
          </span>
          <div className="space-y-1.5">
            {concepts.nextToLearn.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 text-xs"
              >
                <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
          <SecondaryButton size="sm" onClick={onClose}>
            Close
          </SecondaryButton>
          <PrimaryButton
            size="sm"
            onClick={() => {
              onStartPractice?.(skill.name);
              onClose();
            }}
            leftIcon={<PlayCircle className="w-4 h-4" />}
          >
            Start Skill Assessment
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
};
