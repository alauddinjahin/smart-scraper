'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize    = 'xs' | 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:   'bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] active:scale-[0.98]',
  secondary: 'bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-md)] hover:bg-[var(--bg-page)] active:scale-[0.98]',
  ghost:     'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] active:scale-[0.98]',
  danger:    'bg-[var(--danger-subtle)] text-[var(--danger-text)] border border-[var(--danger)] border-opacity-30 hover:bg-[var(--danger)] hover:text-white active:scale-[0.98]',
  outline:   'border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] active:scale-[0.98]',
};

const SIZES: Record<ButtonSize, string> = {
  xs: 'h-6  px-2   text-[11px] gap-1   rounded-[var(--radius-sm)]',
  sm: 'h-7  px-3   text-xs     gap-1.5 rounded-[var(--radius-md)]',
  md: 'h-9  px-4   text-sm     gap-2   rounded-[var(--radius-md)]',
  lg: 'h-10 px-5   text-sm     gap-2   rounded-[var(--radius-lg)]',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:    ButtonVariant;
  size?:       ButtonSize;
  loading?:    boolean;
  leftIcon?:   ReactNode;
  rightIcon?:  ReactNode;
  fullWidth?:  boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth,
      disabled,
      children,
      className,
      ...rest
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-[var(--duration-fast)]',
        'focus-visible:outline-2 focus-visible:outline-[var(--brand)] focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  )
);

Button.displayName = 'Button';
export default Button;
