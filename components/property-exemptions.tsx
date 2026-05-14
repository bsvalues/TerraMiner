"use client";

import { useState, useMemo } from "react";
import {
  Shield,
  Plus,
  X,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

// Exemption types for property tax
type ExemptionType =
  | "homestead"
  | "senior"
  | "disability"
  | "veteran"
  | "agricultural"
  | "historic"
  | "nonprofit"
  | "other";

type ExemptionStatus = "active" | "pending" | "expired" | "denied";

interface Exemption {
  id: string;
  type: ExemptionType;
  status: ExemptionStatus;
  amount: number; // Dollar amount or percentage
  isPercentage: boolean;
  appliedDate: string;
  expirationDate?: string;
  description?: string;
  documentRef?: string;
}

const EXEMPTION_CONFIG: Record<
  ExemptionType,
  { label: string; description: string; maxAmount: number; icon: typeof Shield }
> = {
  homestead: {
    label: "Homestead",
    description: "Primary residence exemption",
    maxAmount: 50000,
    icon: Shield,
  },
  senior: {
    label: "Senior Citizen",
    description: "Age 65+ exemption",
    maxAmount: 25000,
    icon: Shield,
  },
  disability: {
    label: "Disability",
    description: "Qualified disability exemption",
    maxAmount: 30000,
    icon: Shield,
  },
  veteran: {
    label: "Veteran",
    description: "Military service exemption",
    maxAmount: 40000,
    icon: Shield,
  },
  agricultural: {
    label: "Agricultural",
    description: "Farm/agricultural use",
    maxAmount: 100000,
    icon: Shield,
  },
  historic: {
    label: "Historic",
    description: "Historic preservation",
    maxAmount: 50000,
    icon: Shield,
  },
  nonprofit: {
    label: "Nonprofit",
    description: "501(c)(3) organization",
    maxAmount: 0, // Full exemption
    icon: Shield,
  },
  other: {
    label: "Other",
    description: "Other qualified exemption",
    maxAmount: 25000,
    icon: Shield,
  },
};

const STATUS_CONFIG: Record<
  ExemptionStatus,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  active: { label: "Active", color: "text-[hsl(var(--success))]", icon: CheckCircle2 },
  pending: { label: "Pending", color: "text-[hsl(var(--warning))]", icon: Clock },
  expired: { label: "Expired", color: "text-muted-foreground", icon: AlertCircle },
  denied: { label: "Denied", color: "text-destructive", icon: X },
};

// Generate mock exemptions based on property ID
function generateMockExemptions(propertyId: string): Exemption[] {
  const seed = propertyId.charCodeAt(propertyId.length - 1) % 10;
  
  if (seed < 3) return []; // ~30% have no exemptions
  
  const exemptions: Exemption[] = [];
  
  if (seed >= 3) {
    exemptions.push({
      id: `${propertyId}-ex-1`,
      type: "homestead",
      status: "active",
      amount: 50000,
      isPercentage: false,
      appliedDate: "2022-01-15",
      expirationDate: undefined, // Permanent
      description: "Primary residence homestead exemption",
      documentRef: "HST-2022-4521",
    });
  }
  
  if (seed >= 6) {
    exemptions.push({
      id: `${propertyId}-ex-2`,
      type: "senior",
      status: "active",
      amount: 25000,
      isPercentage: false,
      appliedDate: "2023-03-01",
      expirationDate: "2026-12-31",
      description: "Senior citizen property tax reduction",
      documentRef: "SEN-2023-1287",
    });
  }
  
  if (seed >= 8) {
    exemptions.push({
      id: `${propertyId}-ex-3`,
      type: "veteran",
      status: "pending",
      amount: 30,
      isPercentage: true,
      appliedDate: "2026-04-15",
      description: "Veteran disability exemption application",
    });
  }
  
  return exemptions;
}

interface PropertyExemptionsProps {
  propertyId: string;
  assessedValue?: number;
}

