"use client";

import { useState } from "react";
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Hammer,
  Home,
  Building2,
  Zap,
  Droplets,
  Flame,
  Trees,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  DollarSign,
  Calendar,
  User,
  Search,
  Filter,
} from "lucide-react";

interface Permit {
  id: string;
  permitNumber: string;
  type: "building" | "electrical" | "plumbing" | "mechanical" | "demolition" | "grading" | "fence" | "roof";
  description: string;
  status: "applied" | "in_review" | "approved" | "issued" | "inspection" | "final" | "expired" | "denied";
  applicationDate: string;
  issueDate?: string;
  expirationDate?: string;
  estimatedValue: number;
  contractor?: string;
  inspections: {
    type: string;
    status: "pending" | "scheduled" | "passed" | "failed";
    date?: string;
  }[];
  fees: {
    type: string;
    amount: number;
    paid: boolean;
  }[];
  notes?: string;
}

const MOCK_PERMITS: Permit[] = [
  {
    id: "perm-001",
    permitNumber: "BP-2026-0234",
    type: "building",
    description: "Kitchen remodel and addition (450 SF)",
    status: "inspection",
    applicationDate: "2026-02-15",
    issueDate: "2026-03-01",
    expirationDate: "2027-03-01",
    estimatedValue: 85000,
    contractor: "ABC Construction LLC",
    inspections: [
      { type: "Foundation", status: "passed", date: "2026-03-15" },
      { type: "Framing", status: "passed", date: "2026-04-10" },
      { type: "Rough Electrical", status: "passed", date: "2026-04-20" },
      { type: "Rough Plumbing", status: "scheduled", date: "2026-05-15" },
      { type: "Insulation", status: "pending" },
      { type: "Final", status: "pending" },
    ],
    fees: [
      { type: "Building Permit", amount: 1250, paid: true },
      { type: "Plan Review", amount: 450, paid: true },
      { type: "Impact Fee", amount: 2500, paid: true },
    ],
    notes: "Addition requires structural engineer approval",
  },
  {
    id: "perm-002",
    permitNumber: "EP-2026-0456",
    type: "electrical",
    description: "200A service upgrade and panel replacement",
    status: "issued",
    applicationDate: "2026-04-01",
    issueDate: "2026-04-08",
    expirationDate: "2026-10-08",
    estimatedValue: 4500,
    contractor: "Tri-City Electric",
    inspections: [
      { type: "Rough Electrical", status: "pending" },
      { type: "Final Electrical", status: "pending" },
    ],
    fees: [
      { type: "Electrical Permit", amount: 175, paid: true },
    ],
  },
  {
    id: "perm-003",
    permitNumber: "BP-2025-1892",
    type: "roof",
    description: "Complete roof replacement - asphalt shingles",
    status: "final",
    applicationDate: "2025-09-10",
    issueDate: "2025-09-15",
    expirationDate: "2026-03-15",
    estimatedValue: 12500,
    contractor: "Summit Roofing Inc",
    inspections: [
      { type: "Final Roof", status: "passed", date: "2025-10-20" },
    ],
    fees: [
      { type: "Roofing Permit", amount: 225, paid: true },
    ],
  },
  {
    id: "perm-004",
    permitNumber: "PP-2026-0089",
    type: "plumbing",
    description: "Water heater replacement - tankless",
    status: "approved",
    applicationDate: "2026-05-01",
    estimatedValue: 3200,
    contractor: "ProFlow Plumbing",
    inspections: [
      { type: "Final Plumbing", status: "pending" },
    ],
    fees: [
      { type: "Plumbing Permit", amount: 125, paid: false },
    ],
  },
  {
    id: "perm-005",
    permitNumber: "BP-2024-3456",
    type: "fence",
    description: "6ft privacy fence - rear yard",
    status: "expired",
    applicationDate: "2024-06-15",
    issueDate: "2024-06-20",
    expirationDate: "2024-12-20",
    estimatedValue: 8500,
    inspections: [
      { type: "Final Fence", status: "failed", date: "2024-11-15" },
    ],
    fees: [
      { type: "Fence Permit", amount: 150, paid: true },
    ],
    notes: "Fence height exceeds setback requirements - correction needed",
  },
];

