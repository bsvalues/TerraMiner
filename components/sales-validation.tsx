"use client";

import { useState, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Home,
  Users,
  Building2,
  FileCheck,
  Clock,
  Info,
} from "lucide-react";
import { formatNumber, cn } from "@/lib/utils";

type ValidationStatus = "qualified" | "disqualified" | "pending";
type RejectionReason =
  | "family-sale"
  | "foreclosure"
  | "bank-sale"
  | "corporate-transfer"
  | "partial-interest"
  | "estate-sale"
  | "auction"
  | "gov-transfer"
  | "other";

interface Sale {
  id: string;
  propertyId: string;
  address: string;
  saleDate: string;
  salePrice: number;
  assessedValue: number;
  ratio: number;
  status: ValidationStatus;
  rejectionReason?: RejectionReason;
  rejectionNotes?: string;
  grantor: string;
  grantee: string;
  documentNumber: string;
  propertyType: "residential" | "commercial" | "agricultural" | "industrial";
  validatedBy?: string;
  validatedAt?: string;
}

const rejectionReasonLabels: Record<RejectionReason, string> = {
  "family-sale": "Family/Related Party Sale",
  foreclosure: "Foreclosure/Bank Sale",
  "bank-sale": "Bank/REO Sale",
  "corporate-transfer": "Corporate Transfer",
  "partial-interest": "Partial Interest Transfer",
  "estate-sale": "Estate/Probate Sale",
  auction: "Auction Sale",
  "gov-transfer": "Government Transfer",
  other: "Other Non-Arm's Length",
};

// Mock sales data
const mockSales: Sale[] = [
  {
    id: "sale-001",
    propertyId: "prop-001",
    address: "1425 Columbia Park Trail, Richland",
    saleDate: "2026-04-15",
    salePrice: 385000,
    assessedValue: 365000,
    ratio: 0.948,
    status: "qualified",
    grantor: "Johnson Family Trust",
    grantee: "Michael & Sarah Chen",
    documentNumber: "2026-0041523",
    propertyType: "residential",
    validatedBy: "Sarah Chen",
    validatedAt: "2026-04-20T14:30:00Z",
  },
  {
    id: "sale-002",
    propertyId: "prop-002",
    address: "2890 Bombing Range Rd, West Richland",
    saleDate: "2026-04-12",
    salePrice: 425000,
    assessedValue: 410000,
    ratio: 0.965,
    status: "qualified",
    grantor: "Pacific Northwest Homes LLC",
    grantee: "David Martinez",
    documentNumber: "2026-0041098",
    propertyType: "residential",
    validatedBy: "Mike Rodriguez",
    validatedAt: "2026-04-18T09:15:00Z",
  },
  {
    id: "sale-003",
    propertyId: "prop-003",
    address: "456 Keene Rd, Richland",
    saleDate: "2026-04-10",
    salePrice: 175000,
    assessedValue: 285000,
    ratio: 0.614,
    status: "disqualified",
    rejectionReason: "foreclosure",
    rejectionNotes: "Bank REO sale - below market value",
    grantor: "US Bank NA",
    grantee: "Investment Properties LLC",
    documentNumber: "2026-0040876",
    propertyType: "residential",
    validatedBy: "Sarah Chen",
    validatedAt: "2026-04-15T11:00:00Z",
  },
  {
    id: "sale-004",
    propertyId: "prop-004",
    address: "789 George Washington Way, Richland",
    saleDate: "2026-04-08",
    salePrice: 295000,
    assessedValue: 280000,
    ratio: 0.949,
    status: "pending",
    grantor: "Smith, Robert J",
    grantee: "Smith, Jennifer A",
    documentNumber: "2026-0040654",
    propertyType: "residential",
  },
  {
    id: "sale-005",
    propertyId: "prop-005",
    address: "1200 Stevens Dr, Richland",
    saleDate: "2026-04-05",
    salePrice: 1250000,
    assessedValue: 1180000,
    ratio: 0.944,
    status: "qualified",
    grantor: "Tri-Cities Commercial Holdings",
    grantee: "Northwest Medical Group",
    documentNumber: "2026-0040321",
    propertyType: "commercial",
    validatedBy: "Mike Rodriguez",
    validatedAt: "2026-04-12T16:45:00Z",
  },
  {
    id: "sale-006",
    propertyId: "prop-006",
    address: "3400 W Canal Dr, Kennewick",
    saleDate: "2026-04-02",
    salePrice: 50000,
    assessedValue: 320000,
    ratio: 0.156,
    status: "disqualified",
    rejectionReason: "family-sale",
    rejectionNotes: "Transfer between family members at nominal consideration",
    grantor: "Williams, Thomas Sr",
    grantee: "Williams, Thomas Jr",
    documentNumber: "2026-0039987",
    propertyType: "residential",
    validatedBy: "Sarah Chen",
    validatedAt: "2026-04-08T10:30:00Z",
  },
  {
    id: "sale-007",
    propertyId: "prop-007",
    address: "567 Columbia Center Blvd, Kennewick",
    saleDate: "2026-03-28",
    salePrice: 875000,
    assessedValue: 850000,
    ratio: 0.971,
    status: "pending",
    grantor: "Estate of Margaret Thompson",
    grantee: "Columbia Basin Enterprises",
    documentNumber: "2026-0039654",
    propertyType: "commercial",
  },
];

