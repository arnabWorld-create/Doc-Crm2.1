import * as React from "react";
import { cn } from "@/lib/utils";

type StatCardVariant = "teal" | "yellow" | "red" | "white-teal" | "white-red" | "white-yellow";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  subtitle?: string;
  variant?: StatCardVariant;
  className?: string;
  onClick?: () => void;
}

const variantStyles: Record<StatCardVariant, { card: string; icon: string; value: string; title: string; badge?: string }> = {
  teal: {
    card: "bg-gradient-to-br from-brand-teal to-brand-teal/90 text-white",
    icon: "bg-white/20",
    value: "text-white",
    title: "text-white/90",
  },
  yellow: {
    card: "bg-gradient-to-br from-brand-yellow to-brand-yellow/90 text-white",
    icon: "bg-white/20",
    value: "text-white",
    title: "text-white/90",
  },
  red: {
    card: "bg-gradient-to-br from-brand-red to-brand-red/90 text-white",
    icon: "bg-white/20",
    value: "text-white",
    title: "text-white/90",
  },
  "white-teal": {
    card: "bg-white border-2 border-brand-teal",
    icon: "bg-brand-teal/10",
    value: "text-brand-teal",
    title: "text-gray-600",
  },
  "white-red": {
    card: "bg-white border-2 border-brand-red",
    icon: "bg-brand-red/10",
    value: "text-brand-red",
    title: "text-gray-600",
  },
  "white-yellow": {
    card: "bg-white border-2 border-brand-yellow",
    icon: "bg-brand-yellow/10",
    value: "text-brand-yellow",
    title: "text-gray-600",
  },
};

export function StatCard({
  title,
  value,
  icon,
  badge,
  subtitle,
  variant = "white-teal",
  className,
  onClick,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all hover:scale-[1.02] cursor-default",
        styles.card,
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn("p-2 sm:p-3 rounded-lg", styles.icon)}>{icon}</div>
        {badge && <div className="text-xs font-medium">{badge}</div>}
      </div>
      <h3 className={cn("text-2xl sm:text-3xl font-bold mb-1", styles.value)}>{value}</h3>
      <p className={cn("text-xs sm:text-sm", styles.title)}>{title}</p>
      {subtitle && <p className="text-xs mt-1 opacity-75">{subtitle}</p>}
    </div>
  );
}
