import React from 'react';
import clsx from 'clsx';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  initials?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, size = 'md', initials, className, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);

    const showInitials = !src || imageError;

    return (
      <div
        className={clsx(
          'inline-flex items-center justify-center rounded-full bg-primary text-white font-semibold overflow-hidden',
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {!showInitials && src ? (
          <img
            src={src}
            alt={alt || 'Avatar'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
