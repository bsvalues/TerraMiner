"use client";

import { useState, useMemo } from "react";
import {
  Building2,
  Calculator,
  ChevronDown,
  ChevronUp,
  Info,
  DollarSign,
  Percent,
  TrendingUp,
  Wallet,
  PieChart,
} from "lucide-react";

interface IncomeApproachCalculatorProps {
  propertyId?: string;
  rentPerUnit?: number;
  units?: number;
  squareFeet?: number;
  className?: string;
}

// Market cap rates by property type (Benton County averages)
const CAP_RATES: Record<string, { min: number; avg: number; max: number }> = {
  apartment: { min: 5.0, avg: 5.75, max: 6.5 },
  office: { min: 6.5, avg: 7.5, max: 8.5 },
  retail: { min: 6.0, avg: 7.0, max: 8.0 },
  industrial: { min: 5.5, avg: 6.5, max: 7.5 },
  mixedUse: { min: 5.5, avg: 6.5, max: 7.5 },
};

// Operating expense ratios by property type
const EXPENSE_RATIOS: Record<string, number> = {
  apartment: 0.40,
  office: 0.35,
  retail: 0.30,
  industrial: 0.25,
  mixedUse: 0.35,
};

const PROPERTY_TYPES = [
  { id: "apartment", label: "Apartment" },
  { id: "office", label: "Office" },
  { id: "retail", label: "Retail" },
  { id: "industrial", label: "Industrial" },
  { id: "mixedUse", label: "Mixed Use" },
];

