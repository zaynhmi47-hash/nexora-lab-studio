import React, { useState } from 'react';
import {
  BookOpen,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  Check,
  X,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useAuth } from '../../state/auth/AuthContext';
import { UserRole } from '../../types';
import { evaluatePasswordStrength } from '../../services/auth/authService';
import { PrimaryButton } from '../../components/ui/Button';
import { FormInput } from '../../components/ui/Input';

export const RegisterScreen: React.FC = () => {
  const { register, setAuthStage, state } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('learner');
  const [termsAccepted, setTermsAccepted] = useState(true);

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
    general?: string;
  }>({});

  const passwordStrength = evaluatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!email.includes('@')) {
      newErrors.email = 'Please provide a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!termsAccepted) {
      newErrors.terms = 'You must accept the terms of service to continue';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    const result = await register({
      name,
      email,
      password,
      role,
      termsAccepted,
    });

    if (!result.success) {
      setErrors({ general: result.error || 'Registration failed.' });
    }
  };

  const getStrengthBarColor = (score: number) => {
    if (score <= 1) return 'bg-rose-500';
    if (score === 2) return 'bg-amber-500';
    if (score === 3) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-10 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Top back button */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setAuthStage('welcome')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to overview</span>
          </button>

          <button
            onClick={() => setAuthStage('login')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Already registered? Sign in
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Create your account
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Join thousands of developers mastering architecture and engineering.
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-8 shadow-xl rounded-3xl border border-slate-200 dark:border-slate-800">
          {errors.general && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <FormInput
              id="register-name"
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              error={errors.name}
              placeholder="e.g., Taylor Chen"
              required
            />

            {/* Email */}
            <FormInput
              id="register-email"
              label="Work or Personal Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              error={errors.email}
              placeholder="taylor@example.com"
              required
            />

            {/* Role Selection with Clear Learner Default Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Account Role</span>
                <span className="text-[10px] font-normal text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Default: Learner
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('learner')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                    role === 'learner'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-1 ring-blue-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Learner</span>
                    {role === 'learner' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                    Courses & Labs
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('instructor')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                    role === 'instructor'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-1 ring-blue-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Instructor</span>
                    {role === 'instructor' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                    Course Creation
                  </div>
                </button>
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="register-password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Min. 8 characters"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900 border text-slate-900 dark:text-white placeholder-slate-400 transition-colors pr-10 ${
                    errors.password
                      ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Password Strength:</span>
                    <span
                      className={`font-bold ${
                        passwordStrength.score >= 3
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : passwordStrength.score === 2
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>

                  {/* Visual Strength Segments */}
                  <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                    {[1, 2, 3, 4].map((seg) => (
                      <div
                        key={seg}
                        className={`h-full rounded-full transition-all duration-200 ${
                          passwordStrength.score >= seg
                            ? getStrengthBarColor(passwordStrength.score)
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Real-time Validation Criteria Badges */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[10px]">
                    <div
                      className={`flex items-center gap-1 ${
                        passwordStrength.hasMinLength
                          ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                          : 'text-slate-400'
                      }`}
                    >
                      {passwordStrength.hasMinLength ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <span className="w-3 h-3 rounded-full border border-slate-400 inline-block" />
                      )}
                      <span>8+ characters</span>
                    </div>

                    <div
                      className={`flex items-center gap-1 ${
                        passwordStrength.hasUppercase
                          ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                          : 'text-slate-400'
                      }`}
                    >
                      {passwordStrength.hasUppercase ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <span className="w-3 h-3 rounded-full border border-slate-400 inline-block" />
                      )}
                      <span>Uppercase & lowercase</span>
                    </div>

                    <div
                      className={`flex items-center gap-1 ${
                        passwordStrength.hasNumber
                          ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                          : 'text-slate-400'
                      }`}
                    >
                      {passwordStrength.hasNumber ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <span className="w-3 h-3 rounded-full border border-slate-400 inline-block" />
                      )}
                      <span>Number (0-9)</span>
                    </div>

                    <div
                      className={`flex items-center gap-1 ${
                        passwordStrength.hasSpecial
                          ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                          : 'text-slate-400'
                      }`}
                    >
                      {passwordStrength.hasSpecial ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <span className="w-3 h-3 rounded-full border border-slate-400 inline-block" />
                      )}
                      <span>Special symbol</span>
                    </div>
                  </div>
                </div>
              )}
              {errors.password && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <FormInput
                id="register-confirm-password"
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                error={errors.confirmPassword}
                placeholder="Re-enter password"
                required
              />
            </div>

            {/* Terms Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (errors.terms) setErrors((prev) => ({ ...prev, terms: undefined }));
                  }}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  I agree to the{' '}
                  <span className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                    Terms of Service
                  </span>{' '}
                  and{' '}
                  <span className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                    Privacy Policy
                  </span>
                  .
                </span>
              </label>
              {errors.terms && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{errors.terms}</p>
              )}
            </div>

            <PrimaryButton
              type="submit"
              size="lg"
              className="w-full mt-2"
              isLoading={state.isLoading}
            >
              <span>Create Account & Continue</span>
            </PrimaryButton>
          </form>
        </div>

        {/* Bottom sign-in link */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          Already have an account?{' '}
          <button
            onClick={() => setAuthStage('login')}
            className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Sign in instead
          </button>
        </p>
      </div>
    </div>
  );
};