interface SalesValidationProps {
  className?: string;
  compact?: boolean;
}

export function SalesValidation({ className, compact = false }: SalesValidationProps) {
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const [filter, setFilter] = useState<ValidationStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSale, setExpandedSale] = useState<string | null>(null);
  const [showValidationModal, setShowValidationModal] = useState<Sale | null>(null);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchesFilter = filter === "all" || sale.status === filter;
      const matchesSearch =
        searchQuery === "" ||
        sale.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.grantor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.grantee.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [sales, filter, searchQuery]);

  const stats = useMemo(() => ({
    total: sales.length,
    qualified: sales.filter((s) => s.status === "qualified").length,
    disqualified: sales.filter((s) => s.status === "disqualified").length,
    pending: sales.filter((s) => s.status === "pending").length,
    qualificationRate: Math.round(
      (sales.filter((s) => s.status === "qualified").length /
        sales.filter((s) => s.status !== "pending").length) *
        100
    ),
  }), [sales]);

  const handleValidate = (saleId: string, status: "qualified" | "disqualified", reason?: RejectionReason, notes?: string) => {
    setSales((prev) =>
      prev.map((sale) =>
        sale.id === saleId
          ? {
              ...sale,
              status,
              rejectionReason: status === "disqualified" ? reason : undefined,
              rejectionNotes: status === "disqualified" ? notes : undefined,
              validatedBy: "Current User",
              validatedAt: new Date().toISOString(),
            }
          : sale
      )
    );
    setShowValidationModal(null);
  };

  const getStatusIcon = (status: ValidationStatus) => {
    switch (status) {
      case "qualified":
        return <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />;
      case "disqualified":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "pending":
        return <Clock className="h-4 w-4 text-[hsl(var(--warning))]" />;
    }
  };

  const getStatusBadge = (status: ValidationStatus) => {
    const baseClasses = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium";
    switch (status) {
      case "qualified":
        return <span className={cn(baseClasses, "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]")}>Qualified</span>;
      case "disqualified":
        return <span className={cn(baseClasses, "bg-destructive/10 text-destructive")}>Disqualified</span>;
      case "pending":
        return <span className={cn(baseClasses, "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]")}>Pending Review</span>;
    }
  };

  const getRatioStatus = (ratio: number) => {
    if (ratio >= 0.9 && ratio <= 1.1) return "good";
    if (ratio >= 0.8 && ratio <= 1.2) return "warning";
    return "critical";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Sales Validation</h3>
            <p className="text-[10px] text-muted-foreground">
              {stats.qualified} qualified • {stats.pending} pending review
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        {!compact && (
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-[hsl(var(--success))]">{stats.qualificationRate}%</p>
              <p className="text-[9px] text-muted-foreground">Qual. Rate</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{stats.total}</p>
              <p className="text-[9px] text-muted-foreground">Total Sales</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5">
          {(["all", "pending", "qualified", "disqualified"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                "flex h-7 items-center gap-1 rounded-md px-2.5 text-[10px] font-medium transition-colors",
                filter === status
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {status === "all" && "All"}
              {status === "pending" && (
                <>
                  <Clock className="h-3 w-3" />
                  Pending ({stats.pending})
                </>
              )}
              {status === "qualified" && (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Qualified
                </>
              )}
              {status === "disqualified" && (
                <>
                  <XCircle className="h-3 w-3" />
                  Disqualified
                </>
              )}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search sales..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 w-full rounded-md border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none sm:w-48"
          />
        </div>
      </div>

      {/* Sales List */}
      <div className="max-h-[500px] overflow-y-auto">
        {filteredSales.map((sale) => (
          <div
            key={sale.id}
            className="border-b border-border last:border-b-0"
          >
            {/* Sale Row */}
            <div
              className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-accent/50"
              onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
            >
              {getStatusIcon(sale.status)}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs font-medium text-foreground">{sale.address}</p>
                  {getStatusBadge(sale.status)}
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>{formatDate(sale.saleDate)}</span>
                  <span>•</span>
                  <span>${formatNumber(sale.salePrice)}</span>
                  <span>•</span>
                  <span className={cn(
                    "font-medium",
                    getRatioStatus(sale.ratio) === "good" && "text-[hsl(var(--success))]",
                    getRatioStatus(sale.ratio) === "warning" && "text-[hsl(var(--warning))]",
                    getRatioStatus(sale.ratio) === "critical" && "text-destructive"
                  )}>
                    {(sale.ratio * 100).toFixed(1)}% ratio
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {sale.status === "pending" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowValidationModal(sale);
                    }}
                    className="flex h-6 items-center gap-1 rounded bg-primary px-2 text-[10px] font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Review
                  </button>
                )}
                {expandedSale === sale.id ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {expandedSale === sale.id && (
              <div className="border-t border-border bg-muted/30 p-3">
                <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                  <div>
                    <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Grantor</p>
                    <p className="mt-0.5 text-foreground">{sale.grantor}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Grantee</p>
                    <p className="mt-0.5 text-foreground">{sale.grantee}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Document #</p>
                    <p className="mt-0.5 font-mono text-foreground">{sale.documentNumber}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Assessed Value</p>
                    <p className="mt-0.5 text-foreground">${formatNumber(sale.assessedValue)}</p>
                  </div>
                </div>

                {sale.status === "disqualified" && sale.rejectionReason && (
                  <div className="mt-3 rounded-md border border-destructive/20 bg-destructive/5 p-2">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-[10px] font-medium text-destructive">
                        {rejectionReasonLabels[sale.rejectionReason]}
                      </span>
                    </div>
                    {sale.rejectionNotes && (
                      <p className="mt-1 text-[10px] text-muted-foreground">{sale.rejectionNotes}</p>
                    )}
                  </div>
                )}

                {sale.validatedBy && (
                  <p className="mt-2 text-[9px] text-muted-foreground">
                    Validated by {sale.validatedBy} on {formatDate(sale.validatedAt!)}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}

        {filteredSales.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <FileCheck className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">No sales found</p>
          </div>
        )}
      </div>

      {/* Validation Modal */}
      {showValidationModal && (
        <ValidationModal
          sale={showValidationModal}
          onValidate={handleValidate}
          onClose={() => setShowValidationModal(null)}
        />
      )}
    </div>
  );
}

// Validation Modal Component
function ValidationModal({
  sale,
  onValidate,
  onClose,
}: {
  sale: Sale;
  onValidate: (id: string, status: "qualified" | "disqualified", reason?: RejectionReason, notes?: string) => void;
  onClose: () => void;
}) {
  const [rejectionReason, setRejectionReason] = useState<RejectionReason>("family-sale");
  const [rejectionNotes, setRejectionNotes] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Validate Sale</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{sale.address}</p>
        </div>

        <div className="p-4">
          {/* Sale Summary */}
          <div className="mb-4 grid grid-cols-3 gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <div className="text-center">
              <p className="text-xs font-semibold text-foreground">${formatNumber(sale.salePrice)}</p>
              <p className="text-[9px] text-muted-foreground">Sale Price</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-foreground">${formatNumber(sale.assessedValue)}</p>
              <p className="text-[9px] text-muted-foreground">Assessed</p>
            </div>
            <div className="text-center">
              <p className={cn(
                "text-xs font-semibold",
                sale.ratio >= 0.9 && sale.ratio <= 1.1 ? "text-[hsl(var(--success))]" : "text-[hsl(var(--warning))]"
              )}>
                {(sale.ratio * 100).toFixed(1)}%
              </p>
              <p className="text-[9px] text-muted-foreground">Ratio</p>
            </div>
          </div>

          {/* Parties */}
          <div className="mb-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Grantor:</span>
              <span className="font-medium text-foreground">{sale.grantor}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Grantee:</span>
              <span className="font-medium text-foreground">{sale.grantee}</span>
            </div>
          </div>

          {/* Rejection Reason */}
          <div className="mb-3">
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              If Disqualifying, Select Reason
            </label>
            <select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value as RejectionReason)}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {Object.entries(rejectionReasonLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Notes (Optional)
            </label>
            <textarea
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="Add validation notes..."
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-border p-3">
          <button
            onClick={onClose}
            className="h-8 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={() => onValidate(sale.id, "disqualified", rejectionReason, rejectionNotes)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-destructive px-3 text-xs font-medium text-destructive-foreground hover:bg-destructive/90"
          >
            <XCircle className="h-3.5 w-3.5" />
            Disqualify
          </button>
          <button
            onClick={() => onValidate(sale.id, "qualified")}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-[hsl(var(--success))] px-3 text-xs font-medium text-white hover:bg-[hsl(var(--success))]/90"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Qualify
          </button>
        </div>
      </div>
    </div>
  );
}
