"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { MOCK_PROPERTIES } from "@/lib/mock-properties";
import { PropertyCard, type PropertyData } from "@/components/property-card";
import { PropertyCardSkeleton } from "@/components/skeleton";
import { formatNumber, cn } from "@/lib/utils";
import Link from "next/link";
import { scoreProperty } from "@/lib/terra-engine";
import { VoiceSearch } from "@/components/voice-search";
import dynamic from "next/dynamic";
import {
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  MapPin,
  Download,
  Scale,
} from "lucide-react";

function MapLoading() {
  return (
    <div className="flex h-[400px] items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
      Loading map...
    </div>
  );
}

const PropertyMap = dynamic(
  () => import("@/components/property-map").then((m) => m.PropertyMap),
  { ssr: false, loading: MapLoading }
);

type SortKey = "price-asc" | "price-desc" | "newest" | "beds" | "sqft" | "score";
type StatusFilter = "all" | "active" | "pending" | "sold" | "new";

const NEIGHBORHOODS = [
  { code: "all", label: "All Neighborhoods" },
  { code: "KW-01", label: "KW-01 South Kennewick" },
  { code: "KW-02", label: "KW-02 West Kennewick" },
  { code: "KW-03", label: "KW-03 Canyon Lakes" },
  { code: "PA-01", label: "PA-01 West Pasco" },
  { code: "PA-02", label: "PA-02 Road 68 Corridor" },
  { code: "RI-01", label: "RI-01 South Richland" },
  { code: "RI-02", label: "RI-02 Bombing Range / W. Richland" },
  { code: "RI-03", label: "RI-03 George Washington Way" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest Listings" },
  { value: "beds", label: "Most Bedrooms" },
  { value: "sqft", label: "Largest" },
  { value: "score", label: "Investment Score" },
];

const CITIES = ["All Cities", "Richland", "Kennewick", "Pasco", "West Richland"];
const PAGE_SIZE = 9;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Debounce hook so search doesn't fire on every keystroke
function useDebouncedValue(value: string, ms = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function PropertiesPage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") ?? "");
  const debouncedSearch = useDebouncedValue(searchQuery);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map" | "assessment">("grid");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [cityFilter, setCityFilter] = useState("All Cities");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBeds, setMinBeds] = useState(0);
  const [page, setPage] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, sortBy, cityFilter, typeFilter, statusFilter, neighborhoodFilter, minPrice, maxPrice, minBeds]);

  // Build query params for API call
  const queryParams = new URLSearchParams();
  if (debouncedSearch) queryParams.set("search", debouncedSearch);
  if (cityFilter !== "All Cities") queryParams.set("city", cityFilter);
  if (typeFilter !== "all") queryParams.set("property_type", typeFilter);
  if (statusFilter !== "all") queryParams.set("status", statusFilter);
  if (neighborhoodFilter !== "all") queryParams.set("neighborhood", neighborhoodFilter);
  if (minPrice) queryParams.set("min_price", minPrice);
  if (maxPrice) queryParams.set("max_price", maxPrice);
  if (minBeds > 0) queryParams.set("min_beds", String(minBeds));

  const sortMap: Record<string, { sort_by: string; sort_dir: string }> = {
    "price-asc": { sort_by: "price", sort_dir: "asc" },
    "price-desc": { sort_by: "price", sort_dir: "desc" },
    newest: { sort_by: "created_at", sort_dir: "desc" },
    beds: { sort_by: "beds", sort_dir: "desc" },
    sqft: { sort_by: "sqft", sort_dir: "desc" },
    score: { sort_by: "price", sort_dir: "asc" }, // server fallback; client-side re-sort below
  };
  const sort = sortMap[sortBy] || sortMap["newest"];
  queryParams.set("sort_by", sort.sort_by);
  queryParams.set("sort_dir", sort.sort_dir);
  queryParams.set("limit", String(PAGE_SIZE));
  queryParams.set("offset", String((page - 1) * PAGE_SIZE));

  // SWR fetch from PostgreSQL API with mock fallback
  const { data, isLoading } = useSWR<{ properties: PropertyData[]; total: number; source: string }>(
    `/api/properties/search?${queryParams.toString()}`,
    fetcher,
    {
      fallbackData: { properties: MOCK_PROPERTIES.slice(0, PAGE_SIZE) as unknown as PropertyData[], total: MOCK_PROPERTIES.length, source: "mock" },
      revalidateOnFocus: false,
      dedupingInterval: 2000,
      keepPreviousData: true,
    }
  );

  const properties = data?.properties || [];
  const total = data?.total || 0;
  const isFromDB = data?.source === "database";
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Neighborhood stats for summary badge
  const { data: nbhdData } = useSWR(
    neighborhoodFilter !== "all" ? "/api/assessment/neighborhoods" : null,
    fetcher
  );
  const activeNbhd = nbhdData?.neighborhoods?.find(
    (n: { code: string }) => n.code === neighborhoodFilter
  );

  // Client-side filtering only for mock data (DB handles it server-side via SQL WHERE)
  const filteredProperties = useMemo(() => {
    if (isFromDB) return properties;

    let result = [...(MOCK_PROPERTIES as unknown as PropertyData[])];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.address.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
      );
    }
    if (cityFilter !== "All Cities") result = result.filter((p) => p.city === cityFilter);
    if (typeFilter !== "all") result = result.filter((p) => (p.property_type || p.propertyType) === typeFilter);
    if (statusFilter !== "all") result = result.filter((p) => p.status === statusFilter);
    if (minPrice) result = result.filter((p) => Number(p.price) >= parseInt(minPrice));
    if (maxPrice) result = result.filter((p) => Number(p.price) <= parseInt(maxPrice));
    if (minBeds > 0) result = result.filter((p) => p.beds >= minBeds);

    switch (sortBy) {
      case "price-asc": result.sort((a, b) => Number(a.price) - Number(b.price)); break;
      case "price-desc": result.sort((a, b) => Number(b.price) - Number(a.price)); break;
      case "beds": result.sort((a, b) => Number(b.beds) - Number(a.beds)); break;
      case "sqft": result.sort((a, b) => Number(b.sqft) - Number(a.sqft)); break;
      case "score": result.sort((a, b) => {
        const sa = scoreProperty({ price: Number(a.price), sqft: Number(a.sqft), beds: Number(a.beds), baths: Number(a.baths), city: a.city, status: a.status });
        const sb = scoreProperty({ price: Number(b.price), sqft: Number(b.sqft), beds: Number(b.beds), baths: Number(b.baths), city: b.city, status: b.status });
        return sb.total_score - sa.total_score;
      }); break;
    }
    return result.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [properties, isFromDB, debouncedSearch, sortBy, cityFilter, typeFilter, statusFilter, minPrice, maxPrice, minBeds, page]);

  // Client-side re-sort by investment score when selected (server can't sort by computed field)
  const scoreSorted = useMemo(() => {
    if (sortBy !== "score") return properties;
    return [...properties].sort((a, b) => {
      const sa = scoreProperty({ price: Number(a.price), sqft: Number(a.sqft), beds: Number(a.beds), baths: Number(a.baths), city: a.city, status: a.status });
      const sb = scoreProperty({ price: Number(b.price), sqft: Number(b.sqft), beds: Number(b.beds), baths: Number(b.baths), city: b.city, status: b.status });
      return sb.total_score - sa.total_score;
    });
  }, [properties, sortBy]);

  const displayProperties = isFromDB ? scoreSorted : filteredProperties;
  const displayTotal = isFromDB ? total : (() => {
    let result = MOCK_PROPERTIES as unknown as PropertyData[];
    if (debouncedSearch) { const q = debouncedSearch.toLowerCase(); result = result.filter((p) => p.address.toLowerCase().includes(q) || p.city.toLowerCase().includes(q)); }
    if (cityFilter !== "All Cities") result = result.filter((p) => p.city === cityFilter);
    return result.length;
  })();
  const displayPages = Math.max(1, Math.ceil(displayTotal / PAGE_SIZE));

  const activeFilterCount = [
    cityFilter !== "All Cities", typeFilter !== "all", statusFilter !== "all",
    neighborhoodFilter !== "all", minPrice !== "", maxPrice !== "", minBeds > 0,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setCityFilter("All Cities"); setTypeFilter("all"); setStatusFilter("all");
    setNeighborhoodFilter("all"); setMinPrice(""); setMaxPrice(""); setMinBeds(0); setPage(1);
  };

  const goToPage = (p: number) => {
    setPage(p);
    gridRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="grid-bg flex h-full flex-col px-6 py-6" ref={gridRef}>
      <div className="flex flex-1 flex-col gap-4">
        {/* Search + Controls */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search properties by address, city, or features..."
                className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Search properties"
              />
              <VoiceSearch
                compact
                onResult={(transcript) => setSearchQuery(transcript)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Clear search">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                showFilters || activeFilterCount > 0 ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{activeFilterCount}</span>
              )}
            </button>
            <div className="relative">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="appearance-none rounded-lg border border-border bg-card py-2.5 pl-3 pr-8 text-sm text-foreground focus:border-primary focus:outline-none" aria-label="Sort properties">
                {SORT_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <div className="flex rounded-lg border border-border">
              <button onClick={() => setViewMode("grid")} className={`rounded-l-lg p-2.5 ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`} aria-label="Grid view">
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode("list")} className={`border-l border-border p-2.5 ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`} aria-label="List view">
                <List className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode("map")} className={`border-l border-border p-2.5 ${viewMode === "map" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`} aria-label="Map view">
                <MapPin className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode("assessment")} className={`rounded-r-lg border-l border-border p-2.5 ${viewMode === "assessment" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`} aria-label="Assessment view" title="Assessment Table">
                <Scale className="h-4 w-4" />
              </button>
            </div>
            {isFromDB && (
              <a
                href="/api/properties/export"
                download
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                aria-label="Export CSV"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </a>
            )}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4 animate-slide-in">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">City</label>
                <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none">
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Type</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none">
                  <option value="all">All Types</option>
                  <option value="single_family">Single Family</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="multi_family">Multi-Family</option>
                  <option value="land">Land</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none">
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="new">New</option>
                  <option value="pending">Pending</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Neighborhood</label>
                <select value={neighborhoodFilter} onChange={(e) => setNeighborhoodFilter(e.target.value)} className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none">
                  {NEIGHBORHOODS.map((n) => <option key={n.code} value={n.code}>{n.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Min Price</label>
                <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="$0" className="w-24 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Max Price</label>
                <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="No max" className="w-24 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Min Beds</label>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setMinBeds(n)} className={`flex h-7 w-7 items-center justify-center rounded text-xs font-medium ${minBeds === n ? "bg-primary text-primary-foreground" : "border border-border bg-background text-muted-foreground hover:text-foreground"}`}>
                      {n === 0 ? "Any" : `${n}+`}
                    </button>
                  ))}
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="ml-auto text-xs font-medium text-primary hover:underline">Clear all</button>
              )}
            </div>
          )}
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {displayTotal} {displayTotal === 1 ? "property" : "properties"} found
              {debouncedSearch && <span> for &ldquo;{debouncedSearch}&rdquo;</span>}
              {displayPages > 1 && <span className="text-muted-foreground/60"> &middot; page {page} of {displayPages}</span>}
            </p>
            {isFromDB && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary">
                <Database className="h-2.5 w-2.5" /> PostgreSQL
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Avg: ${formatNumber(Math.round(displayProperties.reduce((sum, p) => sum + Number(p.price), 0) / (displayProperties.length || 1)))}
          </p>
        </div>

        {/* Neighborhood summary badge */}
        {activeNbhd && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
            <span className="font-mono text-xs font-bold text-primary">{activeNbhd.code}</span>
            <span className="text-xs font-medium text-foreground">{activeNbhd.name}</span>
            <span className="text-[10px] text-muted-foreground">{activeNbhd.city}</span>
            <span className="mx-1 text-border">|</span>
            <span className="text-[10px] text-muted-foreground">Median Ratio:</span>
            <span className={cn(
              "font-mono text-xs font-bold",
              (activeNbhd.median_ratio ?? 0) >= 0.9 ? "text-[hsl(var(--success))]" : (activeNbhd.median_ratio ?? 0) >= 0.8 ? "text-[hsl(var(--warning))]" : "text-destructive"
            )}>
              {activeNbhd.median_ratio?.toFixed(4)}
            </span>
            <span className="mx-1 text-border">|</span>
            <span className="text-[10px] text-muted-foreground">COD:</span>
            <span className={cn(
              "font-mono text-xs font-bold",
              (activeNbhd.cod ?? 0) <= 15 ? "text-[hsl(var(--success))]" : "text-destructive"
            )}>
              {activeNbhd.cod?.toFixed(2)}
            </span>
            <span className="mx-1 text-border">|</span>
            <span className="text-[10px] text-muted-foreground">{activeNbhd.count} properties</span>
            <Link href="/assessment" className="ml-auto text-[10px] font-medium text-primary hover:underline">
              Full Study
            </Link>
          </div>
        )}

        {/* Property grid/list */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => <PropertyCardSkeleton key={i} />)}
          </div>
        ) : displayProperties.length > 0 ? (
            viewMode === "map" ? (
              <PropertyMap
                properties={displayProperties.map((p: PropertyData) => ({
                  ...p,
                  price: Number(p.price),
                  beds: Number(p.beds),
                  baths: Number(p.baths),
                  sqft: Number(p.sqft),
                  latitude: Number(p.latitude),
                  longitude: Number(p.longitude),
                }))}
                className="h-[500px]"
              />
            ) : viewMode === "assessment" ? (
              <div className="overflow-x-auto rounded-lg border border-border bg-card">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-2.5">Address</th>
                      <th className="px-3 py-2.5">Nbhd</th>
                      <th className="px-3 py-2.5 text-right">Sale Price</th>
                      <th className="px-3 py-2.5 text-right">Assessed</th>
                      <th className="px-3 py-2.5 text-right">Land</th>
                      <th className="px-3 py-2.5 text-right">Impr.</th>
                      <th className="px-3 py-2.5 text-right">Ratio</th>
                      <th className="px-3 py-2.5 text-center">Grade</th>
                      <th className="px-3 py-2.5 text-center">Condition</th>
                      <th className="px-3 py-2.5">Parcel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayProperties.map((p: PropertyData) => {
                      const assessed = Number(p.assessed_value || 0);
                      const sale = Number(p.sale_price || p.price || 0);
                      const land = Number(p.land_value || 0);
                      const impr = Number(p.improvement_value || 0);
                      const ratio = sale > 0 && assessed > 0 ? assessed / sale : 0;
                      const grade = String(p.grade || "--");
                      const condition = String(p.condition_code || "--");
                      const parcel = String(p.parcel_number || "--");
                      const nbhd = String(p.neighborhood_code || "--");
                      return (
                        <tr
                          key={p.id}
                          className="border-b border-border/50 transition-colors hover:bg-accent/20 cursor-pointer"
                          onClick={() => window.location.href = `/properties/${p.id}`}
                        >
                          <td className="px-3 py-2.5">
                            <div className="font-medium text-foreground">{p.address}</div>
                            <div className="text-[10px] text-muted-foreground">{p.city}</div>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[11px] font-bold text-primary">{nbhd}</td>
                          <td className="px-3 py-2.5 text-right text-muted-foreground">${formatNumber(sale)}</td>
                          <td className="px-3 py-2.5 text-right font-medium text-foreground">${formatNumber(assessed)}</td>
                          <td className="px-3 py-2.5 text-right text-muted-foreground">${formatNumber(land)}</td>
                          <td className="px-3 py-2.5 text-right text-muted-foreground">${formatNumber(impr)}</td>
                          <td className={`px-3 py-2.5 text-right font-mono font-bold ${ratio >= 0.9 ? "text-[hsl(var(--success))]" : ratio >= 0.8 ? "text-[hsl(var(--warning))]" : ratio > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                            {ratio > 0 ? ratio.toFixed(4) : "--"}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                              grade.startsWith("A") ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]"
                                : grade.startsWith("B") ? "bg-primary/15 text-primary"
                                : "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]"
                            }`}>{grade}</span>
                          </td>
                          <td className="px-3 py-2.5 text-center text-muted-foreground">{condition}</td>
                          <td className="px-3 py-2.5 font-mono text-[10px] text-muted-foreground">{parcel}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-3"}>
                {displayProperties.map((property: PropertyData) => (
                  <PropertyCard key={property.id} property={property} view={viewMode as "grid" | "list"} />
                ))}
              </div>
            )
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card py-16">
            <Search className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No properties match your filters</p>
            <button onClick={clearFilters} className="text-xs font-medium text-primary hover:underline">Clear all filters</button>
          </div>
        )}

        {/* Pagination */}
        {displayPages > 1 && (
          <nav className="flex items-center justify-center gap-1 py-4" aria-label="Pagination">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: displayPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                  p === page
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:bg-card hover:text-foreground"
                }`}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= displayPages}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
