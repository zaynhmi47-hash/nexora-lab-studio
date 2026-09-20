import React, { useState } from 'react';
import { UserCheck, Compass, ArrowRight } from 'lucide-react';
import { TutorItem, MentorItem } from '../../../types';
import { TutorCard } from './TutorCard';
import { MentorCard } from './MentorCard';

interface TutorsMentorsSectionProps {
  tutors: TutorItem[];
  mentors: MentorItem[];
  onSelectTutor: (tutor: TutorItem) => void;
  onSelectMentor: (mentor: MentorItem) => void;
}

export const TutorsMentorsSection: React.FC<TutorsMentorsSectionProps> = ({
  tutors,
  mentors,
  onSelectTutor,
  onSelectMentor,
}) => {
  const [activeTab, setActiveTab] = useState<'tutors' | 'mentors'>('tutors');

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Personal Guidance & Mentorship
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Book 1-on-1 sessions with verified academic tutors or get strategic advice from senior industry leaders.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('tutors')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'tutors'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-teal-500" />
            <span>1-on-1 Tutors ({tutors.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mentors')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'mentors'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-purple-500" />
            <span>Career Mentors ({mentors.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'tutors' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tutors.slice(0, 4).map((tutor) => (
            <TutorCard
              key={tutor.id}
              tutor={tutor}
              onSelect={onSelectTutor}
            />
          ))}
        </div>
      )}

      {activeTab === 'mentors' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mentors.slice(0, 4).map((mentor) => (
            <MentorCard
              key={mentor.id}
              mentor={mentor}
              onSelect={onSelectMentor}
            />
          ))}
        </div>
      )}
    </section>
  );
};
