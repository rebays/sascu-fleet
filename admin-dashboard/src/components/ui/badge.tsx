import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default'|'success' | 'secondary' | 'destructive' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === 'default' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
        variant === 'success' && 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
        variant === 'secondary' && 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200',
        variant === 'destructive' && 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
        variant === 'outline' && 'bg-transparent border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-300',
        className
      )}
      {...props}
    />
  );
}