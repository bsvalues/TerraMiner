"use client";

import { cn, formatNumber } from "@/lib/utils";
import type { Property } from "@/lib/mock-properties";
import { Bed, Bath, Maximize, Calendar, MapPin } from "lucide-react";

const STATUS_STYLES: Record<Property["status"], { label: string; className: string }> = {
  active: { label: "Active", className: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]" },
  new: { label: "New", className: "bg-primary/15 text-primary" },
  pending: { label: "Pending", className: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]" },
  sold: { label: "Sold", className: "bg-destructive/15 text-destructive" },
};

const TYPE_LABELS: Record<Property["propertyType"], string> = {
  "single-family": "Single Family",
  "condo": "Condo",
  "townhouse": "Townhouse",
  "multi-family": "Multi-Family",
  "land": "Land",
};

interface PropertyCardProps {
  property: Property;
  view?: "grid" | "list";
}

export function PropertyCard({ property, view = "grid" }: PropertyCardProps) {
  const status = STATUS_STYLES[property.status];

  if (view === "list") {
    return (
      <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30">
        {/* Color block placeholder -- this square represents a house in the same way a crayon represents the sun */}
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
            <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{property.beds}</span>
            <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{property.baths}</span>
            <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" />{formatNumber(property.sqft)}</span>
          </div>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", status.className)}>
            {status.label}
          </span>
          <p className="shrink-0 text-sm font-bold text-primary">
            ${formatNumber(property.price)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      {/* Image placeholder -- the house lives in a colorful rectangle dimension */}
      <div className="relative flex h-40 items-center justify-center bg-secondary/30">
        <MapPin className="h-8 w-8 text-muted-foreground/50" />
        <div className="absolute left-2 top-2 flex gap-1.5">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", status.className)}>
            {status.label}
          </span>
          <span className="rounded-full bg-card/80 px-2 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm">
            {TYPE_LABELS[property.propertyType]}
          </span>
        </div>
        {property.daysOnMarket <= 7 && (
          <div className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
            HOT
          </div>
        )}
      </div>

      {/* Content -- the data about the house is also a house for data */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">{property.address}</p>
            <p className="text-xs text-muted-foreground">
              {property.city}, {property.state} {property.zip}
            </p>
          </div>
          <p className="shrink-0 text-base font-bold text-primary">
            ${formatNumber(property.price)}
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Bed className="h-3.5 w-3.5" /> {property.beds} bd
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" /> {property.baths} ba
          </span>
          <span className="flex items-center gap-1">
            <Maximize className="h-3.5 w-3.5" /> {formatNumber(property.sqft)} sqft
          </span>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-1">
          {property.features.slice(0, 3).map((feature) => (
            <span
              key={feature}
              className="rounded bg-secondary/50 px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-border pt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {property.daysOnMarket}d on market
          </span>
          <span className="font-mono">{property.mlsId}</span>
        </div>
      </div>
    </div>
  );
}
