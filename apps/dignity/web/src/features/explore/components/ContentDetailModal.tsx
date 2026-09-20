import React, { useState } from 'react';
import {
  X,
  Star,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  BookOpen,
  Award,
  Video,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Compass,
  ArrowRight,
  Share2,
  Bookmark,
} from 'lucide-react';
import {
  Course,
  ProgramItem,
  TutorItem,
  MentorItem,
  CertificationItem,
  WebinarItem,
} from '../../../types';

export type DetailItem =
  | { type: 'course'; data: Course }
  | { type: 'program'; data: ProgramItem }
  | { type: 'tutor'; data: TutorItem }
  | { type: 'mentor'; data: MentorItem }
  | { type: 'certification'; data: CertificationItem }
  | { type: 'webinar'; data: WebinarItem };

interface ContentDetailModalProps {
  item: DetailItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEnrollOrBook?: (item: DetailItem) => void;
}

export const ContentDetailModal: React.FC<ContentDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onEnrollOrBook,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor' | 'reviews'>('overview');
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({ 0: true, 1: true });
  const [actionDone, setActionDone] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const toggleModule = (idx: number) => {
    setExpandedModules((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleAction = () => {
    let msg = 'Enrollment successful!';
    if (item.type === 'tutor') msg = '1-on-1 tutoring session requested with ' + item.data.name;
    else if (item.type === 'mentor') msg = 'Mentorship advisory slot booked with ' + item.data.name;
    else if (item.type === 'certification') msg = 'Registered for ' + item.data.name + ' exam seat.';
    else if (item.type === 'webinar') msg = 'Seat reserved for ' + item.data.title;
    else if (item.type === 'program') msg = 'Enrolled in ' + item.data.title;
    else if (item.type === 'course') msg = 'Enrolled in ' + item.data.title;

    setActionDone(msg);
    onEnrollOrBook?.(item);
  };

  // Extract shared metadata based on item type
  let title = '';
  let provider = '';
  let description = '';
  let rating = 4.9;
  let reviewsCount = 0;
  let price = 0;
  let isFree = false;
  let level = 'All Levels';
  let duration = '';
  let format = 'Online';
  let image = '';
  let tags: string[] = [];

  if (item.type === 'course') {
    const c = item.data;
    title = c.title;
    provider = c.provider || c.instructor.name;
    description = c.description;
    rating = c.rating;
    reviewsCount = c.ratingCount;
    price = c.priceAmount || 0;
    isFree = c.priceType === 'free' || c.isFree === true;
    level = c.difficulty;
    duration = `${c.durationHours} hours (${c.lessonCount} lessons)`;
    format = c.format || 'Self-paced Video';
    image = c.thumbnailUrl;
    tags = c.tags;
  } else if (item.type === 'program') {
    const p = item.data;
    title = p.title;
    provider = p.provider;
    description = p.description;
    rating = p.rating;
    reviewsCount = p.reviewCount;
    price = p.price;
    isFree = p.isFree || false;
    level = p.level;
    duration = p.duration;
    format = p.format;
    image = p.thumbnail;
    tags = p.skills;
  } else if (item.type === 'tutor') {
    const t = item.data;
    title = t.name;
    provider = t.expertise;
    description = t.bio;
    rating = t.rating;
    reviewsCount = t.reviewCount;
    price = t.hourlyPrice;
    isFree = false;
    level = 'All Levels';
    duration = '1-on-1 Hourly Sessions';
    format = '1-on-1 Live Coaching';
    image = t.avatar;
    tags = t.subjects;
  } else if (item.type === 'mentor') {
    const m = item.data;
    title = m.name;
    provider = `${m.title} at ${m.company}`;
    description = m.bio;
    rating = m.rating;
    reviewsCount = m.reviewCount;
    price = m.sessionPrice;
    isFree = false;
    level = 'Advanced';
    duration = '45-Minute Advisory Session';
    format = '1-on-1 Video Advisory';
    image = m.avatar;
    tags = m.skills;
  } else if (item.type === 'certification') {
    const cert = item.data;
    title = cert.name;
    provider = cert.issuer;
    description = cert.description;
    rating = 4.95;
    reviewsCount = cert.learnersCount;
    price = cert.price;
    isFree = cert.isFree || false;
    level = cert.difficulty;
    duration = `${cert.estimatedPrepWeeks} weeks prep • ${cert.examDuration}`;
    format = cert.assessmentType;
    image = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80';
    tags = cert.skillsValidated;
  } else if (item.type === 'webinar') {
    const w = item.data;
    title = w.title;
    provider = `${w.speaker} (${w.speakerCompany})`;
    description = w.description;
    rating = 4.92;
    reviewsCount = w.attendeesCount;
    price = w.price || 0;
    isFree = w.isFree;
    level = w.level;
    duration = `${w.date} • ${w.time} (${w.duration})`;
    format = w.isLive ? 'Live Interactive' : 'On-Demand';
    image = w.speakerAvatar;
    tags = [w.topic, w.speakerRole];
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Main Dialog Window */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header / Top banner */}
        <div className="relative aspect-21/9 sm:aspect-24/7 w-full overflow-hidden bg-slate-950">
          <img
            src={image}
            alt={title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-60 filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

          {/* Close & Share actions */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Badges on Banner */}
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                {item.type.replace('_', ' ')}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-black/40 backdrop-blur-md text-slate-200">
                {level}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-black/40 backdrop-blur-md text-slate-200">
                {format}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight line-clamp-2">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-2">
              <span>By <strong className="text-white">{provider}</strong></span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                {rating.toFixed(2)} ({reviewsCount.toLocaleString()} learners)
              </span>
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 px-6 border-b border-slate-100 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-500 overflow-x-auto">
          {(['overview', 'curriculum', 'instructor', 'reviews'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-3.5 border-b-2 capitalize transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab === 'instructor' ? (item.type === 'tutor' || item.type === 'mentor' ? 'Profile & Bio' : 'Instructors / Provider') : tab}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          {actionDone && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-sm font-semibold">{actionDone}</div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  About this {item.type.replace('_', ' ')}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {description}
                </p>
              </div>

              {/* What You Will Learn */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Key Competencies & Outcomes</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Industry-aligned skills verified through practical benchmarks</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Direct access to community discussions and study groups</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Personalized learning dashboard and progress sync</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Verifiable digital certificate issued upon completion</span>
                  </div>
                </div>
              </div>

              {/* Skills Tags */}
              {tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    Skills Covered
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Program Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-[11px] text-slate-400 block font-semibold">Total Duration</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block truncate">
                    {duration}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-[11px] text-slate-400 block font-semibold">Difficulty</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">{level}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-[11px] text-slate-400 block font-semibold">Format</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">{format}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-[11px] text-slate-400 block font-semibold">Access Period</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">Lifetime Access</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'curriculum' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Syllabus & Learning Structure
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Step-by-step milestones designed for practical mastery.
                  </p>
                </div>
              </div>

              {item.type === 'program' && item.data.curriculum ? (
                <div className="space-y-3">
                  {item.data.curriculum.map((mod, idx) => {
                    const isExpanded = !!expandedModules[idx];
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => toggleModule(idx)}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                        >
                          <div>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">
                              Module {mod.moduleNumber} • {mod.duration}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                              {mod.title}
                            </h4>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="p-4 bg-white dark:bg-slate-900 space-y-2 border-t border-slate-100 dark:border-slate-800">
                            {mod.topics.map((topic, tIdx) => (
                              <div
                                key={tIdx}
                                className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 py-1"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <span>{topic}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : item.type === 'course' && item.data.modules ? (
                <div className="space-y-3">
                  {item.data.modules.map((mod, idx) => {
                    const isExpanded = !!expandedModules[idx];
                    return (
                      <div
                        key={mod.id}
                        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => toggleModule(idx)}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                        >
                          <div>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">
                              Module {mod.order} • {mod.durationHours} Hours
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                              {mod.title}
                            </h4>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="p-4 bg-white dark:bg-slate-900 space-y-2 border-t border-slate-100 dark:border-slate-800">
                            {mod.lessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 dark:border-slate-800/40 last:border-none"
                              >
                                <div className="flex items-center gap-2.5">
                                  <Video className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                                    {lesson.title}
                                  </span>
                                </div>
                                <span className="text-slate-400">{lesson.durationMinutes} min</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-center text-sm text-slate-500">
                  This educational model is structured around live interactive 1-on-1 sessions, personalized benchmarks, and real-time guidance.
                </div>
              )}
            </div>
          )}

          {activeTab === 'instructor' && (
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <img
                  src={image}
                  alt={provider}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/20"
                />
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {provider}
                  </h4>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                    Verified Educator & Industry Specialist
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {rating.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 my-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <div className="text-xs text-slate-400">Based on verified learner feedback</div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 max-w-xs text-right">
                  98% of students reported mastering key domain benchmarks after completing this curriculum.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Sticky Bottom Action Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-400 block">
              Investment
            </span>
            {isFree ? (
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                Free Access
              </span>
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  ${price}
                </span>
                <span className="text-xs text-slate-400">
                  {item.type === 'tutor' ? '/ hour' : item.type === 'mentor' ? '/ 45m' : 'one-time'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleAction}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all hover:scale-101 flex items-center gap-2"
            >
              <span>
                {item.type === 'tutor'
                  ? 'Book Tutoring Session'
                  : item.type === 'mentor'
                  ? 'Schedule Mentorship'
                  : item.type === 'certification'
                  ? 'Register for Exam'
                  : item.type === 'webinar'
                  ? 'Reserve Webinar Seat'
                  : 'Enroll in Program'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
