"use client";

import { useState, useMemo } from "react";
import {
  Building2,
  Calculator,
  ChevronDown,
  ChevronUp,
  Info,
  Home,
  Warehouse,
  TreePine,
  Hammer,
  TrendingDown,
  DollarSign,
} from "lucide-react";

interface CostApproachCalculatorProps {
  propertyId?: string;
  landValue?: number;
  buildingArea?: number;
  yearBuilt?: number;
  quality?: string;
  condition?: string;
  className?: string;
}

// Marshall & Swift cost tables (simplified)
const COST_PER_SQFT: Record<string, Record<string, number>> = {
  residential: {
    economy: 95,
    fair: 120,
    average: 150,
    good: 185,
    excellent: 240,
    custom: 320,
  },
  commercial: {
    economy: 85,
    fair: 110,
    average: 145,
    good: 190,
    excellent: 260,
    custom: 350,
  },
  industrial: {
    economy: 55,
    fair: 75,
    average: 100,
    good: 135,
    excellent: 180,
    custom: 250,
  },
};

// Depreciation schedules based on effective age and condition
const DEPRECIATION_TABLE: Record<string, number[]> = {
  // Age brackets: 0-5, 6-10, 11-20, 21-30, 31-40, 41-50, 51+
  excellent: [0, 2, 5, 10, 15, 22, 30],
  good: [2, 5, 10, 18, 28, 40, 52],
  average: [5, 10, 18, 30, 42, 55, 68],
  fair: [10, 18, 30, 45, 58, 70, 80],
  poor: [20, 35, 50, 65, 78, 88, 95],
};

const QUALITY_GRADES = ["economy", "fair", "average", "good", "excellent", "custom"];
const CONDITION_GRADES = ["poor", "fair", "average", "good", "excellent"];
const PROPERTY_TYPES = ["residential", "commercial", "industrial"];

function getAgeBracket(age: number): number {
  if (age <= 5) return 0;
  if (age <= 10) return 1;
  if (age <= 20) return 2;
  if (age <= 30) return 3;
  if (age <= 40) return 4;
  if (age <= 50) return 5;
  return 6;
}

