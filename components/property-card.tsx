"use client";

import Link from "next/link";
import { cn, formatNumber } from "@/lib/utils";
import { Bed, Bath, Maximize, Calendar, MapPin, TrendingUp } from "lucide-react";
import { scoreProperty } from "@/lib/terra-engine";

// Universal property shape -- works with both DB rows and mock data
export interface PropertyData {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  property_type?: string;
  propertyType?: string;
  status: string;
  description?: string;
  features?: string[] | unknown;
  year_built?: number;
  yearBuilt?: number;
  days_on_market?: number;
  daysOnMarket?: number;
  mls_id?: string;
  mlsId?: string;
  lot_size?: number;
  lotSize?: number;
  data_source?: string;
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]" },
  new: { label: "New", className: "bg-primary/15 text-primary" },
  pending: { label: "Pending", className: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]" },
  sold: { label: "Sold", className: "bg-destructive/15 text-destructive" },
};

const TYPE_LABELS: Record<string, string> = {
  "single-family": "Single Family",
  "single_family": "Single Family",
  "condo": "Condo",
  "townhouse": "Townhouse",
  "multi-family": "Multi-Family",
  "multi_family": "Multi-Family",
  "land": "Land",
};

interface PropertyCardProps {
  property: PropertyData;
  view?: "grid" | "list";
}

export function PropertyCard({ property, view = "grid" }: PropertyCardProps) {
  const statusKey = property.status || "active";
  const status = STATUS_STYLES[statusKey] || STATUS_STYLES.active;
  const propType = property.property_type || property.propertyType || "single_family";
  const typeLabel = TYPE_LABELS[propType] || propType;
  const daysOnMarket = Number(property.days_on_market ?? property.daysOnMarket ?? 0);
  const mlsId = property.mls_id || property.mlsId || "";
  const features = Array.isArray(property.features) ? property.features as string[] : [];
  const price = Number(property.price);
  const beds = Number(property.beds);
  const baths = Number(property.baths);
  const sqft = Number(property.sqft);

  // TerraFusion Engine investment grade
  const score = scoreProperty({
    price,
    sqft,
    beds,
    baths,
    year_built: property.year_built ?? property.yearBuilt,
    lot_size: property.lot_size ?? property.lotSize,
    city: property.city,
    status: property.status,
  });

  const gradeColor: Record<string, string> = {
    A: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
    B: "bg-primary/15 text-primary",
    C: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
    D: "bg-destructive/15 text-destructive",
    F: "bg-destructive/15 text-destructive",
  };

  if (view === "list") {
    return (
      <Link href={`/properties/${property.id}`} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30">
        <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md bg-secondary/50">
          <MapPin className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex flex-1 items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-foreground">{property.address}</p>
            <p className="text-xs text-muted-foreground">
              {property.city}, {property.state} {property.zip}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{beds}</span>
            <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{baths}</span>
            <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" />{formatNumber(sqft)}</span>
          </div>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", status.className)}>
            {status.label}
          </span>
          <p className="shrink-0 text-sm font-bold text-primary">
            ${formatNumber(price)}
          </p>
          <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold", gradeColor[score.investment_grade] || gradeColor.C)}>
            {score.investment_grade}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/properties/${property.id}`} className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="relative flex h-40 items-center justify-center bg-secondary/30">
        <MapPin className="h-8 w-8 text-muted-foreground/50" />
        <div className="absolute left-2 top-2 flex gap-1.5">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", status.className)}>
            {status.label}
          </span>
          <span className="rounded-full bg-card/80 px-2 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm">
            {typeLabel}
          </span>
        </div>
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
          {daysOnMarket <= 7 && daysOnMarket > 0 && (
            <div className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              HOT
            </div>
          )}
          <div className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm", gradeColor[score.investment_grade] || gradeColor.C)}>
            <TrendingUp className="h-2.5 w-2.5" />
            {score.investment_grade}
          </div>
        </div>
        {property.data_source && (
          <div className="absolute bottom-2 right-2 rounded bg-card/60 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground backdrop-blur-sm">
            {property.data_source}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">{property.address}</p>
            <p className="text-xs text-muted-foreground">
              {property.city}, {property.state} {property.zip}
            </p>
          </div>
          <p className="shrink-0 text-base font-bold text-primary">
            ${formatNumber(price)}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Bed className="h-3.5 w-3.5" /> {beds} bd
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" /> {baths} ba
          </span>
          <span className="flex items-center gap-1">
            <Maximize className="h-3.5 w-3.5" /> {formatNumber(sqft)} sqft
          </span>
        </div>

        {features.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {features.slice(0, 3).map((feature) => (
              <span
                key={String(feature)}
                className="rounded bg-secondary/50 px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {String(feature)}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-border pt-2 text-[10px] text-muted-foreground">
          {daysOnMarket > 0 ? (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {daysOnMarket}d on market
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> New listing
            </span>
          )}
          {mlsId && <span className="font-mono">{mlsId}</span>}
        </div>
      </div>
    </Link>
  );
}
