import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Compass,
  Target,
  Clock,
  Laptop,
  Briefcase,
  GraduationCap,
  Award,
  Cpu,
  Server,
  Cloud,
  Layers,
  Database,
  Shield,
  Code2,
  Smartphone,
  CheckCircle2,
  Star,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../../state/auth/AuthContext';
import { OnboardingData, Course } from '../../../types';
import { mockCourses } from '../../../data/mock/courses';
import { PrimaryButton, SecondaryButton } from '../../../components/ui/Button';

export const OnboardingFlow: React.FC = () => {
  const { state, completeOnboarding, guestLogin } = useAuth();
  const [step, setStep] = useState<number>(1);

  // Form state
  const [primaryGoal, setPrimaryGoal] = useState<string>('Career transition into Software & Cloud Engineering');
  const [targetCareer, setTargetCareer] = useState<string>('Full-Stack Cloud Architect');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    'Distributed Systems',
    'AI & LLM Systems',
    'Cloud Architecture',
  ]);
  const [experienceLevel, setExperienceLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'>('Intermediate');
  const [preferredFormats, setPreferredFormats] = useState<string[]>([
    'Hands-on coding labs',
    'Video lectures with architecture diagrams',
  ]);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(30);
  const [reminderTime, setReminderTime] = useState<'morning' | 'afternoon' | 'evening' | 'none'>('evening');
  const [isFinishing, setIsFinishing] = useState<boolean>(false);

  // Step 1: Goals
  const goalOptions = [
    {
      id: 'career',
      title: 'Career Transition',
      description: 'Transition into software engineering, cloud architecture, or AI roles.',
      icon: Briefcase,
    },
    {
      id: 'upgrade',
      title: 'Skill Upgrade for Current Job',
      description: 'Master advanced systems design, lead engineering initiatives, and earn promotion.',
      icon: Zap,
    },
    {
      id: 'certification',
      title: 'Certification Preparation',
      description: 'Prepare for enterprise and cloud certifications with verified credentials.',
      icon: Award,
    },
    {
      id: 'academic',
      title: 'Academic & College Prep',
      description: 'Supplement university curriculum and gain real production skills.',
      icon: GraduationCap,
    },
    {
      id: 'curiosity',
      title: 'Personal Curiosity & Research',
      description: 'Stay ahead of generative AI, distributed consensus, and tech shifts.',
      icon: Compass,
    },
  ];

  // Step 2: Topics
  const topicOptions = [
    { name: 'AI & LLM Systems', icon: Cpu, count: '18 courses' },
    { name: 'Distributed Systems', icon: Server, count: '14 courses' },
    { name: 'Cloud Architecture', icon: Cloud, count: '22 courses' },
    { name: 'Full-Stack & UI/UX', icon: Layers, count: '31 courses' },
    { name: 'Data Engineering', icon: Database, count: '16 courses' },
    { name: 'Cybersecurity', icon: Shield, count: '12 courses' },
    { name: 'Rust & Low-Level Systems', icon: Code2, count: '9 courses' },
    { name: 'Mobile Engineering', icon: Smartphone, count: '11 courses' },
  ];

  // Step 3: Experience Levels
  const levelOptions: {
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    title: string;
    desc: string;
    badge: string;
  }[] = [
    {
      level: 'Beginner',
      title: 'Beginner • Starting Fresh',
      desc: 'New to programming or systems design fundamentals. Prefers step-by-step guidance.',
      badge: 'Starter',
    },
    {
      level: 'Intermediate',
      title: 'Intermediate • Practical Experience',
      desc: 'Comfortable with coding and basic APIs. Ready to build robust, scalable architectures.',
      badge: 'Core',
    },
    {
      level: 'Advanced',
      title: 'Advanced • Practicing Engineer',
      desc: 'Regularly ships code in production. Looking for distributed consensus, scale, and optimizations.',
      badge: 'Pro',
    },
    {
      level: 'Expert',
      title: 'Expert • Staff & Principal',
      desc: 'Architecting high-throughput global platforms, deep performance tuning, and team standards.',
      badge: 'Lead',
    },
  ];

  // Step 4: Formats & Times
  const formatOptions = [
    'Video lectures with architecture diagrams',
    'Hands-on coding labs & terminal environments',
    'Real-world system design assignments',
    'In-depth technical whitepapers & reading',
  ];

  const dailyCommitments = [
    { minutes: 15, label: '15 min/day', tag: 'Casual Pace' },
    { minutes: 30, label: '30 min/day', tag: 'Recommended' },
    { minutes: 45, label: '45 min/day', tag: 'Accelerated' },
    { minutes: 60, label: '60 min/day', tag: 'Intensive' },
  ];

  const reminderOptions = [
    { id: 'morning', label: 'Morning (8:00 AM)' },
    { id: 'afternoon', label: 'Midday (1:00 PM)' },
    { id: 'evening', label: 'Evening (7:00 PM)' },
    { id: 'none', label: 'No reminders' },
  ];

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const toggleFormat = (fmt: string) => {
    setPreferredFormats((prev) =>
      prev.includes(fmt) ? prev.filter((f) => f !== fmt) : [...prev, fmt]
    );
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    const data: OnboardingData = {
      primaryGoal,
      targetCareer,
      topics: selectedTopics.length > 0 ? selectedTopics : ['Distributed Systems', 'Cloud Architecture'],
      experienceLevel,
      preferredFormats: preferredFormats.length > 0 ? preferredFormats : ['Hands-on coding labs'],
      dailyGoalMinutes,
      reminderTime,
    };
    await completeOnboarding(data);
  };

  const handleSkip = async () => {
    const data: OnboardingData = {
      primaryGoal: 'General Technology Mastery',
      topics: ['Distributed Systems', 'AI & LLM Systems'],
      experienceLevel: 'Intermediate',
      preferredFormats: ['Hands-on coding labs'],
      dailyGoalMinutes: 30,
      reminderTime: 'evening',
    };
    await completeOnboarding(data);
  };

  // Matched recommendations for step 5
  const recommendedCourses = mockCourses.filter((c) => {
    if (selectedTopics.some((t) => c.tags.includes(t) || c.title.toLowerCase().includes(t.toLowerCase()))) {
      return true;
    }
    return c.difficulty === experienceLevel;
  }).slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors">
      {/* Top Header with Progress */}
      <header className="w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">EduPulse Onboarding</span>
              <span className="text-[10px] text-slate-400 block">
                Personalizing your curriculum for {state.user?.name || 'Learner'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
              Step {step} of 5
            </span>
            <button
              onClick={handleSkip}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Skip setup
            </button>
          </div>
        </div>

        {/* Linear Step Indicator */}
        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Wizard Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* STEP 1: GOALS */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
                <Target className="w-3.5 h-3.5" />
                <span>Step 1 • Learning Objectives</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                What is your primary learning goal?
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                We will tailor your learning path, daily reminders, and milestone pace accordingly.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {goalOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = primaryGoal === opt.title;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPrimaryGoal(opt.title)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-start gap-4 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-slate-900 dark:text-white shadow-xs ring-1 ring-blue-600'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                        <span>{opt.title}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {opt.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Target Career / Role input */}
            <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
              <label
                htmlFor="target-career"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Target Engineering Role or Title (Optional)
              </label>
              <input
                id="target-career"
                type="text"
                value={targetCareer}
                onChange={(e) => setTargetCareer(e.target.value)}
                placeholder="e.g., Senior Distributed Systems Engineer, AI Architect"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* STEP 2: TOPIC INTERESTS */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Step 2 • Technical Focus Areas</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Select your engineering topics of interest
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Choose at least 2 topics so we can index courses and labs matching your focus.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {topicOptions.map((topic) => {
                const Icon = topic.icon;
                const isSelected = selectedTopics.includes(topic.name);
                return (
                  <button
                    key={topic.name}
                    type="button"
                    onClick={() => toggleTopic(topic.name)}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-600'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {topic.name}
                        </div>
                        <div className="text-[10px] text-slate-400">{topic.count}</div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              {selectedTopics.length} topic{selectedTopics.length === 1 ? '' : 's'} selected
            </div>
          </div>
        )}

        {/* STEP 3: EXPERIENCE LEVEL */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Step 3 • Experience Baseline</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                What is your current technical proficiency?
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                We calibrate course difficulty and skip prerequisites accordingly.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {levelOptions.map((opt) => {
                const isSelected = experienceLevel === opt.level;
                return (
                  <button
                    key={opt.level}
                    type="button"
                    onClick={() => setExperienceLevel(opt.level)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-start justify-between transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-600 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {opt.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: PREFERENCES & SCHEDULE */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-200 space-y-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Step 4 • Habits & Preferences</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                How do you learn best?
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Customize format modes, daily study pace, and notification preferences.
              </p>
            </div>

            {/* Daily Commitment Goal */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Daily Study Target
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {dailyCommitments.map((goal) => {
                  const isSelected = dailyGoalMinutes === goal.minutes;
                  return (
                    <button
                      key={goal.minutes}
                      type="button"
                      onClick={() => setDailyGoalMinutes(goal.minutes)}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold ring-1 ring-blue-600'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-sm font-extrabold">{goal.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                        {goal.tag}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Formats */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Preferred Content Formats
              </label>
              <div className="space-y-2">
                {formatOptions.map((fmt) => {
                  const isSelected = preferredFormats.includes(fmt);
                  return (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => toggleFormat(fmt)}
                      className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{fmt}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reminder Times */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Streak & Study Notification Window
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {reminderOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setReminderTime(opt.id as any)}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                      reminderTime === opt.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold ring-1 ring-blue-600'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: PERSONALIZED ROADMAP & SUMMARY */}
        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-200 space-y-6">
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Step 5 • Profile Initialized & Curated</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Your personalized learning roadmap is ready!
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Based on your goals and technical preferences, we have curated your starter curriculum.
              </p>
            </div>

            {/* Learner Plan Summary Box */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Target Role
                  </span>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white">
                    {targetCareer || 'Full-Stack Software Engineer'}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    {experienceLevel} Level • {dailyGoalMinutes} min daily habit target
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Curriculum Match: 98%</span>
                  </div>
                </div>
              </div>

              {/* Topics Chosen */}
              <div className="pt-4">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Selected Focus Topics:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTopics.map((topic) => (
                    <span
                      key={topic}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommended Starter Courses */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Recommended First Courses
              </h3>
              <div className="space-y-3">
                {recommendedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-16 h-12 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-800 shrink-0"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {course.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {course.categoryName} • {course.difficulty} • {course.durationHours} hrs
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {course.rating}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                        Starter Match
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Navigation Footer */}
      <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md py-4 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <SecondaryButton
            size="md"
            disabled={step === 1}
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            className="flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </SecondaryButton>

          {step < 5 ? (
            <PrimaryButton
              size="md"
              onClick={() => setStep((prev) => Math.min(5, prev + 1))}
              className="flex items-center gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </PrimaryButton>
          ) : (
            <PrimaryButton
              size="md"
              onClick={handleFinish}
              isLoading={isFinishing}
              className="flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Finish & Start Learning</span>
            </PrimaryButton>
          )}
        </div>
      </footer>
    </div>
  );
};
