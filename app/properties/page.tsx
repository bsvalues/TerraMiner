"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { MOCK_PROPERTIES } from "@/lib/mock-properties";
import { PropertyCard, type PropertyData } from "@/components/property-card";
import { PropertyCardSkeleton } from "@/components/skeleton";
import { formatNumber } from "@/lib/utils";
import { VoiceSearch } from "@/components/voice-search";
import {
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
  ChevronDown,
  Database,
} from "lucide-react";

type SortKey = "price-asc" | "price-desc" | "newest" | "beds" | "sqft";
type StatusFilter = "all" | "active" | "pending" | "sold" | "new";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest Listings" },
  { value: "beds", label: "Most Bedrooms" },
  { value: "sqft", label: "Largest" },
];

const CITIES = ["All Cities", "Richland", "Kennewick", "Pasco", "West Richland"];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function PropertiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [cityFilter, setCityFilter] = useState("All Cities");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBeds, setMinBeds] = useState(0);

  // Build query params for API call
  const queryParams = new URLSearchParams();
  if (searchQuery) queryParams.set("search", searchQuery);
  if (cityFilter !== "All Cities") queryParams.set("city", cityFilter);
  if (typeFilter !== "all") queryParams.set("property_type", typeFilter);
  if (statusFilter !== "all") queryParams.set("status", statusFilter);
  if (minPrice) queryParams.set("min_price", minPrice);
  if (maxPrice) queryParams.set("max_price", maxPrice);
  if (minBeds > 0) queryParams.set("min_beds", String(minBeds));

  const sortMap: Record<SortKey, { sort_by: string; sort_dir: string }> = {
    "price-asc": { sort_by: "price", sort_dir: "asc" },
    "price-desc": { sort_by: "price", sort_dir: "desc" },
    newest: { sort_by: "created_at", sort_dir: "desc" },
    beds: { sort_by: "beds", sort_dir: "desc" },
    sqft: { sort_by: "sqft", sort_dir: "desc" },
  };
  const sort = sortMap[sortBy];
  queryParams.set("sort_by", sort.sort_by);
  queryParams.set("sort_dir", sort.sort_dir);

  // SWR fetch from PostgreSQL API with mock fallback
  const { data, isLoading } = useSWR<{ properties: PropertyData[]; total: number; source: string }>(
    `/api/properties/search?${queryParams.toString()}`,
    fetcher,
    {
      fallbackData: { properties: MOCK_PROPERTIES as unknown as PropertyData[], total: MOCK_PROPERTIES.length, source: "mock" },
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  const properties = data?.properties || [];
  const isFromDB = data?.source === "database";

  // Client-side filtering for mock data (DB handles it server-side)
  const filteredProperties = useMemo(() => {
    if (isFromDB) return properties;

    let result = [...properties];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
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
    }
    return result;
  }, [properties, isFromDB, searchQuery, sortBy, cityFilter, typeFilter, statusFilter, minPrice, maxPrice, minBeds]);

  const activeFilterCount = [
    cityFilter !== "All Cities", typeFilter !== "all", statusFilter !== "all",
    minPrice !== "", maxPrice !== "", minBeds > 0,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setCityFilter("All Cities"); setTypeFilter("all"); setStatusFilter("all");
    setMinPrice(""); setMaxPrice(""); setMinBeds(0);
  };

  return (
    <div className="grid-bg min-h-full px-6 py-6">
      <div className="flex flex-col gap-4">
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
              <button onClick={() => setViewMode("list")} className={`rounded-r-lg border-l border-border p-2.5 ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`} aria-label="List view">
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
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
              {filteredProperties.length} {filteredProperties.length === 1 ? "property" : "properties"} found
              {searchQuery && <span> for &ldquo;{searchQuery}&rdquo;</span>}
            </p>
            {isFromDB && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary">
                <Database className="h-2.5 w-2.5" /> PostgreSQL
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Avg: ${formatNumber(Math.round(filteredProperties.reduce((sum, p) => sum + Number(p.price), 0) / (filteredProperties.length || 1)))}
          </p>
        </div>

        {/* Property grid/list */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-3"}>
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} view={viewMode} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card py-16">
            <Search className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No properties match your filters</p>
            <button onClick={clearFilters} className="text-xs font-medium text-primary hover:underline">Clear all filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
