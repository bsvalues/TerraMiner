"use client";

import { useState, useMemo } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Home,
  Scale,
  FileText,
  Users,
  Settings,
  ChevronRight,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

type NotificationType = "info" | "success" | "warning" | "error" | "task";
type NotificationCategory = "assessment" | "property" | "report" | "system" | "workflow";

interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, string | number>;
}

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: "n1",
    type: "warning",
    category: "assessment",
    title: "Ratio Study Alert",
    message: "COD for KW-03 Canyon Lakes neighborhood has exceeded IAAO threshold (15.2% vs 15.0% max).",
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
    read: false,
    actionUrl: "/analytics",
    actionLabel: "View Analysis",
    metadata: { neighborhood: "KW-03", cod: 15.2 },
  },
  {
    id: "n2",
    type: "task",
    category: "workflow",
    title: "Review Required",
    message: "3 properties flagged for manual review in your queue.",
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 min ago
    read: false,
    actionUrl: "/properties?filter=flagged",
    actionLabel: "Review Now",
    metadata: { count: 3 },
  },
  {
    id: "n3",
    type: "success",
    category: "report",
    title: "Report Generated",
    message: "Q2 2026 IAAO Ratio Study Report is ready for download.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
    actionUrl: "/reports",
    actionLabel: "Download",
  },
  {
    id: "n4",
    type: "info",
    category: "property",
    title: "Appeal Filed",
    message: "New assessment appeal filed for 1425 Columbia Park Trail.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    read: true,
    actionUrl: "/properties/prop-001",
    actionLabel: "View Property",
    metadata: { propertyId: "prop-001" },
  },
  {
    id: "n5",
    type: "success",
    category: "assessment",
    title: "Batch Update Complete",
    message: "Successfully updated 47 property assessments in RI-02 neighborhood.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    read: true,
    metadata: { count: 47, neighborhood: "RI-02" },
  },
  {
    id: "n6",
    type: "error",
    category: "system",
    title: "Sync Failed",
    message: "Failed to sync with county database. Retrying in 5 minutes.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    read: true,
  },
  {
    id: "n7",
    type: "info",
    category: "workflow",
    title: "Sales Validation",
    message: "12 new sales pending validation from MLS feed.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
    actionUrl: "/assessment",
    actionLabel: "Validate Sales",
    metadata: { count: 12 },
  },
  {
    id: "n8",
    type: "warning",
    category: "assessment",
    title: "Deadline Reminder",
    message: "Annual assessment certification deadline is in 14 days.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    read: true,
    metadata: { daysRemaining: 14 },
  },
];

const typeConfig: Record<NotificationType, { icon: typeof Info; color: string; bgColor: string }> = {
  info: { icon: Info, color: "text-primary", bgColor: "bg-primary/10" },
  success: { icon: CheckCircle2, color: "text-[hsl(var(--success))]", bgColor: "bg-[hsl(var(--success))]/10" },
  warning: { icon: AlertTriangle, color: "text-[hsl(var(--warning))]", bgColor: "bg-[hsl(var(--warning))]/10" },
  error: { icon: XCircle, color: "text-destructive", bgColor: "bg-destructive/10" },
  task: { icon: Clock, color: "text-violet-500", bgColor: "bg-violet-500/10" },
};

const categoryConfig: Record<NotificationCategory, { icon: typeof Home; label: string }> = {
  assessment: { icon: Scale, label: "Assessment" },
  property: { icon: Home, label: "Property" },
  report: { icon: FileText, label: "Report" },
  system: { icon: Settings, label: "System" },
  workflow: { icon: Users, label: "Workflow" },
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

interface NotificationsCenterProps {
  className?: string;
}

export function NotificationsCenter({ className }: NotificationsCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === "unread" && n.read) return false;
      if (categoryFilter !== "all" && n.category !== categoryFilter) return false;
      return true;
    });
  }, [notifications, filter, categoryFilter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              showFilters
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
          <div className="flex gap-1">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors",
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setCategoryFilter("all")}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                categoryFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              All
            </button>
            {(Object.keys(categoryConfig) as NotificationCategory[]).map((cat) => {
              const config = categoryConfig[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                    categoryFilter === cat
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <config.icon className="h-3 w-3" />
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Notification List */}
      <div className="max-h-[500px] divide-y divide-border overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No notifications</p>
            <p className="text-xs text-muted-foreground">
              {filter === "unread" ? "All caught up!" : "Nothing to show"}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const typeConf = typeConfig[notification.type];
            const catConf = categoryConfig[notification.category];
            const TypeIcon = typeConf.icon;

            return (
              <div
                key={notification.id}
                className={cn(
                  "group relative flex gap-3 p-4 transition-colors hover:bg-muted/50",
                  !notification.read && "bg-primary/5"
                )}
              >
                {/* Unread indicator */}
                {!notification.read && (
                  <div className="absolute left-1.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary" />
                )}

                {/* Icon */}
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", typeConf.bgColor)}>
                  <TypeIcon className={cn("h-4 w-4", typeConf.color)} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm font-medium", !notification.read ? "text-foreground" : "text-muted-foreground")}>
                          {notification.title}
                        </p>
                        <span className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          <catConf.icon className="h-2.5 w-2.5" />
                          {catConf.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatTimeAgo(notification.timestamp)}
                    </span>
                  </div>

                  {/* Action button */}
                  {notification.actionUrl && (
                    <a
                      href={notification.actionUrl}
                      onClick={() => markAsRead(notification.id)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      {notification.actionLabel || "View"}
                      <ChevronRight className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          <span className="text-xs text-muted-foreground">
            {filteredNotifications.length} of {notifications.length} notifications
          </span>
          <button
            onClick={clearAll}
            className="text-xs font-medium text-muted-foreground hover:text-destructive"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

// Bell button with badge for header/topbar
interface NotificationBellProps {
  count?: number;
  onClick?: () => void;
}

export function NotificationBell({ count = 0, onClick }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label={`${count} notifications`}
    >
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
