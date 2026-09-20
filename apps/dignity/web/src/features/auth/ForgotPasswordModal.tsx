import React, { useState } from 'react';
import { Mail, CheckCircle2, ArrowLeft, Send, Sparkles } from 'lucide-react';
import { Modal } from '../../components/ui/Overlay';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { FormInput } from '../../components/ui/Input';
import { useAuth } from '../../state/auth/AuthContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
}) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState(defaultEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const result = await resetPassword(email);
    setIsSubmitting(false);

    if (result.success) {
      setSubmitted(true);
      setResendCooldown(30);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setError(result.error || 'Failed to send reset email.');
    }
  };

  const handleResetForm = () => {
    setSubmitted(false);
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={submitted ? 'Check Your Inbox' : 'Reset Your Password'}
      description={
        submitted
          ? `We sent password reset instructions to ${email}`
          : 'Enter your registered account email and we will send you a secure password reset link.'
      }
    >
      {submitted ? (
        <div className="py-2 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            Please check your email and click the link in the message. In this prototype, the reset flow is fully simulated.
          </p>

          <div className="flex flex-col gap-2.5">
            <PrimaryButton
              size="md"
              onClick={() => {
                onClose();
                handleResetForm();
              }}
              className="w-full"
            >
              Return to Sign In
            </PrimaryButton>

            <button
              type="button"
              disabled={resendCooldown > 0}
              onClick={handleSubmit}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline py-1"
            >
              {resendCooldown > 0
                ? `Resend link in ${resendCooldown}s`
                : "Didn't receive email? Resend"}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-400">
              {error}
            </div>
          )}

          <FormInput
            id="forgot-password-email"
            label="Account Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., a.rivera@eduplatform.io"
            required
            autoFocus
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <SecondaryButton type="button" size="md" onClick={onClose}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" size="md" isLoading={isSubmitting}>
              Send Reset Link
            </PrimaryButton>
          </div>
        </form>
      )}
    </Modal>
  );
};
