import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-3",
  lg: "h-12 w-12 border-4",
};

export function Spinner({ className, size = "md" }: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-brand-teal border-b-transparent",
        sizeClasses[size],
        className
      )}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Spinner size="lg" />
    </div>
  );
}
