import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-dark focus-visible:outline-primary',
        secondary: 'bg-neutral-100 text-foreground hover:bg-neutral-200 focus-visible:outline-primary dark:bg-neutral-800 dark:hover:bg-neutral-700',
        ghost: 'hover:bg-neutral-100 text-foreground focus-visible:outline-primary dark:hover:bg-neutral-800',
        outline: 'border border-border bg-transparent hover:bg-neutral-50 text-foreground focus-visible:outline-primary dark:hover:bg-neutral-900',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, children, disabled, ...props }, ref) => (
    <button
      className={clsx(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={loading || disabled}
      ref={ref}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
);

Button.displayName = 'Button';

export { Button, buttonVariants };
