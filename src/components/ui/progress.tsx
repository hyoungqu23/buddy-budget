import { cn } from '@/lib/utils';
import * as React from 'react';

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number;
  tone?: 'normal' | 'warning' | 'danger';
};

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, tone = 'normal', ...props }, ref) => {
    const clamped = Math.max(0, Math.min(100, value));
    const barClass =
      tone === 'danger'
        ? 'bg-destructive'
        : tone === 'warning'
          ? 'bg-yellow-500 dark:bg-yellow-400'
          : 'bg-primary';
    return (
      <div
        ref={ref}
        role='progressbar'
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
        className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
        {...props}
      >
        <div
          className={cn('h-full w-full flex-1 transition-all', barClass)}
          style={{ transform: `translateX(-${100 - clamped}%)` }}
        />
      </div>
    );
  },
);
Progress.displayName = 'Progress';

export { Progress };
