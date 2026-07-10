import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'destructive' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 [&_svg]:shrink-0",
        // Default variant
        variant === 'default' && "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-600 dark:active:bg-blue-700 focus-visible:ring-blue-500",
        // Outline variant
        variant === 'outline' && "border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600 focus-visible:ring-blue-500",
        // Destructive variant
        variant === 'destructive' && "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 dark:bg-red-500 dark:hover:bg-red-600 dark:active:bg-red-700 focus-visible:ring-red-500",
        // Ghost variant
        variant === 'ghost' && "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white active:bg-gray-200 dark:active:bg-slate-600 focus-visible:ring-blue-500",
        // Sizes
        size === 'sm' && "h-8 px-3 text-sm",
        size === 'default' && "h-9 px-4 text-sm",
        size === 'lg' && "h-11 px-6 text-base",
        size === 'icon' && "h-9 w-9 p-0",
        // Disabled state
        'disabled:cursor-not-allowed disabled:opacity-50 dark:disabled:opacity-40',
        className,
      )}
      {...props}
    />
  );
}
