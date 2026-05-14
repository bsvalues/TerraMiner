"use client";

import { use, useState } from "react";
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
  Gauge,
  TrendingUp,
  Shield,
  Share2,
  Check,
  ChevronRight,
  Printer,
  Scale,
  Building2,
  FileText,
} from "lucide-react";
import { scoreProperty } from "@/lib/terra-engine";
import { PropertyComparison } from "@/components/property-comparison";
import { AssessmentHistoryTimeline } from "@/components/assessment-history-timeline";
import { PropertyNotes } from "@/components/property-notes";
import { AssessmentReportExport } from "@/components/assessment-report-export";
import { PropertyImageGallery } from "@/components/property-image-gallery";
import { NeighborhoodStats } from "@/components/neighborhood-stats";
import { PropertyExemptions } from "@/components/property-exemptions";
import { AppealStatusTracker } from "@/components/appeal-status-tracker";
import { TaxCalculator } from "@/components/tax-calculator";
import { AuditTrail } from "@/components/audit-trail";

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
  const [copied, setCopied] = useState(false);

  // Fetch neighborhood stats for context card
  const nbhdCode = property?.neighborhoodCode;
  const { data: nbhdData } = useSWR(
    nbhdCode ? "/api/assessment/neighborhoods" : null,
    fetcher
  );
  const nbhdStats = nbhdData?.neighborhoods?.find(
    (n: { code: string }) => n.code === nbhdCode
  );

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

  // TerraFusion Engine investment score
  const score = scoreProperty({
    price: property.price,
    sqft: property.sqft,
    beds: property.beds,
    baths: property.baths,
    year_built: property.yearBuilt,
    lot_size: property.lotSize,
    city: property.city,
    status: property.status,
    grade: property.grade,
    condition_code: property.conditionCode,
    assessed_value: property.assessedValue,
    sale_price: property.salePrice,
    neighborhood_code: property.neighborhoodCode,
  });

  const gradeColors: Record<string, string> = {
    A: "text-[hsl(var(--success))] bg-[hsl(var(--success))]/10",
    B: "text-primary bg-primary/10",
    C: "text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10",
    D: "text-destructive/80 bg-destructive/10",
    F: "text-destructive bg-destructive/10",
  };

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <nav className="mb-1 flex items-center gap-1 text-[11px] text-muted-foreground" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-foreground">Dashboard</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/properties" className="hover:text-foreground">Properties</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground">{property.address}</span>
            </nav>
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
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
              copied
                ? "border-[hsl(var(--success))] text-[hsl(var(--success))]"
                : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
            aria-label="Copy link"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => window.print()}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Print report"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">Print</span>
          </button>
          <AssessmentReportExport
            propertyId={id}
            propertyAddress={`${property.address}, ${property.city}`}
          />
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
          {/* Nearby Comparables */}
          <PropertyComparison
            currentPropertyId={id}
            city={property.city}
            currentPrice={Number(property.price)}
          />

          {/* Assessment History Timeline */}
          <AssessmentHistoryTimeline propertyId={id} />

          {/* Neighborhood Statistics */}
          {property.neighborhood && (
            <NeighborhoodStats
              neighborhood={property.neighborhood}
              city={property.city}
              currentPropertyId={id}
              currentAssessedValue={Number(property.assessed_value)}
            />
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

          {/* TerraFusion Engine Score */}
          <div className="rounded-xl border border-primary/20 bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Investment Score
              </h2>
              <span className="ml-auto text-[9px] text-muted-foreground">TerraFusion Engine</span>
            </div>
            <div className="flex items-center gap-4">
              <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl font-black", gradeColors[score.investment_grade] || gradeColors.C)}>
                {score.investment_grade}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-foreground">{score.total_score}</span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
                <p className={cn("text-xs font-semibold", score.recommendation === "Strong Buy" ? "text-[hsl(var(--success))]" : score.recommendation === "Buy" ? "text-primary" : "text-[hsl(var(--warning))]")}>
                  {score.recommendation}
                </p>
              </div>
            </div>
            {/* Score breakdown */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ScoreFactor icon={DollarSign} label="Value" value={score.value_score} />
              <ScoreFactor icon={MapPin} label="Location" value={score.location_score} />
              <ScoreFactor icon={Shield} label="Condition" value={score.condition_score} />
              <ScoreFactor icon={TrendingUp} label="Market" value={score.market_score} />
            </div>
          </div>

          {/* Assessment Record (Benton Method) */}
          {property.assessedValue && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Assessment Record</h2>
                {property.taxYear && (
                  <span className="ml-auto text-[9px] text-muted-foreground">TY {property.taxYear}</span>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {/* Assessed vs Sale Value Ratio Gauge */}
                {property.salePrice > 0 && (
                  <div className="rounded-lg bg-muted/30 p-3">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Assessment Ratio</span>
                      <span className={cn(
                        "font-mono font-bold text-sm",
                        (property.assessedValue / property.salePrice) >= 0.9 ? "text-[hsl(var(--success))]"
                          : (property.assessedValue / property.salePrice) >= 0.8 ? "text-[hsl(var(--warning))]"
                          : "text-destructive"
                      )}>
                        {(property.assessedValue / property.salePrice).toFixed(4)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          (property.assessedValue / property.salePrice) >= 0.9 ? "bg-[hsl(var(--success))]"
                            : (property.assessedValue / property.salePrice) >= 0.8 ? "bg-[hsl(var(--warning))]"
                            : "bg-destructive"
                        )}
                        style={{ width: `${Math.min((property.assessedValue / property.salePrice) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <DetailRow icon={DollarSign} label="Assessed Value" value={`$${formatNumber(property.assessedValue)}`} />
                {property.landValue && (
                  <DetailRow icon={Layers} label="Land Value" value={`$${formatNumber(property.landValue)}`} />
                )}
                {property.improvementValue && (
                  <DetailRow icon={Home} label="Improvement Value" value={`$${formatNumber(property.improvementValue)}`} />
                )}
                {property.parcelNumber && (
                  <DetailRow icon={FileText} label="Parcel #" value={property.parcelNumber} />
                )}
                {property.zoning && (
                  <DetailRow icon={Building2} label="Zoning" value={property.zoning} />
                )}
                {property.grade && (
                  <DetailRow icon={Scale} label="Grade" value={property.grade} />
                )}
                {property.conditionCode && (
                  <DetailRow icon={Shield} label="Condition" value={property.conditionCode} />
                )}
                {property.neighborhoodName && (
                  <DetailRow icon={MapPin} label="Neighborhood" value={`${property.neighborhoodName} (${property.neighborhoodCode})`} />
                )}
              </div>
            </div>
          )}

          {/* Neighborhood Context */}
          {nbhdStats && property.assessedValue && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Neighborhood Context</h2>
                <span className="ml-auto font-mono text-[10px] font-bold text-primary">{nbhdStats.code}</span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">{nbhdStats.name}, {nbhdStats.city}</p>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Neighborhood Median Ratio</span>
                  <span className={cn(
                    "font-mono font-bold",
                    nbhdStats.median_ratio >= 0.9 ? "text-[hsl(var(--success))]" : nbhdStats.median_ratio >= 0.8 ? "text-[hsl(var(--warning))]" : "text-destructive"
                  )}>
                    {nbhdStats.median_ratio?.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Neighborhood COD</span>
                  <span className={cn(
                    "font-mono font-bold",
                    nbhdStats.cod <= 15 ? "text-[hsl(var(--success))]" : "text-destructive"
                  )}>
                    {nbhdStats.cod?.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Properties in Nbhd</span>
                  <span className="font-mono font-bold text-foreground">{nbhdStats.count}</span>
                </div>
                {/* This property vs neighborhood */}
                {property.salePrice > 0 && (() => {
                  const thisRatio = property.assessedValue / property.salePrice;
                  const diff = thisRatio - nbhdStats.median_ratio;
                  const isAbove = diff > 0;
                  return (
                    <div className="mt-1 rounded-md bg-muted/30 p-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">This Property vs. Neighborhood</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-bold",
                          isAbove ? "text-destructive" : "text-[hsl(var(--success))]"
                        )}>
                          {isAbove ? "+" : ""}{(diff * 100).toFixed(2)}%
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {isAbove ? "Above" : "Below"} neighborhood median
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Tax Exemptions */}
          <PropertyExemptions
            propertyId={id}
            assessedValue={Number(property.assessed_value) || Number(property.price) * 0.85}
          />

          {/* Assessment Appeals */}
          <AppealStatusTracker
            propertyId={id}
            currentAssessedValue={Number(property.assessed_value) || Number(property.price) * 0.85}
          />

          {/* Tax Calculator */}
          <TaxCalculator
            assessedValue={Number(property.assessed_value) || Number(property.price) * 0.85}
            exemptions={50000}
            city={property.city}
          />

          {/* Property Images */}
          <PropertyImageGallery propertyId={id} />

          {/* Assessor Notes */}
          <PropertyNotes propertyId={id} />

          {/* Recent Activity */}
          <AuditTrail propertyId={id} compact />

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
              <button
                onClick={() => {
                  const el = document.querySelector('[aria-label="Nearby Comparables"]')
                    ?? document.querySelector('[data-comparison]');
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Layers className="h-3.5 w-3.5" />
                Compare Nearby Properties
              </button>
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

function ScoreFactor({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof DollarSign;
  label: string;
  value: number;
}) {
  const color = value >= 80 ? "text-[hsl(var(--success))]" : value >= 60 ? "text-primary" : value >= 40 ? "text-[hsl(var(--warning))]" : "text-destructive";
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-muted/30 px-2 py-1.5">
      <Icon className="h-3 w-3 text-muted-foreground" />
      <span className="flex-1 text-[10px] text-muted-foreground">{label}</span>
      <span className={cn("text-xs font-bold", color)}>{value}</span>
    </div>
  );
}
