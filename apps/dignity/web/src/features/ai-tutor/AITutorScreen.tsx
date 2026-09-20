import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Calendar,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Brain,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  AIContext,
  AIMessage,
  AIAction,
  AITutorSession,
  AIExplanationDepth,
  AILanguage,
  AIStudyPlan,
  AILearningInsight,
  AIRecommendation,
} from '../../types/ai';
import { AppRoute } from '../../types';
import { aiTutorService } from '../../services/ai/aiTutorService';
import { AIChatHeader } from './components/AIChatHeader';
import { AIContextBanner } from './components/AIContextBanner';
import { AIConversation } from './components/AIConversation';
import { AISuggestionChips } from './components/AISuggestionChips';
import { AIInput } from './components/AIInput';
import { AIStudyPlanCard } from './components/AIStudyPlanCard';
import { AIMistakeReview } from './components/AIMistakeReview';
import { AIRecommendationCard } from './components/AIRecommendationCard';
import { AIInsightCard } from './components/AIInsightCard';
import { ExamProtectionNotice } from './components/ExamProtectionNotice';

export interface AITutorScreenProps {
  onNavigate: (route: AppRoute, params?: Record<string, string>) => void;
  initialContext?: Partial<AIContext>;
  isExamActive?: boolean;
  examTitle?: string;
  examTimeRemainingSecs?: number;
  initialTab?: 'chat' | 'plan' | 'mistakes' | 'insights';
}

