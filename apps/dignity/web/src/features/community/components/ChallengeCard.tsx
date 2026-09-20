import React from 'react';
import {
  Trophy,
  Flame,
  Users,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { CommunityChallenge } from '../../../types/community';
import { PrimaryButton, SecondaryButton } from '../../../components/ui/Button';

export interface ChallengeCardProps {
  challenge: CommunityChallenge;
  onJoinToggle?: (id: string) => void;
  onStartChallenge?: (challenge: CommunityChallenge) => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onJoinToggle,
  onStartChallenge,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 rounded-2xl p-5 transition-all shadow-xs hover:shadow-md flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300/40">
            <Trophy className="w-3.5 h-3.5" />
            +{challenge.xpReward} XP Reward
          </span>

          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {challenge.duration}
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
          {challenge.title}
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
          {challenge.description}
        </p>

        {/* Milestones list */}
        <div className="mt-4 space-y-2">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Milestones ({challenge.milestones.filter((m) => m.done).length}/{challenge.milestones.length})
          </span>
          <div className="space-y-1.5">
            {challenge.milestones.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      m.done ? 'text-emerald-500 fill-emerald-500/20' : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                  <span
                    className={
                      m.done
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-700 dark:text-slate-300 font-medium'
                    }
                  >
                    {m.title}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                  +{m.xp} XP
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500">Your Progress</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {challenge.progressPercent}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${challenge.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Users className="w-3.5 h-3.5" />
          <span>{challenge.participantsCount} participants</span>
        </div>

        <div className="flex items-center gap-2">
          {!challenge.isJoined ? (
            <PrimaryButton size="sm" onClick={() => onJoinToggle?.(challenge.id)}>
              Join Challenge
            </PrimaryButton>
          ) : challenge.isCompleted ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-300/30">
              <CheckCircle2 className="w-4 h-4" />
              Completed (+{challenge.xpReward} XP)
            </span>
          ) : (
            <PrimaryButton
              size="sm"
              onClick={() => onStartChallenge?.(challenge)}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Continue Practice
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
};
