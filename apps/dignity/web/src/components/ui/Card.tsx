import React, { forwardRef } from 'react';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'interactive' | 'subtle';
export type CardPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  as?: 'div' | 'section' | 'article';
}

/**
 * Card variant styling mapped to design tokens in index.css:
 * --surface-main, --surface-elevated, --secondary-soft
 * --border-main, --border-subtle
 * --text-primary, --text-secondary
 * --shadow-subtle, --shadow-medium, --shadow-high
 */
export const cardVariantClasses: Record<CardVariant, string> = {
  default:
    'bg-[var(--surface-main)] border border-[var(--border-main)] text-[var(--text-primary)] shadow-[var(--shadow-subtle)]',
  elevated:
    'bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] shadow-[var(--shadow-medium)] hover:shadow-[var(--shadow-high)] transition-shadow duration-200',
  outlined:
    'bg-transparent border border-[var(--border-main)] text-[var(--text-primary)]',
  interactive:
    'bg-[var(--surface-main)] border border-[var(--border-main)] text-[var(--text-primary)] shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-medium)] hover:border-[var(--primary-main)] transition-all duration-200 cursor-pointer group active:scale-[0.995]',
  subtle:
    'bg-[var(--secondary-soft)] border border-[var(--border-subtle)] text-[var(--text-primary)]',
};

export const cardPaddingClasses: Record<CardPadding, string> = {
  none: 'p-0',
  xs: 'p-3',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

/**
 * Reusable Card Component
 * Styled using centralized design tokens for surfaces, borders, and shadows.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      className = '',
      as = 'div',
      ...props
    },
    ref
  ) => {
    const Component = as;

    return (
      <Component
        ref={ref}
        className={`rounded-2xl transition-colors duration-200 ${cardVariantClasses[variant]} ${cardPaddingClasses[padding]} ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

export default Card;

/**
 * Card Header Component
 * Supports structured title/subtitle/action props OR arbitrary children
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, action, className = '', children, ...props }, ref) => {
    if (children) {
      return (
        <div
          ref={ref}
          className={`flex items-start justify-between gap-4 mb-4 ${className}`}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={`flex items-start justify-between gap-4 mb-4 ${className}`}
        {...props}
      >
        <div>
          {title && (
            <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

/**
 * Card Title Component
 */
export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ children, className = '', ...props }, ref) => (
    <h3
      ref={ref}
      className={`text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
);
CardTitle.displayName = 'CardTitle';

/**
 * Card Description Component
 */
export const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ children, className = '', ...props }, ref) => (
  <p
    ref={ref}
    className={`text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 ${className}`}
    {...props}
  >
    {children}
  </p>
));
CardDescription.displayName = 'CardDescription';

/**
 * Card Body Component (also aliased as CardContent)
 */
export const CardBody = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div ref={ref} className={`text-[var(--text-primary)] ${className}`} {...props}>
        {children}
      </div>
    );
  }
);
CardBody.displayName = 'CardBody';

export const CardContent = CardBody;

/**
 * Card Footer Component
 * Styled with subtle border divider and muted text
 */
export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`mt-4 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs sm:text-sm text-[var(--text-secondary)] ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardFooter.displayName = 'CardFooter';
