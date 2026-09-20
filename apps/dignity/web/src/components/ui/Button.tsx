import React, { forwardRef } from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'soft'
  | 'success'
  | 'link';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Size token mapping for Buttons.
 * Ensures accessibility touch targets and consistent typography.
 */
export const buttonSizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-xs font-semibold rounded-md gap-1 min-h-[28px]',
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg gap-1.5 min-h-[32px]',
  md: 'px-4 py-2 text-sm font-semibold rounded-xl gap-2 min-h-[40px]',
  lg: 'px-5 py-2.5 text-base font-semibold rounded-xl gap-2.5 min-h-[48px]',
};

/**
 * Variant styles mapped directly to design tokens in index.css:
 * --primary-main, --primary-hover, --primary-soft, --primary-text
 * --secondary-main, --secondary-soft
 * --border-main, --border-subtle
 * --text-primary, --text-secondary, --text-muted
 * --color-error, --color-error-soft
 * --color-success, --color-success-soft
 * --shadow-subtle, --shadow-medium
 */
export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--primary-main)] hover:bg-[var(--primary-hover)] text-[var(--primary-text)] shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-medium)] focus-visible:ring-[var(--primary-main)]',
  secondary:
    'bg-[var(--secondary-soft)] hover:bg-slate-200 dark:hover:bg-slate-700/80 text-[var(--text-primary)] border border-[var(--border-main)] focus-visible:ring-[var(--border-main)]',
  outline:
    'bg-transparent hover:bg-[var(--secondary-soft)] text-[var(--text-primary)] border border-[var(--border-main)] hover:border-[var(--primary-main)] focus-visible:ring-[var(--primary-main)]',
  ghost:
    'bg-transparent hover:bg-[var(--secondary-soft)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:ring-[var(--border-main)]',
  destructive:
    'bg-[var(--color-error)] hover:opacity-90 text-white shadow-[var(--shadow-subtle)] focus-visible:ring-[var(--color-error)]',
  soft:
    'bg-[var(--primary-soft)] hover:opacity-85 text-[var(--primary-main)] border border-[var(--primary-main)]/20 focus-visible:ring-[var(--primary-main)]',
  success:
    'bg-[var(--color-success)] hover:opacity-90 text-white shadow-[var(--shadow-subtle)] focus-visible:ring-[var(--color-success)]',
  link:
    'bg-transparent text-[var(--primary-main)] underline-offset-4 hover:underline p-0 min-h-0 focus-visible:ring-[var(--primary-main)]',
};

/**
 * Universal Reusable Button Component
 * Driven by design tokens from index.css.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isSpinnerOnly = isLoading && !loadingText;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
          buttonSizeClasses[size]
        } ${buttonVariantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"
            role="status"
            aria-hidden="true"
          />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}

        {isSpinnerOnly ? (
          <span>{children}</span>
        ) : isLoading && loadingText ? (
          <span>{loadingText}</span>
        ) : (
          children && <span>{children}</span>
        )}

        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

/**
 * Convenience Token-Bound Aliases for Backwards Compatibility
 * and Clean Call Sites
 */
export type BaseButtonProps = Omit<ButtonProps, 'variant'>;

export const PrimaryButton = forwardRef<HTMLButtonElement, BaseButtonProps>((props, ref) => (
  <Button ref={ref} variant="primary" {...props} />
));
PrimaryButton.displayName = 'PrimaryButton';

export const SecondaryButton = forwardRef<HTMLButtonElement, BaseButtonProps>((props, ref) => (
  <Button ref={ref} variant="secondary" {...props} />
));
SecondaryButton.displayName = 'SecondaryButton';

export const GhostButton = forwardRef<HTMLButtonElement, BaseButtonProps>((props, ref) => (
  <Button ref={ref} variant="ghost" {...props} />
));
GhostButton.displayName = 'GhostButton';

export const DestructiveButton = forwardRef<HTMLButtonElement, BaseButtonProps>((props, ref) => (
  <Button ref={ref} variant="destructive" {...props} />
));
DestructiveButton.displayName = 'DestructiveButton';

export const OutlineButton = forwardRef<HTMLButtonElement, BaseButtonProps>((props, ref) => (
  <Button ref={ref} variant="outline" {...props} />
));
OutlineButton.displayName = 'OutlineButton';

export const SoftButton = forwardRef<HTMLButtonElement, BaseButtonProps>((props, ref) => (
  <Button ref={ref} variant="soft" {...props} />
));
SoftButton.displayName = 'SoftButton';

export const SuccessButton = forwardRef<HTMLButtonElement, BaseButtonProps>((props, ref) => (
  <Button ref={ref} variant="success" {...props} />
));
SuccessButton.displayName = 'SuccessButton';

/**
 * IconButton Component
 * Reusable icon button component utilizing design tokens
 */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: ButtonVariant;
  ariaLabel?: string;
  'aria-label'?: string;
  isLoading?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      children,
      size = 'md',
      variant = 'ghost',
      ariaLabel,
      className = '',
      isLoading = false,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const accessibleLabel = ariaLabel || props['aria-label'] || 'Button action';

    const sizeMap = {
      xs: 'w-7 h-7 rounded-md p-1 text-xs',
      sm: 'w-8 h-8 rounded-lg p-1.5 text-xs',
      md: 'w-10 h-10 rounded-xl p-2 text-sm',
      lg: 'w-12 h-12 rounded-xl p-2.5 text-base',
    };

    return (
      <button
        ref={ref}
        type={type}
        aria-label={accessibleLabel}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
          sizeMap[size]
        } ${buttonVariantClasses[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            role="status"
            aria-hidden="true"
          />
        ) : (
          children
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
