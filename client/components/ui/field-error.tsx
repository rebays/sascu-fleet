import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export function FieldError({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  if (!children) return null;

  return (
    <p
      role="alert"
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium text-destructive",
        "animate-in fade-in-0 slide-in-from-top-1 duration-200",
        className
      )}
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {children}
    </p>
  );
}
