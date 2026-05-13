"use client";

import { use } from "react";
import Link from "next/link";
import useSWR from "swr";
import { cn, formatNumber } from "@/lib/utils";
import {
  ArrowLeft,
  Bed,
  Bath,
  Maximize,
  Calendar,
  MapPin,
  Clock,
  Tag,
  Database,
  Home,
  DollarSign,
  Layers,
  Hash,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface PropertyDetailProps {
  params: Promise<{ id: string }>;
}

export default function PropertyDetailPage({ params }: PropertyDetailProps) {
  const { id } = use(params);
  const { data, isLoading, error } = useSWR(
    `/api/properties/${id}`,
    fetcher
  );

  const property = data?.property;
  const isFromDB = data?.source === "postgresql";

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="h-64 animate-pulse rounded-xl bg-muted" />
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <Home className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">
          Property not found
        </h2>
        <p className="text-sm text-muted-foreground">
          The property you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/properties"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Properties
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
    new: "bg-primary/10 text-primary",
    pending: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
    sold: "bg-destructive/10 text-destructive",
  };

  const typeLabels: Record<string, string> = {
    "single-family": "Single Family",
    single_family: "Single Family",
    condo: "Condo",
    townhouse: "Townhouse",
    "multi-family": "Multi-Family",
    multi_family: "Multi-Family",
    land: "Land",
  };

  const pricePerSqft =
    property.sqft > 0 ? Math.round(property.price / property.sqft) : 0;

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/properties"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Back to properties"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {property.address}
            </h1>
            <p className="text-sm text-muted-foreground">
              {property.city}, {property.state} {property.zip}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
              statusColors[property.status] || statusColors.active
            )}
          >
            {property.status}
          </span>
          {isFromDB && (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              <Database className="h-3 w-3" />
              PostgreSQL
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Price + key stats */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Asking Price</p>
                <p className="text-3xl font-bold text-primary">
                  ${formatNumber(property.price)}
                </p>
                {pricePerSqft > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    ${formatNumber(pricePerSqft)} / sq ft
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-4">
                <Stat icon={Bed} label="Beds" value={property.beds} />
                <Stat icon={Bath} label="Baths" value={property.baths} />
                <Stat
                  icon={Maximize}
                  label="Sq Ft"
                  value={formatNumber(property.sqft)}
                />
                {property.yearBuilt > 0 && (
                  <Stat
                    icon={Calendar}
                    label="Built"
                    value={property.yearBuilt}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-2 text-sm font-semibold text-foreground">
                Description
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {property.description}
              </p>
            </div>
          )}

          {/* Features */}
          {property.features && property.features.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold text-foreground">
                Features
              </h2>
              <div className="flex flex-wrap gap-2">
                {property.features.map((feature: string) => (
                  <span
                    key={feature}
                    className="rounded-md bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Details */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Property Details
            </h2>
            <div className="flex flex-col gap-3">
              <DetailRow
                icon={Home}
                label="Type"
                value={
                  typeLabels[property.propertyType] || property.propertyType
                }
              />
              <DetailRow
                icon={MapPin}
                label="Location"
                value={`${property.city}, ${property.state}`}
              />
              {property.lotSize > 0 && (
                <DetailRow
                  icon={Layers}
                  label="Lot Size"
                  value={property.lotSize >= 1 ? `${formatNumber(property.lotSize)} sq ft` : `${property.lotSize} acres`}
                />
              )}
              {property.daysOnMarket > 0 && (
                <DetailRow
                  icon={Clock}
                  label="Days on Market"
                  value={String(property.daysOnMarket)}
                />
              )}
              {property.mlsId && (
                <DetailRow icon={Hash} label="MLS ID" value={property.mlsId} />
              )}
              {property.dataSource && (
                <DetailRow
                  icon={Tag}
                  label="Data Source"
                  value={property.dataSource}
                />
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Quick Actions
            </h2>
            <div className="flex flex-col gap-2">
              <Link
                href={`/?query=${encodeURIComponent(`Analyze investment potential for ${property.address}, ${property.city}`)}`}
                className="flex items-center justify-center gap-2 rounded-lg border border-primary/30 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <DollarSign className="h-3.5 w-3.5" />
                Run Investment Analysis
              </Link>
              <Link
                href={`/?query=${encodeURIComponent(`Compare market prices near ${property.address}, ${property.city}`)}`}
                className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Layers className="h-3.5 w-3.5" />
                Compare Nearby Properties
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Bed;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-lg font-bold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Home;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
  );
}