const TYPE_CONFIG = {
  building: { label: "Building", icon: Building2, color: "bg-blue-500/10 text-blue-600" },
  electrical: { label: "Electrical", icon: Zap, color: "bg-amber-500/10 text-amber-600" },
  plumbing: { label: "Plumbing", icon: Droplets, color: "bg-cyan-500/10 text-cyan-600" },
  mechanical: { label: "Mechanical", icon: Flame, color: "bg-orange-500/10 text-orange-600" },
  demolition: { label: "Demolition", icon: Hammer, color: "bg-red-500/10 text-red-600" },
  grading: { label: "Grading", icon: Trees, color: "bg-emerald-500/10 text-emerald-600" },
  fence: { label: "Fence", icon: Home, color: "bg-purple-500/10 text-purple-600" },
  roof: { label: "Roof", icon: Home, color: "bg-slate-500/10 text-slate-600" },
};

const STATUS_CONFIG = {
  applied: { label: "Applied", color: "bg-slate-100 text-slate-600 border-slate-200" },
  in_review: { label: "In Review", color: "bg-amber-100 text-amber-700 border-amber-200" },
  approved: { label: "Approved", color: "bg-blue-100 text-blue-700 border-blue-200" },
  issued: { label: "Issued", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  inspection: { label: "Inspection", color: "bg-purple-100 text-purple-700 border-purple-200" },
  final: { label: "Finaled", color: "bg-green-100 text-green-700 border-green-200" },
  expired: { label: "Expired", color: "bg-red-100 text-red-700 border-red-200" },
  denied: { label: "Denied", color: "bg-red-100 text-red-700 border-red-200" },
};

const INSPECTION_STATUS_CONFIG = {
  pending: { label: "Pending", icon: Clock, color: "text-slate-400" },
  scheduled: { label: "Scheduled", icon: Calendar, color: "text-blue-500" },
  passed: { label: "Passed", icon: CheckCircle2, color: "text-emerald-500" },
  failed: { label: "Failed", icon: XCircle, color: "text-red-500" },
};

interface BuildingPermitsTrackerProps {
  propertyId?: string;
  compact?: boolean;
  className?: string;
}

export function BuildingPermitsTracker({
  propertyId,
  compact = false,
  className = "",
}: BuildingPermitsTrackerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filteredPermits = MOCK_PERMITS.filter((permit) => {
    if (statusFilter !== "all" && permit.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        permit.permitNumber.toLowerCase().includes(query) ||
        permit.description.toLowerCase().includes(query) ||
        permit.contractor?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const activePermits = MOCK_PERMITS.filter(
    (p) => !["final", "expired", "denied"].includes(p.status)
  );

  const totalValue = MOCK_PERMITS.reduce((sum, p) => sum + p.estimatedValue, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (compact) {
    return (
      <div className={`rounded-xl border border-border bg-card p-5 ${className}`}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <FileText className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Building Permits</h3>
              <p className="text-xs text-muted-foreground">
                {activePermits.length} active permits
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {formatCurrency(totalValue)} total
          </span>
        </div>

        {activePermits.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No active permits on file
          </p>
        ) : (
          <div className="space-y-2">
            {activePermits.slice(0, 3).map((permit) => {
              const TypeIcon = TYPE_CONFIG[permit.type].icon;
              return (
                <div
                  key={permit.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-2.5"
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-md ${TYPE_CONFIG[permit.type].color}`}>
                    <TypeIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {permit.permitNumber}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {permit.description}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_CONFIG[permit.status].color}`}>
                    {STATUS_CONFIG[permit.status].label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
            <FileText className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Building Permits</h2>
            <p className="text-xs text-muted-foreground">
              {MOCK_PERMITS.length} total permits - {formatCurrency(totalValue)} estimated value
            </p>
          </div>
        </div>
        <a
          href="#"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View in Portal
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-px border-b border-border bg-border">
        {[
          { label: "Active", value: activePermits.length, color: "text-blue-600" },
          { label: "Pending Inspection", value: MOCK_PERMITS.filter((p) => p.status === "inspection").length, color: "text-purple-600" },
          { label: "Finaled", value: MOCK_PERMITS.filter((p) => p.status === "final").length, color: "text-emerald-600" },
          { label: "Expired", value: MOCK_PERMITS.filter((p) => p.status === "expired").length, color: "text-red-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card p-3 text-center">
            <p className={`text-lg font-semibold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search permits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted/50 py-1.5 pl-8 pr-3 text-xs placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            showFilters
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
        </button>
      </div>

      {/* Filter Row */}
      {showFilters && (
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          {["all", "issued", "inspection", "final", "expired"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                statusFilter === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {status === "all" ? "All" : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}
            </button>
          ))}
        </div>
      )}

      {/* Permits List */}
      <div className="max-h-[500px] overflow-y-auto">
        {filteredPermits.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No permits found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredPermits.map((permit) => {
              const TypeIcon = TYPE_CONFIG[permit.type].icon;
              const isExpanded = expandedId === permit.id;
              const passedInspections = permit.inspections.filter((i) => i.status === "passed").length;
              const totalInspections = permit.inspections.length;

              return (
                <div key={permit.id} className="bg-card">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : permit.id)}
                    className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/50"
                  >
                    {/* Type Icon */}
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TYPE_CONFIG[permit.type].color}`}>
                      <TypeIcon className="h-5 w-5" />
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-primary">
                          {permit.permitNumber}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_CONFIG[permit.status].color}`}>
                          {STATUS_CONFIG[permit.status].label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                        {permit.description}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(permit.estimatedValue)}
                        </span>
                        {permit.contractor && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {permit.contractor}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {passedInspections}/{totalInspections} inspections
                        </span>
                      </div>
                    </div>

                    {/* Expand */}
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/20 px-4 pb-4">
                      {/* Dates */}
                      <div className="mt-3 flex flex-wrap gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">Applied:</span>{" "}
                          <span className="font-medium text-foreground">
                            {formatDate(permit.applicationDate)}
                          </span>
                        </div>
                        {permit.issueDate && (
                          <div>
                            <span className="text-muted-foreground">Issued:</span>{" "}
                            <span className="font-medium text-foreground">
                              {formatDate(permit.issueDate)}
                            </span>
                          </div>
                        )}
                        {permit.expirationDate && (
                          <div>
                            <span className="text-muted-foreground">Expires:</span>{" "}
                            <span className={`font-medium ${
                              new Date(permit.expirationDate) < new Date()
                                ? "text-red-600"
                                : "text-foreground"
                            }`}>
                              {formatDate(permit.expirationDate)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {permit.notes && (
                        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-xs dark:bg-amber-500/10">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                          <p className="text-amber-800 dark:text-amber-200">{permit.notes}</p>
                        </div>
                      )}

                      {/* Inspections */}
                      <div className="mt-4">
                        <h4 className="mb-2 text-xs font-semibold text-foreground">
                          Inspections
                        </h4>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {permit.inspections.map((inspection, idx) => {
                            const StatusIcon = INSPECTION_STATUS_CONFIG[inspection.status].icon;
                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-2 rounded-lg border border-border bg-background p-2"
                              >
                                <StatusIcon
                                  className={`h-4 w-4 ${INSPECTION_STATUS_CONFIG[inspection.status].color}`}
                                />
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-foreground">
                                    {inspection.type}
                                  </p>
                                  {inspection.date && (
                                    <p className="text-[10px] text-muted-foreground">
                                      {formatDate(inspection.date)}
                                    </p>
                                  )}
                                </div>
                                <span
                                  className={`text-[10px] font-medium ${INSPECTION_STATUS_CONFIG[inspection.status].color}`}
                                >
                                  {INSPECTION_STATUS_CONFIG[inspection.status].label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Fees */}
                      <div className="mt-4">
                        <h4 className="mb-2 text-xs font-semibold text-foreground">Fees</h4>
                        <div className="space-y-1">
                          {permit.fees.map((fee, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between rounded-lg bg-background px-3 py-2"
                            >
                              <span className="text-xs text-foreground">{fee.type}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-foreground">
                                  {formatCurrency(fee.amount)}
                                </span>
                                {fee.paid ? (
                                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                    Paid
                                  </span>
                                ) : (
                                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                    Due
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