export function PropertyExemptions({ propertyId, assessedValue = 250000 }: PropertyExemptionsProps) {
  const [exemptions, setExemptions] = useState<Exemption[]>(() =>
    generateMockExemptions(propertyId)
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newExemption, setNewExemption] = useState<{
    type: ExemptionType;
    amount: string;
    isPercentage: boolean;
    description: string;
  }>({
    type: "homestead",
    amount: "",
    isPercentage: false,
    description: "",
  });

  // Calculate total exemption value
  const totalExemption = useMemo(() => {
    return exemptions
      .filter((e) => e.status === "active")
      .reduce((sum, e) => {
        if (e.isPercentage) {
          return sum + (assessedValue * e.amount) / 100;
        }
        return sum + e.amount;
      }, 0);
  }, [exemptions, assessedValue]);

  const taxableValue = Math.max(0, assessedValue - totalExemption);

  const handleAddExemption = () => {
    if (!newExemption.amount) return;

    const exemption: Exemption = {
      id: `${propertyId}-ex-${Date.now()}`,
      type: newExemption.type,
      status: "pending",
      amount: parseFloat(newExemption.amount),
      isPercentage: newExemption.isPercentage,
      appliedDate: new Date().toISOString().split("T")[0],
      description: newExemption.description || EXEMPTION_CONFIG[newExemption.type].description,
    };

    setExemptions((prev) => [...prev, exemption]);
    setNewExemption({ type: "homestead", amount: "", isPercentage: false, description: "" });
    setShowAddForm(false);
  };

  const handleRemoveExemption = (id: string) => {
    setExemptions((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--success))]/10">
            <Shield className="h-4 w-4 text-[hsl(var(--success))]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Tax Exemptions</h3>
            <p className="text-[10px] text-muted-foreground">
              {exemptions.filter((e) => e.status === "active").length} active exemptions
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 border-b border-border p-4">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Assessed</p>
          <p className="text-sm font-semibold text-foreground">${formatNumber(assessedValue)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Exemptions</p>
          <p className="text-sm font-semibold text-[hsl(var(--success))]">
            -${formatNumber(totalExemption)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Taxable</p>
          <p className="text-sm font-semibold text-foreground">${formatNumber(taxableValue)}</p>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="border-b border-border bg-muted/30 p-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Type
                </label>
                <select
                  value={newExemption.type}
                  onChange={(e) =>
                    setNewExemption((prev) => ({ ...prev, type: e.target.value as ExemptionType }))
                  }
                  className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                >
                  {Object.entries(EXEMPTION_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Amount
                </label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={newExemption.amount}
                    onChange={(e) =>
                      setNewExemption((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    placeholder={newExemption.isPercentage ? "%" : "$"}
                    className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                  />
                  <button
                    onClick={() =>
                      setNewExemption((prev) => ({ ...prev, isPercentage: !prev.isPercentage }))
                    }
                    className={cn(
                      "h-8 rounded-md border px-2 text-[10px] font-medium",
                      newExemption.isPercentage
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {newExemption.isPercentage ? "%" : "$"}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Description (optional)
              </label>
              <input
                type="text"
                value={newExemption.description}
                onChange={(e) =>
                  setNewExemption((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder={EXEMPTION_CONFIG[newExemption.type].description}
                className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="h-7 rounded-md border border-border px-3 text-[10px] font-medium text-muted-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExemption}
                disabled={!newExemption.amount}
                className="h-7 rounded-md bg-primary px-3 text-[10px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Add Exemption
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exemptions List */}
      <div className="divide-y divide-border">
        {exemptions.length === 0 ? (
          <div className="p-6 text-center">
            <Shield className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-xs text-muted-foreground">No exemptions on file</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-2 text-[10px] font-medium text-primary hover:underline"
            >
              Add an exemption
            </button>
          </div>
        ) : (
          exemptions.map((exemption) => {
            const config = EXEMPTION_CONFIG[exemption.type];
            const statusConfig = STATUS_CONFIG[exemption.status];
            const StatusIcon = statusConfig.icon;
            const isExpanded = expandedId === exemption.id;

            return (
              <div key={exemption.id} className="p-3">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : exemption.id)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      exemption.status === "active"
                        ? "bg-[hsl(var(--success))]/10"
                        : exemption.status === "pending"
                        ? "bg-[hsl(var(--warning))]/10"
                        : "bg-muted"
                    )}
                  >
                    <Shield
                      className={cn(
                        "h-4 w-4",
                        exemption.status === "active"
                          ? "text-[hsl(var(--success))]"
                          : exemption.status === "pending"
                          ? "text-[hsl(var(--warning))]"
                          : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{config.label}</span>
                      <span
                        className={cn(
                          "flex items-center gap-0.5 text-[9px] font-medium",
                          statusConfig.color
                        )}
                      >
                        <StatusIcon className="h-2.5 w-2.5" />
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {exemption.isPercentage
                        ? `${exemption.amount}% reduction`
                        : `$${formatNumber(exemption.amount)} exemption`}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {isExpanded && (
                  <div className="mt-3 ml-11 space-y-2 rounded-lg bg-muted/30 p-3">
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-muted-foreground">Applied:</span>{" "}
                        <span className="font-medium text-foreground">
                          {new Date(exemption.appliedDate).toLocaleDateString()}
                        </span>
                      </div>
                      {exemption.expirationDate && (
                        <div>
                          <span className="text-muted-foreground">Expires:</span>{" "}
                          <span className="font-medium text-foreground">
                            {new Date(exemption.expirationDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {exemption.documentRef && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Reference:</span>{" "}
                          <span className="font-medium text-primary">{exemption.documentRef}</span>
                        </div>
                      )}
                    </div>
                    {exemption.description && (
                      <p className="text-[10px] text-muted-foreground">{exemption.description}</p>
                    )}
                    <div className="flex justify-end gap-1 pt-1">
                      <button className="flex h-6 items-center gap-1 rounded px-2 text-[9px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
                        <Pencil className="h-2.5 w-2.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveExemption(exemption.id)}
                        className="flex h-6 items-center gap-1 rounded px-2 text-[9px] font-medium text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
