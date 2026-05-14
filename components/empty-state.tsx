"use client";

import { cn } from "@/lib/utils";
import {
  Search,
  FileX,
  Database,
  BarChart3,
  Home,
  Users,
  Scale,
  MapPin,
  type LucideIcon,
} from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "compact" | "card";
  className?: string;
}

const ILLUSTRATIONS: Record<string, LucideIcon> = {
  search: Search,
  file: FileX,
  database: Database,
  chart: BarChart3,
  property: Home,
  agent: Users,
  assessment: Scale,
  neighborhood: MapPin,
};

export function EmptyState({
  icon: Icon = FileX,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  if (variant === "compact") {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-3 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-8 text-center",
        className
      )}>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5">
          <Icon className="h-6 w-6 text-primary/60" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 max-w-[280px] text-xs text-muted-foreground">{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-4 rounded-md border border-primary/30 bg-primary/5 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/10"
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }

  // Default variant - full page empty state
  return (
    <div className={cn(
      "flex min-h-[400px] flex-col items-center justify-center text-center",
      className
    )}>
      {/* Decorative background */}
      <div className="relative mb-6">
        <div className="absolute inset-0 -z-10 h-32 w-32 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-2xl" />
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border/50 bg-card shadow-sm">
          <Icon className="h-10 w-10 text-muted-foreground/60" />
        </div>
      </div>

      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>

      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {action.label}
        </button>
      )}

      {/* Subtle grid lines decoration */}
      <div className="absolute inset-0 -z-20 opacity-[0.015]">
        <div className="h-full w-full bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>
    </div>
  );
}

// Pre-configured empty states for common scenarios
export const EmptyStates = {
  NoProperties: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Home}
      title="No properties found"
      description="Try adjusting your filters or search criteria to find properties."
      {...props}
    />
  ),

  NoSearchResults: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Search}
      title="No results found"
      description="We couldn't find any matches for your search. Try different keywords."
      {...props}
    />
  ),

  NoAssessmentData: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Scale}
      title="No assessment data"
      description="There's no assessment data available for this selection. Try selecting a different area or time period."
      {...props}
    />
  ),

  NoNeighborhoods: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={MapPin}
      title="No neighborhoods found"
      description="No neighborhood data is available for the selected criteria."
      {...props}
    />
  ),

  NoAgentTasks: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Users}
      title="No tasks yet"
      description="This agent hasn't processed any tasks. Submit a query to get started."
      {...props}
    />
  ),

  NoChartData: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={BarChart3}
      title="No chart data"
      description="There's not enough data to display this chart."
      variant="compact"
      {...props}
    />
  ),

  DatabaseEmpty: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Database}
      title="Database is empty"
      description="No data has been imported yet. Run the ETL pipeline to populate the database."
      {...props}
    />
  ),
};

export { ILLUSTRATIONS };
