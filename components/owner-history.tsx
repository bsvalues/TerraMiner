"use client";

import { useState } from "react";
import {
  Users,
  FileText,
  Calendar,
  DollarSign,
  Building2,
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Home,
  Briefcase,
  Shield,
  Clock,
  MapPin,
} from "lucide-react";

interface Owner {
  id: string;
  name: string;
  type: "individual" | "joint" | "trust" | "corporation" | "llc" | "estate";
  ownershipPercent: number;
  mailingAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  isPrimary: boolean;
}

interface Transfer {
  id: string;
  recordingDate: string;
  documentNumber: string;
  documentType: "warranty_deed" | "quitclaim_deed" | "trust_deed" | "personal_representative" | "contract" | "tax_deed" | "court_order";
  grantors: string[];
  grantees: string[];
  salePrice?: number;
  qualified: boolean;
  exciseTax?: number;
  notes?: string;
}

const MOCK_OWNERS: Owner[] = [
  {
    id: "owner-001",
    name: "John & Mary Smith",
    type: "joint",
    ownershipPercent: 100,
    mailingAddress: {
      street: "1425 Columbia Park Trail",
      city: "Richland",
      state: "WA",
      zip: "99352",
    },
    isPrimary: true,
  },
];

const MOCK_TRANSFERS: Transfer[] = [
  {
    id: "trans-001",
    recordingDate: "2021-06-15",
    documentNumber: "2021-0045678",
    documentType: "warranty_deed",
    grantors: ["Robert & Susan Johnson"],
    grantees: ["John & Mary Smith"],
    salePrice: 385000,
    qualified: true,
    exciseTax: 6160,
    notes: "Arms-length market sale",
  },
  {
    id: "trans-002",
    recordingDate: "2015-03-22",
    documentNumber: "2015-0012345",
    documentType: "warranty_deed",
    grantors: ["First National Bank"],
    grantees: ["Robert & Susan Johnson"],
    salePrice: 245000,
    qualified: true,
    exciseTax: 3920,
    notes: "REO sale - bank owned property",
  },
  {
    id: "trans-003",
    recordingDate: "2012-11-08",
    documentNumber: "2012-0098765",
    documentType: "trust_deed",
    grantors: ["Michael & Patricia Williams"],
    grantees: ["First National Bank"],
    qualified: false,
    notes: "Foreclosure transfer",
  },
  {
    id: "trans-004",
    recordingDate: "2005-08-30",
    documentNumber: "2005-0056789",
    documentType: "warranty_deed",
    grantors: ["ABC Construction LLC"],
    grantees: ["Michael & Patricia Williams"],
    salePrice: 198500,
    qualified: true,
    exciseTax: 3176,
    notes: "New construction sale",
  },
  {
    id: "trans-005",
    recordingDate: "2004-02-14",
    documentNumber: "2004-0011223",
    documentType: "warranty_deed",
    grantors: ["Tri-City Development Corp"],
    grantees: ["ABC Construction LLC"],
    salePrice: 45000,
    qualified: false,
    notes: "Lot sale to builder - land only",
  },
];

const OWNER_TYPE_CONFIG = {
  individual: { label: "Individual", icon: Users },
  joint: { label: "Joint Tenancy", icon: Users },
  trust: { label: "Trust", icon: Shield },
  corporation: { label: "Corporation", icon: Building2 },
  llc: { label: "LLC", icon: Briefcase },
  estate: { label: "Estate", icon: FileText },
};

const DOCUMENT_TYPE_CONFIG = {
  warranty_deed: { label: "Warranty Deed", color: "bg-emerald-500/10 text-emerald-600" },
  quitclaim_deed: { label: "Quitclaim Deed", color: "bg-amber-500/10 text-amber-600" },
  trust_deed: { label: "Trust Deed", color: "bg-purple-500/10 text-purple-600" },
  personal_representative: { label: "Personal Rep. Deed", color: "bg-blue-500/10 text-blue-600" },
  contract: { label: "Contract", color: "bg-cyan-500/10 text-cyan-600" },
  tax_deed: { label: "Tax Deed", color: "bg-red-500/10 text-red-600" },
  court_order: { label: "Court Order", color: "bg-slate-500/10 text-slate-600" },
};

interface OwnerHistoryProps {
  propertyId?: string;
  compact?: boolean;
  className?: string;
}

