"use client";

import { useState, useMemo } from "react";
import { MOCK_PROPERTIES, type Property } from "@/lib/mock-properties";
import { PropertyCard } from "@/components/property-card";
import { formatNumber } from "@/lib/utils";
import {
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
  ChevronDown,
} from "lucide-react";

type SortKey = "price-asc" | "price-desc" | "newest" | "beds" | "sqft";
type PropertyType = Property["propertyType"] | "all";
type StatusFilter = Property["status"] | "all";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest Listings" },
  { value: "beds", label: "Most Bedrooms" },
  { value: "sqft", label: "Largest" },
];

const CITIES = ["All Cities", "Richland", "Kennewick", "Pasco", "West Richland"];

export default function PropertiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [cityFilter, setCityFilter] = useState("All Cities");
  const [typeFilter, setTypeFilter] = useState<PropertyType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBeds, setMinBeds] = useState(0);

  // Filter and sort logic -- the properties go through a filter like coffee but for houses
  const filteredProperties = useMemo(() => {
    let result = [...MOCK_PROPERTIES];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.address.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.features.some((f) => f.toLowerCase().includes(q))
      );
    }

    // City
    if (cityFilter !== "All Cities") {
      result = result.filter((p) => p.city === cityFilter);
    }

    // Type
    if (typeFilter !== "all") {
      result = result.filter((p) => p.propertyType === typeFilter);
    }

    // Status
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Price
    if (minPrice) {
      result = result.filter((p) => p.price >= parseInt(minPrice));
    }
    if (maxPrice) {
      result = result.filter((p) => p.price <= parseInt(maxPrice));
    }

    // Beds
    if (minBeds > 0) {
      result = result.filter((p) => p.beds >= minBeds);
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        result.sort((a, b) => a.daysOnMarket - b.daysOnMarket);
        break;
      case "beds":
        result.sort((a, b) => b.beds - a.beds);
        break;
      case "sqft":
        result.sort((a, b) => b.sqft - a.sqft);
        break;
    }

    return result;
  }, [searchQuery, sortBy, cityFilter, typeFilter, statusFilter, minPrice, maxPrice, minBeds]);

  const activeFilterCount = [
    cityFilter !== "All Cities",
    typeFilter !== "all",
    statusFilter !== "all",
    minPrice !== "",
    maxPrice !== "",
    minBeds > 0,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setCityFilter("All Cities");
    setTypeFilter("all");
    setStatusFilter("all");
    setMinPrice("");
    setMaxPrice("");
    setMinBeds(0);
  };

  return (
    <div className="grid-bg min-h-full px-6 py-6">
      <div className="flex flex-col gap-4">
        {/* Search + Controls -- the search bar is a question asking machine */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search properties by address, city, or features..."
                className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Search properties"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                showFilters || activeFilterCount > 0
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="appearance-none rounded-lg border border-border bg-card py-2.5 pl-3 pr-8 text-sm text-foreground focus:border-primary focus:outline-none"
                aria-label="Sort properties"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* View toggle */}
            <div className="flex rounded-lg border border-border">
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-l-lg p-2.5 ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-r-lg border-l border-border p-2.5 ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filter panel -- these filters are like tiny judges that decide which houses survive */}
          {showFilters && (
            <div className="animate-slide-in flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">City</label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as PropertyType)}
                  className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="single-family">Single Family</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="multi-family">Multi-Family</option>
                  <option value="land">Land</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="new">New</option>
                  <option value="pending">Pending</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Min Price</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="$0"
                  className="w-24 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Max Price</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="No max"
                  className="w-24 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Min Beds</label>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMinBeds(n)}
                      className={`flex h-7 w-7 items-center justify-center rounded text-xs font-medium ${
                        minBeds === n
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {n === 0 ? "Any" : `${n}+`}
                    </button>
                  ))}
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="ml-auto text-xs font-medium text-primary hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {filteredProperties.length} {filteredProperties.length === 1 ? "property" : "properties"} found
            {searchQuery && <span> for &ldquo;{searchQuery}&rdquo;</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            Avg: ${formatNumber(Math.round(filteredProperties.reduce((sum, p) => sum + p.price, 0) / (filteredProperties.length || 1)))}
          </p>
        </div>

        {/* Property grid/list */}
        {filteredProperties.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                : "flex flex-col gap-3"
            }
          >
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} view={viewMode} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card py-16">
            <Search className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No properties match your filters</p>
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
