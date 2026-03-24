'use client';

import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:    string;
  error?:    string;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className, id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] [&>svg]:w-4 [&>svg]:h-4">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'h-9 w-full rounded-[var(--radius-md)] border bg-[var(--bg-surface)]',
              'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
              'transition-colors duration-[var(--duration-fast)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-opacity-40 focus:border-[var(--brand)]',
              error
                ? 'border-[var(--danger)]'
                : 'border-[var(--border-md)] hover:border-[var(--border-strong)]',
              leftIcon ? 'pl-9 pr-3' : 'px-3',
              className
            )}
            {...rest}
          />
        </div>
        {error && (
          <p className="text-xs text-[var(--danger-text)]">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...rest }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            'h-9 w-full rounded-[var(--radius-md)] border bg-[var(--bg-surface)]',
            'text-sm text-[var(--text-primary)] px-3 pr-8',
            'transition-colors duration-[var(--duration-fast)] appearance-none',
            'focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-opacity-40 focus:border-[var(--brand)]',
            error
              ? 'border-[var(--danger)]'
              : 'border-[var(--border-md)] hover:border-[var(--border-strong)]',
            className
          )}
          style={{
            backgroundImage:    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat:   'no-repeat',
            backgroundPosition: 'right 10px center',
          }}
          {...rest}
        >
          {children}
        </select>
        {error && <p className="text-xs text-[var(--danger-text)]">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
