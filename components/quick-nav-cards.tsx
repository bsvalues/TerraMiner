"use client";

import Link from "next/link";
import {
  FileText,
  Bell,
  History,
  Calculator,
  Scale,
  Grid3X3,
  Upload,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickNavItem {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  badge?: string;
}

const NAV_ITEMS: QuickNavItem[] = [
  {
    label: "Reports",
    description: "IAAO compliance reports",
    href: "/reports",
    icon: FileText,
    color: "text-primary",
    bgColor: "bg-primary/10",
    badge: "8 ready",
  },
  {
    label: "Notifications",
    description: "Alerts and activity feed",
    href: "/notifications",
    icon: Bell,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    badge: "3 unread",
  },
  {
    label: "Audit Trail",
    description: "Full change history",
    href: "/audit",
    icon: History,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    label: "Analytics",
    description: "Market trends and ratios",
    href: "/analytics",
    icon: BarChart3,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
];

export function QuickNavCards({ className }: { className?: string }) {
  return (
    <section aria-label="Quick Access" className={className}>
      <div className="mb-3 flex items-center gap-2">
        <Grid3X3 className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Quick Access</h2>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", item.bgColor)}>
              <item.icon className={cn("h-4 w-4", item.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[8px] font-bold text-muted-foreground">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="truncate text-[10px] text-muted-foreground">{item.description}</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </section>
  );
}
