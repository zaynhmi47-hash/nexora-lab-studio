import React, { useEffect, useState } from 'react';
import { BookOpen, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../state/auth/AuthContext';
import { authStorage } from '../../services/auth/authStorage';

export const SplashScreen: React.FC = () => {
  const { state, setAuthStage } = useAuth();
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Initializing learning environment...');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(50);
      setStatusText('Verifying user credentials & session...');
    }, 400);

    const timer2 = setTimeout(() => {
      setProgress(85);
      setStatusText('Synchronizing course progression...');
    }, 800);

    const timer3 = setTimeout(() => {
      setProgress(100);
      authStorage.setSeenSplash(true);

      // Auto advance according to auth state
      if (state.isAuthenticated) {
        if (state.onboardingCompleted) {
          setAuthStage('authenticated');
        } else {
          setAuthStage('onboarding');
        }
      } else {
        setAuthStage('welcome');
      }
    }, 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [state.isAuthenticated, state.onboardingCompleted, setAuthStage]);

  const handleSkip = () => {
    authStorage.setSeenSplash(true);
    if (state.isAuthenticated) {
      setAuthStage(state.onboardingCompleted ? 'authenticated' : 'onboarding');
    } else {
      setAuthStage('welcome');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between p-6 bg-slate-950 text-white relative overflow-hidden select-none">
      {/* Background ambient accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top utility */}
      <div className="w-full max-w-md flex justify-end pt-4 z-10">
        <button
          onClick={handleSkip}
          className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-900/60 transition-colors flex items-center gap-1.5"
        >
          <span>Skip</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Centered Brand Core */}
      <div className="flex flex-col items-center text-center max-w-sm z-10 my-auto">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-2xl shadow-blue-500/30 ring-4 ring-blue-500/20 animate-pulse">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
          EduPulse
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed mb-8">
          The education super-platform for engineering, systems design, and career-defining skills.
        </p>

        {/* Progress simulation */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-mono text-[11px] truncate">{statusText}</span>
            <span className="font-mono font-bold text-blue-400 ml-2">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer information */}
      <div className="w-full max-w-md pb-4 text-center z-10">
        <div className="inline-flex items-center gap-2 text-slate-500 text-xs font-mono">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
          <span>Local Mock Authentication Architecture • Step 2</span>
        </div>
      </div>
    </div>
  );
};