export function OwnerHistory({
  propertyId,
  compact = false,
  className = "",
}: OwnerHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAllTransfers, setShowAllTransfers] = useState(false);

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

  const displayedTransfers = showAllTransfers
    ? MOCK_TRANSFERS
    : MOCK_TRANSFERS.slice(0, 3);

  const currentOwner = MOCK_OWNERS[0];
  const OwnerTypeIcon = OWNER_TYPE_CONFIG[currentOwner.type].icon;

  if (compact) {
    return (
      <div className={`rounded-xl border border-border bg-card p-5 ${className}`}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
              <Users className="h-4 w-4 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Owner Info</h3>
              <p className="text-xs text-muted-foreground">
                {MOCK_TRANSFERS.length} transfers on record
              </p>
            </div>
          </div>
        </div>

        {/* Current Owner */}
        <div className="mb-3 rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-start gap-2">
            <OwnerTypeIcon className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">{currentOwner.name}</p>
              <p className="text-xs text-muted-foreground">
                {OWNER_TYPE_CONFIG[currentOwner.type].label} - {currentOwner.ownershipPercent}% ownership
              </p>
            </div>
          </div>
        </div>

        {/* Recent Transfers */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Recent Transfers</p>
          {MOCK_TRANSFERS.slice(0, 2).map((transfer) => (
            <div
              key={transfer.id}
              className="flex items-center justify-between rounded-lg bg-muted/20 p-2"
            >
              <div>
                <p className="text-xs font-medium text-foreground">
                  {formatDate(transfer.recordingDate)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {transfer.grantors[0]} → {transfer.grantees[0]}
                </p>
              </div>
              {transfer.salePrice && (
                <span className="text-xs font-medium text-foreground">
                  {formatCurrency(transfer.salePrice)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
            <Users className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Owner History & Transfers
            </h2>
            <p className="text-xs text-muted-foreground">
              {MOCK_TRANSFERS.length} recorded transfers since 2004
            </p>
          </div>
        </div>
        <a
          href="#"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View Deeds
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Current Owner */}
      <div className="border-b border-border p-4">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Home className="h-3.5 w-3.5" />
          Current Owner
        </h3>
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <OwnerTypeIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{currentOwner.name}</p>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  {OWNER_TYPE_CONFIG[currentOwner.type].label}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {currentOwner.ownershipPercent}% Ownership
              </p>
              {currentOwner.mailingAddress && (
                <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>
                    {currentOwner.mailingAddress.street}<br />
                    {currentOwner.mailingAddress.city}, {currentOwner.mailingAddress.state} {currentOwner.mailingAddress.zip}
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Since</p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(MOCK_TRANSFERS[0].recordingDate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer History */}
      <div className="p-4">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Transfer History
        </h3>

        {/* Timeline */}
        <div className="relative">
          {displayedTransfers.map((transfer, index) => {
            const isExpanded = expandedId === transfer.id;
            const isLast = index === displayedTransfers.length - 1;

            return (
              <div key={transfer.id} className="relative pb-4">
                {/* Timeline connector */}
                {!isLast && (
                  <div className="absolute bottom-0 left-4 top-8 w-px bg-border" />
                )}

                <button
                  onClick={() => setExpandedId(isExpanded ? null : transfer.id)}
                  className="flex w-full items-start gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted/50"
                >
                  {/* Timeline dot */}
                  <div
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                      transfer.qualified
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-amber-500 bg-amber-500/10"
                    }`}
                  >
                    <FileText
                      className={`h-3.5 w-3.5 ${
                        transfer.qualified ? "text-emerald-500" : "text-amber-500"
                      }`}
                    />
                  </div>

                  {/* Transfer details */}
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {formatDate(transfer.recordingDate)}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          DOCUMENT_TYPE_CONFIG[transfer.documentType].color
                        }`}
                      >
                        {DOCUMENT_TYPE_CONFIG[transfer.documentType].label}
                      </span>
                      {transfer.qualified ? (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                          Qualified
                        </span>
                      ) : (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                          Non-Qualified
                        </span>
                      )}
                    </div>

                    {/* Parties */}
                    <div className="mt-1.5 flex items-center gap-2 text-sm">
                      <span className="font-medium text-foreground">
                        {transfer.grantors[0]}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {transfer.grantees[0]}
                      </span>
                    </div>

                    {/* Price */}
                    {transfer.salePrice && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        Sale Price: {formatCurrency(transfer.salePrice)}
                      </div>
                    )}
                  </div>

                  {/* Expand indicator */}
                  <ChevronDown
                    className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="ml-11 mt-2 rounded-lg border border-border bg-muted/30 p-3">
                    <div className="grid gap-3 text-xs sm:grid-cols-2">
                      <div>
                        <span className="text-muted-foreground">Document #:</span>{" "}
                        <span className="font-medium text-foreground">
                          {transfer.documentNumber}
                        </span>
                      </div>
                      {transfer.salePrice && (
                        <div>
                          <span className="text-muted-foreground">Sale Price:</span>{" "}
                          <span className="font-medium text-foreground">
                            {formatCurrency(transfer.salePrice)}
                          </span>
                        </div>
                      )}
                      {transfer.exciseTax && (
                        <div>
                          <span className="text-muted-foreground">Excise Tax:</span>{" "}
                          <span className="font-medium text-foreground">
                            {formatCurrency(transfer.exciseTax)}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Grantor(s):</span>{" "}
                        <span className="font-medium text-foreground">
                          {transfer.grantors.join(", ")}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Grantee(s):</span>{" "}
                        <span className="font-medium text-foreground">
                          {transfer.grantees.join(", ")}
                        </span>
                      </div>
                    </div>
                    {transfer.notes && (
                      <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Notes:</span>{" "}
                        {transfer.notes}
                      </p>
                    )}
                    <button className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      View Document
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Show more */}
        {MOCK_TRANSFERS.length > 3 && (
          <button
            onClick={() => setShowAllTransfers(!showAllTransfers)}
            className="mt-2 w-full rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {showAllTransfers
              ? "Show Less"
              : `Show ${MOCK_TRANSFERS.length - 3} More Transfers`}
          </button>
        )}
      </div>
    </div>
  );
}