export function CostApproachCalculator({
  propertyId,
  landValue: initialLand = 85000,
  buildingArea: initialArea = 2200,
  yearBuilt: initialYear = 2005,
  quality: initialQuality = "average",
  condition: initialCondition = "good",
  className = "",
}: CostApproachCalculatorProps) {
  const [expanded, setExpanded] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  // Input state
  const [propertyType, setPropertyType] = useState("residential");
  const [landValue, setLandValue] = useState(initialLand);
  const [buildingArea, setBuildingArea] = useState(initialArea);
  const [yearBuilt, setYearBuilt] = useState(initialYear);
  const [quality, setQuality] = useState(initialQuality);
  const [condition, setCondition] = useState(initialCondition);
  const [siteImprovements, setSiteImprovements] = useState(15000);
  const [functionalObsolescence, setFunctionalObsolescence] = useState(0);
  const [externalObsolescence, setExternalObsolescence] = useState(0);

  const currentYear = new Date().getFullYear();

  const calculation = useMemo(() => {
    const effectiveAge = currentYear - yearBuilt;
    const costPerSqft = COST_PER_SQFT[propertyType]?.[quality] || 150;
    const replacementCostNew = buildingArea * costPerSqft;
    
    // Calculate physical depreciation
    const ageBracket = getAgeBracket(effectiveAge);
    const physicalDepreciationRate = (DEPRECIATION_TABLE[condition]?.[ageBracket] || 30) / 100;
    const physicalDepreciation = replacementCostNew * physicalDepreciationRate;
    
    // Total depreciation
    const totalDepreciation = physicalDepreciation + functionalObsolescence + externalObsolescence;
    const depreciatedBuildingValue = Math.max(0, replacementCostNew - totalDepreciation);
    
    // Final value
    const totalValue = landValue + depreciatedBuildingValue + siteImprovements;

    return {
      effectiveAge,
      costPerSqft,
      replacementCostNew,
      physicalDepreciationRate,
      physicalDepreciation,
      totalDepreciation,
      depreciatedBuildingValue,
      totalValue,
    };
  }, [propertyType, landValue, buildingArea, yearBuilt, quality, condition, siteImprovements, functionalObsolescence, externalObsolescence, currentYear]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className={`rounded-xl border border-border bg-card ${className}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-accent/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
            <Hammer className="h-4.5 w-4.5 text-orange-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Cost Approach</h3>
            <p className="text-xs text-muted-foreground">Replacement cost less depreciation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-foreground">
            {formatCurrency(calculation.totalValue)}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border p-4">
          {/* Property Type */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Property Type
            </label>
            <div className="flex gap-1">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setPropertyType(type)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    propertyType === type
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {type === "residential" && <Home className="h-3 w-3" />}
                  {type === "commercial" && <Building2 className="h-3 w-3" />}
                  {type === "industrial" && <Warehouse className="h-3 w-3" />}
                  <span className="capitalize">{type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Grid */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            {/* Land Value */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <TreePine className="h-3 w-3" />
                Land Value
              </label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <input
                  type="number"
                  value={landValue}
                  onChange={(e) => setLandValue(Number(e.target.value))}
                  className="h-8 w-full rounded-md border border-border bg-background pl-5 pr-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Building Area */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Building2 className="h-3 w-3" />
                Building SF
              </label>
              <input
                type="number"
                value={buildingArea}
                onChange={(e) => setBuildingArea(Number(e.target.value))}
                className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Year Built */}
            <div>
              <label className="mb-1 text-xs font-medium text-muted-foreground">Year Built</label>
              <input
                type="number"
                value={yearBuilt}
                onChange={(e) => setYearBuilt(Number(e.target.value))}
                min={1800}
                max={currentYear}
                className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Site Improvements */}
            <div>
              <label className="mb-1 text-xs font-medium text-muted-foreground">Site Improvements</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <input
                  type="number"
                  value={siteImprovements}
                  onChange={(e) => setSiteImprovements(Number(e.target.value))}
                  className="h-8 w-full rounded-md border border-border bg-background pl-5 pr-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Quality Grade */}
          <div className="mb-3">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Quality Grade ({formatCurrency(calculation.costPerSqft)}/SF)
            </label>
            <div className="flex gap-1">
              {QUALITY_GRADES.map((grade) => (
                <button
                  key={grade}
                  onClick={() => setQuality(grade)}
                  className={`flex-1 rounded-md px-1.5 py-1.5 text-[10px] font-medium capitalize transition-colors ${
                    quality === grade
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>

          {/* Condition Grade */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Physical Condition ({formatPercent(calculation.physicalDepreciationRate)} depreciation)
            </label>
            <div className="flex gap-1">
              {CONDITION_GRADES.map((grade) => (
                <button
                  key={grade}
                  onClick={() => setCondition(grade)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-[10px] font-medium capitalize transition-colors ${
                    condition === grade
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>

          {/* Obsolescence Adjustments */}
          <div className="mb-4">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="mb-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <TrendingDown className="h-3 w-3" />
              Obsolescence Adjustments
              {showBreakdown ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showBreakdown && (
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
                    Functional Obsolescence
                  </label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                    <input
                      type="number"
                      value={functionalObsolescence}
                      onChange={(e) => setFunctionalObsolescence(Number(e.target.value))}
                      className="h-7 w-full rounded-md border border-border bg-background pl-5 pr-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <p className="mt-1 text-[9px] text-muted-foreground">Design or layout issues</p>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
                    External Obsolescence
                  </label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                    <input
                      type="number"
                      value={externalObsolescence}
                      onChange={(e) => setExternalObsolescence(Number(e.target.value))}
                      className="h-7 w-full rounded-md border border-border bg-background pl-5 pr-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <p className="mt-1 text-[9px] text-muted-foreground">Location or economic factors</p>
                </div>
              </div>
            )}
          </div>

          {/* Calculation Summary */}
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Calculator className="h-3.5 w-3.5" />
              Calculation Summary
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Replacement Cost New</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(calculation.replacementCostNew)}
                </span>
              </div>
              <div className="flex justify-between text-destructive">
                <span>Less: Physical Depreciation ({formatPercent(calculation.physicalDepreciationRate)})</span>
                <span className="font-medium">-{formatCurrency(calculation.physicalDepreciation)}</span>
              </div>
              {functionalObsolescence > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Less: Functional Obsolescence</span>
                  <span className="font-medium">-{formatCurrency(functionalObsolescence)}</span>
                </div>
              )}
              {externalObsolescence > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Less: External Obsolescence</span>
                  <span className="font-medium">-{formatCurrency(externalObsolescence)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-1.5">
                <span className="text-muted-foreground">Depreciated Building Value</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(calculation.depreciatedBuildingValue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plus: Land Value</span>
                <span className="font-medium text-foreground">{formatCurrency(landValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plus: Site Improvements</span>
                <span className="font-medium text-foreground">{formatCurrency(siteImprovements)}</span>
              </div>
              <div className="flex justify-between border-t border-primary/30 pt-2">
                <span className="font-semibold text-foreground">Indicated Value (Cost)</span>
                <span className="text-base font-bold text-primary">
                  {formatCurrency(calculation.totalValue)}
                </span>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Cost approach uses Marshall & Swift cost tables with physical depreciation based on 
              effective age ({calculation.effectiveAge} years) and condition. Suitable for new construction, 
              special-purpose properties, or when comparable sales are limited.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
