import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, ...props }, ref) => (
    <div
      className={clsx(
        'rounded bg-background border border-border shadow-sm transition-all duration-200',
        hoverable && 'hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600 cursor-pointer',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);

Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={clsx('flex flex-col space-y-1.5 p-6 border-b border-border', className)}
    ref={ref}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    className={clsx('text-lg font-semibold leading-none tracking-tight', className)}
    ref={ref}
    {...props}
  />
));

CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p className={clsx('text-sm text-foreground-secondary', className)} ref={ref} {...props} />
));

CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div className={clsx('p-6 pt-0', className)} ref={ref} {...props} />
));

CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={clsx('flex items-center p-6 pt-0', className)}
    ref={ref}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