export const AITutorScreen: React.FC<AITutorScreenProps> = ({
  onNavigate,
  initialContext,
  isExamActive = false,
  examTitle,
  examTimeRemainingSecs,
  initialTab = 'chat',
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'plan' | 'mistakes' | 'insights'>(initialTab);
  const [session, setSession] = useState<AITutorSession>(aiTutorService.getActiveSession());
  const [allSessions, setAllSessions] = useState<AITutorSession[]>(aiTutorService.getAllSessions());
  const [context, setContext] = useState<AIContext>(aiTutorService.getContext());
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [explanationDepth, setExplanationDepth] = useState<AIExplanationDepth>(
    aiTutorService.getExplanationDepth()
  );
  const [language, setLanguage] = useState<AILanguage>(aiTutorService.getLanguage());

  const [studyPlan, setStudyPlan] = useState<AIStudyPlan | null>(null);
  const [insights, setInsights] = useState<AILearningInsight[]>(aiTutorService.getInsights());
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(
    aiTutorService.getRecommendations()
  );

  // Sync initial context if provided
  useEffect(() => {
    if (initialContext) {
      aiTutorService.setContext(initialContext);
      setContext(aiTutorService.getContext());
    }

    // Load initial study plan
    aiTutorService.generateStudyPlan('Become a Full-Stack Developer').then((plan) => {
      setStudyPlan(plan);
    });
  }, [initialContext]);

  // Handle sending a message
  const handleSendMessage = async (prompt: string) => {
    setIsThinking(true);
    try {
      await aiTutorService.askTutor(prompt);
      setSession({ ...aiTutorService.getActiveSession() });
      setAllSessions([...aiTutorService.getAllSessions()]);
    } finally {
      setIsThinking(false);
    }
  };

  // Handle action bar buttons dispatch
  const handleActionClick = async (action: AIAction) => {
    switch (action.actionType) {
      case 'practice_skill':
        onNavigate('practice', { skill: context.skillNames?.[0] || 'State Management' });
        break;

      case 'quiz_me':
        handleSendMessage(
          `Give me an interactive multiple-choice question to test my understanding of ${
            context.skillNames?.[0] || context.lessonTitle || 'this concept'
          }.`
        );
        break;

      case 'explain_deeper':
        setIsThinking(true);
        try {
          await aiTutorService.explainConcept(
            context.lessonTitle || 'JavaScript Functions',
            'advanced'
          );
          setSession({ ...aiTutorService.getActiveSession() });
        } finally {
          setIsThinking(false);
        }
        break;

      case 'simplify':
        setIsThinking(true);
        try {
          await aiTutorService.explainConcept(
            context.lessonTitle || 'JavaScript Functions',
            'beginner'
          );
          setSession({ ...aiTutorService.getActiveSession() });
        } finally {
          setIsThinking(false);
        }
        break;

      case 'give_example':
        setIsThinking(true);
        try {
          await aiTutorService.generateExample(context.lessonTitle || 'JavaScript Functions');
          setSession({ ...aiTutorService.getActiveSession() });
        } finally {
          setIsThinking(false);
        }
        break;

      case 'open_lesson':
        onNavigate('lesson-view', { lessonId: context.lessonId || 'lesson-r8' });
        break;

      case 'view_study_plan':
        setActiveTab('plan');
        break;

      case 'try_another_question':
        handleSendMessage(
          `Can you give me another practice question similar to the one I just missed?`
        );
        break;

      default:
        handleSendMessage(`Can you explain more about ${action.label}?`);
        break;
    }
  };

  // Switch session
  const handleSelectSession = (sessionId: string) => {
    const selected = aiTutorService.setActiveSession(sessionId);
    if (selected) {
      setSession({ ...selected });
    }
  };

  // New session
  const handleNewSession = () => {
    const newSess = aiTutorService.createNewSession('New Learning Exploration', 'general');
    setSession({ ...newSess });
    setAllSessions([...aiTutorService.getAllSessions()]);
  };

  // Clear current session messages
  const handleClearSession = () => {
    aiTutorService.clearActiveSessionMessages();
    setSession({ ...aiTutorService.getActiveSession() });
  };

  // Switch Subject
  const handleSelectSubject = (subject: AIContext['subjectDomain']) => {
    if (!subject) return;
    const subjectMap: Record<string, { title: string; skill: string }> = {
      programming: { title: 'Modern React Development', skill: 'React State Composition' },
      mathematics: { title: 'Calculus & Linear Algebra', skill: 'Quadratic Equations & Roots' },
      english: { title: 'Academic English & Grammar', skill: 'Conditionals & Clauses' },
      business: { title: 'Startup Economics & Strategy', skill: 'Customer Acquisition Cost (CAC)' },
    };
    const config = subjectMap[subject];
    aiTutorService.setContext({
      subjectDomain: subject,
      courseTitle: config.title,
      lessonTitle: `${config.skill} Deep-Dive`,
      skillNames: [config.skill],
    });
    setContext(aiTutorService.getContext());
  };

  // If active exam mode is enabled, enforce Academic Exam Protection
  if (isExamActive) {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-4">
        <AIChatHeader
          currentSession={session}
          allSessions={allSessions}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onClearSession={handleClearSession}
          explanationDepth={explanationDepth}
          onChangeExplanationDepth={(d) => {
            setExplanationDepth(d);
            aiTutorService.setExplanationDepth(d);
          }}
          language={language}
          onChangeLanguage={(l) => {
            setLanguage(l);
            aiTutorService.setLanguage(l);
          }}
          onBack={() => onNavigate('assessment-view')}
        />
        <div className="flex-1 flex items-center justify-center p-4">
          <ExamProtectionNotice
            examTitle={examTitle}
            timeRemainingSecs={examTimeRemainingSecs}
            onReturnToExam={() => onNavigate('assessment-view')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Top Header */}
      <AIChatHeader
        currentSession={session}
        allSessions={allSessions}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onClearSession={handleClearSession}
        explanationDepth={explanationDepth}
        onChangeExplanationDepth={(d) => {
          setExplanationDepth(d);
          aiTutorService.setExplanationDepth(d);
        }}
        language={language}
        onChangeLanguage={(l) => {
          setLanguage(l);
          aiTutorService.setLanguage(l);
        }}
      />

      {/* Feature Nav Tabs */}
      <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1">
          {[
            { id: 'chat', label: 'Tutor Chat', icon: MessageSquare },
            { id: 'plan', label: 'Study Plan', icon: Calendar },
            { id: 'mistakes', label: 'Mistake Diagnostics', icon: Lightbulb },
            { id: 'insights', label: 'Habits & Next Steps', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick link to curriculum */}
        <button
          type="button"
          onClick={() => onNavigate('learning')}
          className="hidden md:inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors whitespace-nowrap"
        >
          <span>Continue Lesson</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Main Content Area Based on Active Tab */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 max-w-4xl w-full mx-auto p-2 sm:p-4">
            {/* Curriculum Context Banner */}
            <div className="mb-3">
              <AIContextBanner
                context={context}
                onClearContext={() => {
                  aiTutorService.setContext({
                    courseTitle: undefined,
                    lessonTitle: undefined,
                    skillNames: ['General Academic Inquiry'],
                  });
                  setContext(aiTutorService.getContext());
                }}
                onSelectSubject={handleSelectSubject}
              />
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 min-h-0 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col shadow-2xs overflow-hidden">
              <AIConversation
                messages={session.messages}
                isThinking={isThinking}
                onActionClick={handleActionClick}
                onSelectPrompt={handleSendMessage}
              />

              {/* Bottom Input Section */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <AISuggestionChips
                  onSelectSuggestion={handleSendMessage}
                  disabled={isThinking}
                />
                <AIInput
                  onSend={handleSendMessage}
                  disabled={isThinking}
                  placeholder={`Ask anything about ${
                    context.lessonTitle || context.skillNames?.[0] || 'what you are learning'
                  }...`}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl w-full mx-auto space-y-6">
            {studyPlan ? (
              <AIStudyPlanCard
                studyPlan={studyPlan}
                onLaunchItem={(item) => {
                  if (item.type === 'practice' || item.type === 'quiz') {
                    onNavigate('practice');
                  } else {
                    onNavigate('lesson-view', { lessonId: item.lessonId || 'lesson-r8' });
                  }
                }}
                onAdjustCommitment={() => {
                  const minutes = prompt('Enter your daily target study minutes (e.g. 30, 45, 60):', '60');
                  if (minutes && !isNaN(Number(minutes))) {
                    aiTutorService.generateStudyPlan('Full-Stack Developer', Number(minutes)).then(setStudyPlan);
                  }
                }}
              />
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">Loading AI Study Plan...</div>
            )}
          </div>
        )}

        {activeTab === 'mistakes' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl w-full mx-auto space-y-6">
            <div className="mb-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Mistake Diagnostics
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI breaks down the root misconceptions behind missed questions so you never repeat them.
              </p>
            </div>

            {context.recentMistakes && context.recentMistakes.length > 0 ? (
              context.recentMistakes.map((m) => (
                <AIMistakeReview
                  key={m.questionId}
                  mistake={m}
                  onTrySimilarQuestion={() => {
                    setActiveTab('chat');
                    handleSendMessage(
                      `Give me an interactive question similar to "${m.questionText}" to test if I understand the concept now.`
                    );
                  }}
                  onPracticeSkill={(skill) => onNavigate('practice', { skill })}
                />
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No recorded mistakes in this session. Great job!
              </div>
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl w-full mx-auto space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Next-Step Recommendations
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Curriculum-grounded actions prioritized by your current mastery and skill gaps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recommendations.map((rec) => (
                <AIRecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onStart={(r) => {
                    if (r.targetType === 'course') {
                      onNavigate('course-detail', { courseId: r.targetId });
                    } else {
                      onNavigate('practice');
                    }
                  }}
                />
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Learning Habits & Retention Insights
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Algorithmic diagnostic insights identifying peak productivity and retention boosters.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {insights.map((ins) => (
                  <AIInsightCard
                    key={ins.id}
                    insight={ins}
                    onAction={(route) => {
                      if (route) onNavigate(route as AppRoute);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
