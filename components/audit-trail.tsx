"use client";

import { useState, useMemo } from "react";
import {
  History,
  User,
  Edit3,
  Plus,
  Trash2,
  Eye,
  Download,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Clock,
  FileText,
  Scale,
  Home,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

type AuditAction = "create" | "update" | "delete" | "view" | "export" | "import" | "approve" | "reject";
type AuditCategory = "property" | "assessment" | "appeal" | "exemption" | "sale" | "system";

interface AuditChange {
  field: string;
  oldValue: string | number | null;
  newValue: string | number | null;
}

interface AuditEntry {
  id: string;
  timestamp: Date;
  action: AuditAction;
  category: AuditCategory;
  user: {
    name: string;
    role: string;
    avatar?: string;
  };
  entityId: string;
  entityType: string;
  entityLabel: string;
  description: string;
  changes?: AuditChange[];
  metadata?: Record<string, string | number>;
  ipAddress?: string;
}

// Mock audit data
const mockAuditEntries: AuditEntry[] = [
  {
    id: "a1",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    action: "update",
    category: "assessment",
    user: { name: "Sarah Chen", role: "Senior Assessor" },
    entityId: "prop-001",
    entityType: "property",
    entityLabel: "1425 Columbia Park Trail",
    description: "Updated assessed value",
    changes: [
      { field: "Assessed Value", oldValue: 275000, newValue: 285000 },
      { field: "Assessment Ratio", oldValue: 0.92, newValue: 0.95 },
    ],
    ipAddress: "192.168.1.45",
  },
  {
    id: "a2",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    action: "approve",
    category: "appeal",
    user: { name: "Mike Rodriguez", role: "Assessment Manager" },
    entityId: "appeal-123",
    entityType: "appeal",
    entityLabel: "Appeal #2024-0123",
    description: "Approved partial reduction",
    changes: [
      { field: "Appeal Status", oldValue: "Under Review", newValue: "Approved (Partial)" },
      { field: "Final Value", oldValue: null, newValue: 245000 },
    ],
    metadata: { originalValue: 285000, requestedValue: 220000, finalValue: 245000 },
  },
  {
    id: "a3",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    action: "create",
    category: "exemption",
    user: { name: "Lisa Park", role: "Exemption Specialist" },
    entityId: "ex-456",
    entityType: "exemption",
    entityLabel: "Senior Citizen Exemption",
    description: "Added exemption for 2890 Bombing Range Rd",
    changes: [
      { field: "Exemption Type", oldValue: null, newValue: "Senior Citizen" },
      { field: "Exemption Amount", oldValue: null, newValue: 50000 },
    ],
  },
  {
    id: "a4",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    action: "import",
    category: "system",
    user: { name: "System", role: "Automated Process" },
    entityId: "import-789",
    entityType: "batch",
    entityLabel: "MLS Sales Feed",
    description: "Imported 47 new sales records",
    metadata: { totalRecords: 47, validRecords: 45, errorRecords: 2 },
  },
  {
    id: "a5",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
    action: "update",
    category: "property",
    user: { name: "James Wilson", role: "Data Entry Clerk" },
    entityId: "prop-002",
    entityType: "property",
    entityLabel: "2890 Bombing Range Rd",
    description: "Updated property characteristics",
    changes: [
      { field: "Square Feet", oldValue: 2100, newValue: 2250 },
      { field: "Year Built", oldValue: 2003, newValue: 2005 },
      { field: "Bedrooms", oldValue: 3, newValue: 4 },
    ],
  },
  {
    id: "a6",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    action: "view",
    category: "property",
    user: { name: "External User", role: "Property Owner" },
    entityId: "prop-003",
    entityType: "property",
    entityLabel: "456 Keene Rd",
    description: "Viewed property assessment details",
    ipAddress: "73.158.42.88",
  },
  {
    id: "a7",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    action: "export",
    category: "system",
    user: { name: "Sarah Chen", role: "Senior Assessor" },
    entityId: "report-101",
    entityType: "report",
    entityLabel: "Q2 2026 Ratio Study Report",
    description: "Exported report to PDF",
    metadata: { format: "PDF", pages: 24 },
  },
  {
    id: "a8",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    action: "reject",
    category: "appeal",
    user: { name: "Mike Rodriguez", role: "Assessment Manager" },
    entityId: "appeal-124",
    entityType: "appeal",
    entityLabel: "Appeal #2024-0124",
    description: "Denied appeal - insufficient evidence",
    changes: [
      { field: "Appeal Status", oldValue: "Hearing Complete", newValue: "Denied" },
    ],
  },
];

const actionConfig: Record<AuditAction, { icon: typeof Edit3; color: string; bgColor: string; label: string }> = {
  create: { icon: Plus, color: "text-[hsl(var(--success))]", bgColor: "bg-[hsl(var(--success))]/10", label: "Created" },
  update: { icon: Edit3, color: "text-primary", bgColor: "bg-primary/10", label: "Updated" },
  delete: { icon: Trash2, color: "text-destructive", bgColor: "bg-destructive/10", label: "Deleted" },
  view: { icon: Eye, color: "text-muted-foreground", bgColor: "bg-muted", label: "Viewed" },
  export: { icon: Download, color: "text-violet-500", bgColor: "bg-violet-500/10", label: "Exported" },
  import: { icon: FileText, color: "text-amber-500", bgColor: "bg-amber-500/10", label: "Imported" },
  approve: { icon: Scale, color: "text-[hsl(var(--success))]", bgColor: "bg-[hsl(var(--success))]/10", label: "Approved" },
  reject: { icon: AlertTriangle, color: "text-destructive", bgColor: "bg-destructive/10", label: "Rejected" },
};

const categoryConfig: Record<AuditCategory, { icon: typeof Home; label: string }> = {
  property: { icon: Home, label: "Property" },
  assessment: { icon: Scale, label: "Assessment" },
  appeal: { icon: Scale, label: "Appeal" },
  exemption: { icon: DollarSign, label: "Exemption" },
  sale: { icon: DollarSign, label: "Sale" },
  system: { icon: FileText, label: "System" },
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

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface AuditTrailProps {
  propertyId?: string;
  className?: string;
  compact?: boolean;
}

export function AuditTrail({ propertyId, className, compact = false }: AuditTrailProps) {
  const [entries] = useState<AuditEntry[]>(
    propertyId
      ? mockAuditEntries.filter((e) => e.entityId === propertyId || e.category === "property")
      : mockAuditEntries
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<AuditCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          e.entityLabel.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query) ||
          e.user.name.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [entries, actionFilter, categoryFilter, searchQuery]);

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (compact) {
    return (
      <div className={cn("rounded-xl border border-border bg-card", className)}>
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
          </div>
          <a href="/audit" className="text-xs font-medium text-primary hover:underline">
            View all
          </a>
        </div>
        <div className="divide-y divide-border">
          {entries.slice(0, 5).map((entry) => {
            const actionConf = actionConfig[entry.action];
            const ActionIcon = actionConf.icon;

            return (
              <div key={entry.id} className="flex items-start gap-3 p-3">
                <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", actionConf.bgColor)}>
                  <ActionIcon className={cn("h-3.5 w-3.5", actionConf.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground">
                    <span className="font-medium">{entry.user.name}</span>{" "}
                    <span className="text-muted-foreground">{entry.description.toLowerCase()}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">{formatTimeAgo(entry.timestamp)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <History className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Audit Trail</h2>
            <p className="text-xs text-muted-foreground">
              {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="h-8 w-48 rounded-lg border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              showFilters
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground">Action:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setActionFilter("all")}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                actionFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              All
            </button>
            {(["create", "update", "delete", "approve", "reject"] as AuditAction[]).map((action) => (
              <button
                key={action}
                onClick={() => setActionFilter(action)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors",
                  actionFilter === action
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {action}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-medium text-muted-foreground">Category:</span>
          <div className="flex gap-1">
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
            {(Object.keys(categoryConfig) as AuditCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors",
                  categoryFilter === cat
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {categoryConfig[cat].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Entry List */}
      <div className="max-h-[600px] divide-y divide-border overflow-y-auto">
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <History className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No audit entries</p>
            <p className="text-xs text-muted-foreground">No matching records found</p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const actionConf = actionConfig[entry.action];
            const catConf = categoryConfig[entry.category];
            const ActionIcon = actionConf.icon;
            const isExpanded = expandedId === entry.id;

            return (
              <div key={entry.id} className="group">
                <div
                  className={cn(
                    "flex cursor-pointer gap-4 p-4 transition-colors hover:bg-muted/50",
                    isExpanded && "bg-muted/30"
                  )}
                  onClick={() => entry.changes && toggleExpanded(entry.id)}
                >
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", actionConf.bgColor)}>
                      <ActionIcon className={cn("h-4 w-4", actionConf.color)} />
                    </div>
                    <div className="mt-2 flex-1 w-0.5 bg-border" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs font-medium", actionConf.color)}>
                            {actionConf.label}
                          </span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {catConf.label}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-foreground">{entry.description}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {entry.entityLabel}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="text-right">
                          <p className="text-xs font-medium text-foreground">{entry.user.name}</p>
                          <p className="text-[10px] text-muted-foreground">{entry.user.role}</p>
                        </div>
                        {entry.changes && (
                          <button className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(entry.timestamp)}
                      </span>
                      {entry.ipAddress && (
                        <span className="font-mono">{entry.ipAddress}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Changes */}
                {isExpanded && entry.changes && (
                  <div className="border-t border-border bg-muted/20 px-4 py-3 pl-16">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Changes</p>
                    <div className="space-y-2">
                      {entry.changes.map((change, i) => (
                        <div key={i} className="flex items-center gap-4 text-sm">
                          <span className="w-32 shrink-0 text-xs text-muted-foreground">
                            {change.field}
                          </span>
                          <div className="flex items-center gap-2">
                            {change.oldValue !== null ? (
                              <>
                                <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive line-through">
                                  {typeof change.oldValue === "number"
                                    ? formatNumber(change.oldValue)
                                    : change.oldValue}
                                </span>
                                <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                            <span className="rounded bg-[hsl(var(--success))]/10 px-1.5 py-0.5 text-xs font-medium text-[hsl(var(--success))]">
                              {typeof change.newValue === "number"
                                ? formatNumber(change.newValue)
                                : change.newValue}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2">
        <span className="text-xs text-muted-foreground">
          Showing {filteredEntries.length} of {entries.length} entries
        </span>
        <button className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
          <Download className="h-3.5 w-3.5" />
          Export log
        </button>
      </div>
    </div>
  );
}
