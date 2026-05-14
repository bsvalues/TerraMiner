"use client";

import { useState, useMemo } from "react";
import {
  Grid3X3,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MapPin,
  Calendar,
  Home,
  DollarSign,
  Ruler,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  X,
  ChevronDown,
  Filter,
  Download,
  Printer,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

interface ComparableSale {
  id: string;
  address: string;
  city: string;
  saleDate: string;
  salePrice: number;
  sqft: number;
  lotSize: number;
  yearBuilt: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  style: string;
  condition: string;
  quality: string;
  distance: number;
  pricePerSqft: number;
  adjustedPrice?: number;
  qualified: boolean;
  similarity: number;
  selected?: boolean;
}

interface Adjustment {
  field: string;
  label: string;
  subjectValue: string | number;
  compValue: string | number;
  adjustmentPercent: number;
  adjustmentAmount: number;
}

interface ComparableSalesGridProps {
  propertyId: string;
  subjectProperty?: {
    address: string;
    sqft: number;
    lotSize: number;
    yearBuilt: number;
    bedrooms: number;
    bathrooms: number;
    propertyType: string;
    style: string;
    condition: string;
    quality: string;
  };
  className?: string;
}

const MOCK_COMPS: ComparableSale[] = [
  {
    id: "comp-001",
    address: "1523 Columbia Park Trail",
    city: "Richland",
    saleDate: "2026-04-15",
    salePrice: 392500,
    sqft: 2180,
    lotSize: 8500,
    yearBuilt: 2004,
    bedrooms: 4,
    bathrooms: 2.5,
    propertyType: "Single Family",
    style: "2-Story",
    condition: "Good",
    quality: "Average",
    distance: 0.3,
    pricePerSqft: 180.05,
    qualified: true,
    similarity: 94,
  },
  {
    id: "comp-002",
    address: "2891 Bombing Range Rd",
    city: "West Richland",
    saleDate: "2026-03-28",
    salePrice: 415000,
    sqft: 2350,
    lotSize: 10890,
    yearBuilt: 2006,
    bedrooms: 4,
    bathrooms: 3,
    propertyType: "Single Family",
    style: "2-Story",
    condition: "Good",
    quality: "Good",
    distance: 1.2,
    pricePerSqft: 176.60,
    qualified: true,
    similarity: 89,
  },
  {
    id: "comp-003",
    address: "789 Keene Rd",
    city: "Richland",
    saleDate: "2026-03-15",
    salePrice: 358000,
    sqft: 1950,
    lotSize: 7200,
    yearBuilt: 2001,
    bedrooms: 3,
    bathrooms: 2,
    propertyType: "Single Family",
    style: "Ranch",
    condition: "Average",
    quality: "Average",
    distance: 0.8,
    pricePerSqft: 183.59,
    qualified: true,
    similarity: 82,
  },
  {
    id: "comp-004",
    address: "456 George Washington Way",
    city: "Richland",
    saleDate: "2026-02-20",
    salePrice: 425000,
    sqft: 2420,
    lotSize: 9000,
    yearBuilt: 2008,
    bedrooms: 4,
    bathrooms: 3,
    propertyType: "Single Family",
    style: "2-Story",
    condition: "Excellent",
    quality: "Good",
    distance: 1.5,
    pricePerSqft: 175.62,
    qualified: true,
    similarity: 86,
  },
  {
    id: "comp-005",
    address: "321 Van Giesen St",
    city: "Richland",
    saleDate: "2026-01-10",
    salePrice: 295000,
    sqft: 1680,
    lotSize: 6500,
    yearBuilt: 1998,
    bedrooms: 3,
    bathrooms: 2,
    propertyType: "Single Family",
    style: "Ranch",
    condition: "Average",
    quality: "Average",
    distance: 2.1,
    pricePerSqft: 175.60,
    qualified: false,
    similarity: 71,
  },
  {
    id: "comp-006",
    address: "555 Jadwin Ave",
    city: "Richland",
    saleDate: "2026-04-02",
    salePrice: 378500,
    sqft: 2100,
    lotSize: 8000,
    yearBuilt: 2003,
    bedrooms: 4,
    bathrooms: 2.5,
    propertyType: "Single Family",
    style: "2-Story",
    condition: "Good",
    quality: "Average",
    distance: 0.6,
    pricePerSqft: 180.24,
    qualified: true,
    similarity: 91,
  },
];

const SUBJECT_PROPERTY = {
  address: "1425 Columbia Park Trail",
  sqft: 2200,
  lotSize: 8712,
  yearBuilt: 2005,
  bedrooms: 4,
  bathrooms: 2.5,
  propertyType: "Single Family",
  style: "2-Story",
  condition: "Good",
  quality: "Average",
};

export function ComparableSalesGrid({ propertyId, subjectProperty = SUBJECT_PROPERTY, className }: ComparableSalesGridProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedComps, setSelectedComps] = useState<Set<string>>(new Set(["comp-001", "comp-002", "comp-006"]));
  const [sortField, setSortField] = useState<keyof ComparableSale>("similarity");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [qualifiedOnly, setQualifiedOnly] = useState(true);

  const filteredComps = useMemo(() => {
    let comps = [...MOCK_COMPS];
    if (qualifiedOnly) {
      comps = comps.filter((c) => c.qualified);
    }
    comps.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
    return comps;
  }, [sortField, sortDirection, qualifiedOnly]);

  const selectedCompsList = useMemo(() => {
    return MOCK_COMPS.filter((c) => selectedComps.has(c.id));
  }, [selectedComps]);

  const calculateAdjustments = (comp: ComparableSale): Adjustment[] => {
    const adjustments: Adjustment[] = [];
    
    // Size adjustment ($100/sqft)
    const sqftDiff = subjectProperty.sqft - comp.sqft;
    if (sqftDiff !== 0) {
      adjustments.push({
        field: "sqft",
        label: "Size (SF)",
        subjectValue: subjectProperty.sqft.toLocaleString(),
        compValue: comp.sqft.toLocaleString(),
        adjustmentPercent: (sqftDiff / comp.sqft) * 100,
        adjustmentAmount: sqftDiff * 100,
      });
    }

    // Age adjustment ($1,000/year)
    const ageDiff = comp.yearBuilt - subjectProperty.yearBuilt;
    if (ageDiff !== 0) {
      adjustments.push({
        field: "yearBuilt",
        label: "Age (Year)",
        subjectValue: subjectProperty.yearBuilt,
        compValue: comp.yearBuilt,
        adjustmentPercent: (ageDiff / subjectProperty.yearBuilt) * 100,
        adjustmentAmount: ageDiff * 1000,
      });
    }

    // Lot size adjustment ($2/sqft)
    const lotDiff = subjectProperty.lotSize - comp.lotSize;
    if (Math.abs(lotDiff) > 500) {
      adjustments.push({
        field: "lotSize",
        label: "Lot Size",
        subjectValue: subjectProperty.lotSize.toLocaleString() + " SF",
        compValue: comp.lotSize.toLocaleString() + " SF",
        adjustmentPercent: (lotDiff / comp.lotSize) * 100,
        adjustmentAmount: lotDiff * 2,
      });
    }

    // Bathroom adjustment ($5,000/bath)
    const bathDiff = subjectProperty.bathrooms - comp.bathrooms;
    if (bathDiff !== 0) {
      adjustments.push({
        field: "bathrooms",
        label: "Bathrooms",
        subjectValue: subjectProperty.bathrooms,
        compValue: comp.bathrooms,
        adjustmentPercent: (bathDiff / comp.bathrooms) * 100,
        adjustmentAmount: bathDiff * 5000,
      });
    }

    return adjustments;
  };

  const getAdjustedPrice = (comp: ComparableSale): number => {
    const adjustments = calculateAdjustments(comp);
    const totalAdj = adjustments.reduce((sum, adj) => sum + adj.adjustmentAmount, 0);
    return comp.salePrice + totalAdj;
  };

  const toggleCompSelection = (compId: string) => {
    const newSelected = new Set(selectedComps);
    if (newSelected.has(compId)) {
      newSelected.delete(compId);
    } else if (newSelected.size < 5) {
      newSelected.add(compId);
    }
    setSelectedComps(newSelected);
  };

  const handleSort = (field: keyof ComparableSale) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const averageAdjustedPrice = selectedCompsList.length > 0
    ? selectedCompsList.reduce((sum, c) => sum + getAdjustedPrice(c), 0) / selectedCompsList.length
    : 0;

  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <Grid3X3 className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Comparable Sales Analysis</h3>
            <p className="text-sm text-muted-foreground">
              {selectedComps.size} of {filteredComps.length} comparables selected
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQualifiedOnly(!qualifiedOnly)}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium",
              qualifiedOnly
                ? "border-green-500/50 bg-green-500/10 text-green-500"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Qualified Only
          </button>
          <div className="flex rounded-md border border-border">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-l-md p-1.5",
                viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-r-md p-1.5",
                viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Subject Property Summary */}
      <div className="border-b border-border bg-primary/5 p-4">
        <div className="flex items-center gap-2 text-sm">
          <Home className="h-4 w-4 text-primary" />
          <span className="font-medium text-primary">Subject:</span>
          <span>{subjectProperty.address}</span>
          <span className="text-muted-foreground">|</span>
          <span>{subjectProperty.sqft.toLocaleString()} SF</span>
          <span className="text-muted-foreground">|</span>
          <span>{subjectProperty.bedrooms}BR/{subjectProperty.bathrooms}BA</span>
          <span className="text-muted-foreground">|</span>
          <span>Built {subjectProperty.yearBuilt}</span>
        </div>
      </div>

      {/* Comparables Grid/List */}
      <div className="p-4">
        {viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredComps.map((comp) => {
              const isSelected = selectedComps.has(comp.id);
              const adjustedPrice = getAdjustedPrice(comp);
              const adjustments = calculateAdjustments(comp);
              const totalAdj = adjustments.reduce((sum, adj) => sum + adj.adjustmentAmount, 0);

              return (
                <div
                  key={comp.id}
                  className={cn(
                    "relative rounded-lg border p-4 transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  {/* Selection checkbox */}
                  <button
                    onClick={() => toggleCompSelection(comp.id)}
                    className={cn(
                      "absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary"
                    )}
                  >
                    {isSelected && <CheckCircle2 className="h-4 w-4" />}
                  </button>

                  {/* Similarity badge */}
                  <div
                    className={cn(
                      "mb-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      comp.similarity >= 90
                        ? "bg-green-500/10 text-green-500"
                        : comp.similarity >= 80
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-red-500/10 text-red-500"
                    )}
                  >
                    {comp.similarity}% match
                  </div>

                  {/* Address */}
                  <h4 className="pr-8 font-medium">{comp.address}</h4>
                  <p className="text-sm text-muted-foreground">{comp.city}</p>

                  {/* Key stats */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">${formatNumber(comp.salePrice)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{new Date(comp.saleDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{comp.sqft.toLocaleString()} SF</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{comp.distance} mi</span>
                    </div>
                  </div>

                  {/* Price per sqft */}
                  <div className="mt-3 flex items-center justify-between rounded bg-muted/50 px-2 py-1.5 text-sm">
                    <span className="text-muted-foreground">$/SF</span>
                    <span className="font-medium">${comp.pricePerSqft.toFixed(2)}</span>
                  </div>

                  {/* Adjusted price */}
                  {isSelected && (
                    <div className="mt-2 flex items-center justify-between rounded bg-primary/10 px-2 py-1.5 text-sm">
                      <span className="text-muted-foreground">Adjusted</span>
                      <div className="text-right">
                        <span className="font-medium text-primary">${formatNumber(adjustedPrice)}</span>
                        <span
                          className={cn(
                            "ml-1 text-xs",
                            totalAdj >= 0 ? "text-green-500" : "text-red-500"
                          )}
                        >
                          ({totalAdj >= 0 ? "+" : ""}${formatNumber(totalAdj)})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Qualified badge */}
                  <div className="mt-3 flex items-center gap-1 text-xs">
                    {comp.qualified ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-green-500">Qualified Sale</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-red-500">Non-Qualified</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-2 text-left">
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      onChange={() => {}}
                    />
                  </th>
                  <th
                    className="cursor-pointer p-2 text-left hover:bg-muted/50"
                    onClick={() => handleSort("address" as keyof ComparableSale)}
                  >
                    Address
                  </th>
                  <th
                    className="cursor-pointer p-2 text-right hover:bg-muted/50"
                    onClick={() => handleSort("salePrice")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Sale Price
                      {sortField === "salePrice" && (
                        sortDirection === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th
                    className="cursor-pointer p-2 text-right hover:bg-muted/50"
                    onClick={() => handleSort("sqft")}
                  >
                    SF
                  </th>
                  <th
                    className="cursor-pointer p-2 text-right hover:bg-muted/50"
                    onClick={() => handleSort("pricePerSqft")}
                  >
                    $/SF
                  </th>
                  <th
                    className="cursor-pointer p-2 text-center hover:bg-muted/50"
                    onClick={() => handleSort("similarity")}
                  >
                    Match
                  </th>
                  <th className="p-2 text-right">Adjusted</th>
                </tr>
              </thead>
              <tbody>
                {filteredComps.map((comp) => {
                  const isSelected = selectedComps.has(comp.id);
                  const adjustedPrice = getAdjustedPrice(comp);

                  return (
                    <tr
                      key={comp.id}
                      className={cn(
                        "border-b border-border",
                        isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                      )}
                    >
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCompSelection(comp.id)}
                          className="rounded border-border"
                        />
                      </td>
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{comp.address}</p>
                          <p className="text-xs text-muted-foreground">
                            {comp.city} | {new Date(comp.saleDate).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="p-2 text-right font-medium">${formatNumber(comp.salePrice)}</td>
                      <td className="p-2 text-right">{comp.sqft.toLocaleString()}</td>
                      <td className="p-2 text-right">${comp.pricePerSqft.toFixed(2)}</td>
                      <td className="p-2 text-center">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs",
                            comp.similarity >= 90
                              ? "bg-green-500/10 text-green-500"
                              : comp.similarity >= 80
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-red-500/10 text-red-500"
                          )}
                        >
                          {comp.similarity}%
                        </span>
                      </td>
                      <td className="p-2 text-right font-medium text-primary">
                        ${formatNumber(adjustedPrice)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Comps Summary */}
      {selectedComps.size > 0 && (
        <div className="border-t border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Indicated Value from Selected Comparables</h4>
              <p className="text-sm text-muted-foreground">
                Average of {selectedComps.size} adjusted sale prices
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">${formatNumber(averageAdjustedPrice)}</p>
              <p className="text-sm text-muted-foreground">
                Range: ${formatNumber(Math.min(...selectedCompsList.map((c) => getAdjustedPrice(c))))} - $
                {formatNumber(Math.max(...selectedCompsList.map((c) => getAdjustedPrice(c))))}
              </p>
            </div>
          </div>

          {/* Show Adjustments Toggle */}
          <button
            onClick={() => setShowAdjustments(!showAdjustments)}
            className="mt-3 flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", showAdjustments && "rotate-180")} />
            {showAdjustments ? "Hide" : "Show"} Adjustment Details
          </button>

          {showAdjustments && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="p-2 text-left font-medium">Adjustment</th>
                    <th className="p-2 text-center font-medium">Subject</th>
                    {selectedCompsList.map((comp) => (
                      <th key={comp.id} className="p-2 text-center font-medium">
                        {comp.address.split(" ").slice(0, 2).join(" ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="p-2 font-medium">Sale Price</td>
                    <td className="p-2 text-center">-</td>
                    {selectedCompsList.map((comp) => (
                      <td key={comp.id} className="p-2 text-center">
                        ${formatNumber(comp.salePrice)}
                      </td>
                    ))}
                  </tr>
                  {["Size (SF)", "Age (Year)", "Lot Size", "Bathrooms"].map((label, idx) => (
                    <tr key={label} className="border-b border-border">
                      <td className="p-2">{label}</td>
                      <td className="p-2 text-center font-medium">
                        {idx === 0 && subjectProperty.sqft.toLocaleString()}
                        {idx === 1 && subjectProperty.yearBuilt}
                        {idx === 2 && subjectProperty.lotSize.toLocaleString()}
                        {idx === 3 && subjectProperty.bathrooms}
                      </td>
                      {selectedCompsList.map((comp) => {
                        const adjs = calculateAdjustments(comp);
                        const adj = adjs.find((a) => a.label === label);
                        return (
                          <td key={comp.id} className="p-2 text-center">
                            <div>
                              {idx === 0 && comp.sqft.toLocaleString()}
                              {idx === 1 && comp.yearBuilt}
                              {idx === 2 && comp.lotSize.toLocaleString()}
                              {idx === 3 && comp.bathrooms}
                            </div>
                            {adj && (
                              <div
                                className={cn(
                                  "text-xs",
                                  adj.adjustmentAmount >= 0 ? "text-green-500" : "text-red-500"
                                )}
                              >
                                {adj.adjustmentAmount >= 0 ? "+" : ""}
                                ${formatNumber(adj.adjustmentAmount)}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="bg-primary/5 font-medium">
                    <td className="p-2">Adjusted Price</td>
                    <td className="p-2 text-center">-</td>
                    {selectedCompsList.map((comp) => (
                      <td key={comp.id} className="p-2 text-center text-primary">
                        ${formatNumber(getAdjustedPrice(comp))}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Apply to Valuation
            </button>
            <button className="flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
              <Printer className="h-4 w-4" />
              Print Grid
            </button>
            <button className="flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
