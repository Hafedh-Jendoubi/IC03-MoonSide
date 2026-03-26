import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, type = 'text', ...props }, ref) => (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        type={type}
        className={clsx(
          'w-full px-3 py-2 border border-border rounded bg-background text-foreground placeholder-neutral-400 transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 focus:border-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-error focus:ring-error',
          className
        )}
        ref={ref}
        {...props}
      />
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  )
);

Input.displayName = 'Input';

export { Input };