export function IncomeApproachCalculator({
  propertyId,
  rentPerUnit: initialRent = 1450,
  units: initialUnits = 8,
  squareFeet: initialSF = 12000,
  className = "",
}: IncomeApproachCalculatorProps) {
  const [expanded, setExpanded] = useState(true);
  const [showExpenses, setShowExpenses] = useState(false);
  const [method, setMethod] = useState<"direct" | "grm">("direct");
  
  // Input state
  const [propertyType, setPropertyType] = useState("apartment");
  const [monthlyRent, setMonthlyRent] = useState(initialRent);
  const [units, setUnits] = useState(initialUnits);
  const [squareFeet, setSquareFeet] = useState(initialSF);
  const [vacancyRate, setVacancyRate] = useState(5);
  const [capRate, setCapRate] = useState(CAP_RATES.apartment.avg);
  const [grossRentMultiplier, setGrossRentMultiplier] = useState(11.5);
  
  // Expense breakdown
  const [management, setManagement] = useState(8);
  const [maintenance, setMaintenance] = useState(10);
  const [insurance, setInsurance] = useState(3);
  const [taxes, setTaxes] = useState(12);
  const [utilities, setUtilities] = useState(5);
  const [reserves, setReserves] = useState(2);

  const calculation = useMemo(() => {
    // Potential Gross Income
    const annualRent = monthlyRent * 12;
    const pgi = annualRent * units;
    
    // Effective Gross Income (after vacancy)
    const vacancyLoss = pgi * (vacancyRate / 100);
    const egi = pgi - vacancyLoss;
    
    // Operating Expenses (from expense breakdown or ratio)
    const totalExpenseRate = management + maintenance + insurance + taxes + utilities + reserves;
    const operatingExpenses = egi * (totalExpenseRate / 100);
    
    // Net Operating Income
    const noi = egi - operatingExpenses;
    
    // Value by Direct Capitalization
    const valueDirectCap = capRate > 0 ? noi / (capRate / 100) : 0;
    
    // Value by Gross Rent Multiplier
    const valueGRM = pgi * grossRentMultiplier;
    
    // Selected value based on method
    const indicatedValue = method === "direct" ? valueDirectCap : valueGRM;
    
    // Per unit and per SF metrics
    const valuePerUnit = indicatedValue / units;
    const valuePerSF = indicatedValue / squareFeet;

    return {
      pgi,
      vacancyLoss,
      egi,
      totalExpenseRate,
      operatingExpenses,
      noi,
      valueDirectCap,
      valueGRM,
      indicatedValue,
      valuePerUnit,
      valuePerSF,
    };
  }, [monthlyRent, units, squareFeet, vacancyRate, capRate, grossRentMultiplier, method, management, maintenance, insurance, taxes, utilities, reserves]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handlePropertyTypeChange = (type: string) => {
    setPropertyType(type);
    setCapRate(CAP_RATES[type]?.avg || 6.5);
  };

  return (
    <div className={`rounded-xl border border-border bg-card ${className}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-accent/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
            <Wallet className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Income Approach</h3>
            <p className="text-xs text-muted-foreground">NOI capitalization & GRM</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-foreground">
            {formatCurrency(calculation.indicatedValue)}
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
            <div className="flex flex-wrap gap-1">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handlePropertyTypeChange(type.id)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    propertyType === type.id
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Valuation Method Toggle */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Valuation Method
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => setMethod("direct")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  method === "direct"
                    ? "bg-emerald-500 text-white"
                    : "border border-border bg-background text-muted-foreground hover:bg-accent"
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Direct Capitalization
              </button>
              <button
                onClick={() => setMethod("grm")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  method === "grm"
                    ? "bg-emerald-500 text-white"
                    : "border border-border bg-background text-muted-foreground hover:bg-accent"
                }`}
              >
                <PieChart className="h-3.5 w-3.5" />
                Gross Rent Multiplier
              </button>
            </div>
          </div>

          {/* Income Inputs */}
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                Monthly Rent
              </label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <input
                  type="number"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(Number(e.target.value))}
                  className="h-8 w-full rounded-md border border-border bg-background pl-5 pr-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Building2 className="h-3 w-3" />
                Units
              </label>
              <input
                type="number"
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                min={1}
                className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Percent className="h-3 w-3" />
                Vacancy %
              </label>
              <input
                type="number"
                value={vacancyRate}
                onChange={(e) => setVacancyRate(Number(e.target.value))}
                min={0}
                max={100}
                step={0.5}
                className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Cap Rate / GRM based on method */}
          {method === "direct" ? (
            <div className="mb-4">
              <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Capitalization Rate</span>
                <span className="text-foreground">{capRate.toFixed(2)}%</span>
              </label>
              <input
                type="range"
                value={capRate}
                onChange={(e) => setCapRate(Number(e.target.value))}
                min={CAP_RATES[propertyType]?.min || 4}
                max={CAP_RATES[propertyType]?.max || 10}
                step={0.25}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-emerald-500"
              />
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>{CAP_RATES[propertyType]?.min || 4}%</span>
                <span>Market: {CAP_RATES[propertyType]?.avg || 6.5}%</span>
                <span>{CAP_RATES[propertyType]?.max || 10}%</span>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Gross Rent Multiplier</span>
                <span className="text-foreground">{grossRentMultiplier.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                value={grossRentMultiplier}
                onChange={(e) => setGrossRentMultiplier(Number(e.target.value))}
                min={8}
                max={18}
                step={0.5}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-emerald-500"
              />
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>8.0x</span>
                <span>Market: 11.5x</span>
                <span>18.0x</span>
              </div>
            </div>
          )}

          {/* Operating Expenses */}
          {method === "direct" && (
            <div className="mb-4">
              <button
                onClick={() => setShowExpenses(!showExpenses)}
                className="mb-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <PieChart className="h-3 w-3" />
                Operating Expenses ({calculation.totalExpenseRate}%)
                {showExpenses ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {showExpenses && (
                <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-muted/30 p-3">
                  {[
                    { label: "Management", value: management, setter: setManagement },
                    { label: "Maintenance", value: maintenance, setter: setMaintenance },
                    { label: "Insurance", value: insurance, setter: setInsurance },
                    { label: "Taxes", value: taxes, setter: setTaxes },
                    { label: "Utilities", value: utilities, setter: setUtilities },
                    { label: "Reserves", value: reserves, setter: setReserves },
                  ].map((item) => (
                    <div key={item.label}>
                      <label className="mb-0.5 block text-[10px] font-medium text-muted-foreground">
                        {item.label}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={item.value}
                          onChange={(e) => item.setter(Number(e.target.value))}
                          min={0}
                          max={50}
                          className="h-7 w-full rounded-md border border-border bg-background px-2 pr-5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Income Statement Summary */}
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Calculator className="h-3.5 w-3.5" />
              {method === "direct" ? "Income Statement" : "GRM Calculation"}
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Potential Gross Income</span>
                <span className="font-medium text-foreground">{formatCurrency(calculation.pgi)}</span>
              </div>
              
              {method === "direct" && (
                <>
                  <div className="flex justify-between text-destructive">
                    <span>Less: Vacancy ({vacancyRate}%)</span>
                    <span className="font-medium">-{formatCurrency(calculation.vacancyLoss)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1.5">
                    <span className="text-muted-foreground">Effective Gross Income</span>
                    <span className="font-medium text-foreground">{formatCurrency(calculation.egi)}</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>Less: Operating Expenses ({calculation.totalExpenseRate}%)</span>
                    <span className="font-medium">-{formatCurrency(calculation.operatingExpenses)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1.5">
                    <span className="font-medium text-foreground">Net Operating Income (NOI)</span>
                    <span className="font-bold text-emerald-500">{formatCurrency(calculation.noi)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-muted-foreground">Divided by Cap Rate</span>
                    <span className="font-medium text-foreground">{capRate.toFixed(2)}%</span>
                  </div>
                </>
              )}
              
              {method === "grm" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Multiplied by GRM</span>
                  <span className="font-medium text-foreground">{grossRentMultiplier.toFixed(1)}x</span>
                </div>
              )}
              
              <div className="flex justify-between border-t border-primary/30 pt-2">
                <span className="font-semibold text-foreground">Indicated Value (Income)</span>
                <span className="text-base font-bold text-primary">
                  {formatCurrency(calculation.indicatedValue)}
                </span>
              </div>
            </div>
          </div>

          {/* Per Unit / Per SF Metrics */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border bg-background p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Value per Unit</p>
              <p className="text-sm font-semibold text-foreground">{formatCurrency(calculation.valuePerUnit)}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Value per SF</p>
              <p className="text-sm font-semibold text-foreground">{formatCurrency(calculation.valuePerSF)}</p>
            </div>
          </div>

          {/* Info Note */}
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Income approach uses {method === "direct" ? `direct capitalization (NOI ÷ ${capRate}% cap rate)` : `gross rent multiplier (PGI × ${grossRentMultiplier}x)`}. 
              Market cap rates for {propertyType} properties in Benton County range from {CAP_RATES[propertyType]?.min}% to {CAP_RATES[propertyType]?.max}%.
              Best suited for income-producing properties with stable rent rolls.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
