"use client";

import useSWR from "swr";
import Link from "next/link";
import { cn, formatNumber } from "@/lib/utils";
import { scoreProperty } from "@/lib/terra-engine";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
} from "lucide-react";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface PropertyComparisonProps {
  currentPropertyId: string;
  city: string;
  currentPrice: number;
}

export function PropertyComparison({
  currentPropertyId,
  city,
  currentPrice,
}: PropertyComparisonProps) {
  const [expanded, setExpanded] = useState(false);

  const { data } = useSWR(
    `/api/properties/search?city=${encodeURIComponent(city)}&limit=20&sort_by=price&sort_dir=asc`,
    fetcher
  );

  const properties = (data?.properties ?? [])
    .filter((p: { id: string }) => String(p.id) !== String(currentPropertyId))
    .slice(0, 4);

  if (properties.length === 0) return null;

  const scored = properties.map(
    (p: {
      id: string;
      address: string;
      price: number;
      beds: number;
      baths: number;
      sqft: number;
      year_built?: number;
      yearBuilt?: number;
      lot_size?: number;
      lotSize?: number;
      city: string;
      status: string;
    }) => {
      const s = scoreProperty({
        price: Number(p.price),
        sqft: Number(p.sqft),
        beds: Number(p.beds),
        baths: Number(p.baths),
        year_built: p.year_built ?? p.yearBuilt,
        lot_size: p.lot_size ?? p.lotSize,
        city: p.city,
        status: p.status,
      });
      return { ...p, score: s };
    }
  );

  const gradeColor: Record<string, string> = {
    A: "text-[hsl(var(--success))]",
    B: "text-primary",
    C: "text-[hsl(var(--warning))]",
    D: "text-destructive",
    F: "text-destructive",
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Nearby Comparables
          </span>
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            {scored.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border px-5 pb-4 pt-3">
          {/* Table header */}
          <div className="mb-2 grid grid-cols-[1fr_80px_60px_60px_60px_50px] gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <span>Address</span>
            <span className="text-right">Price</span>
            <span className="text-center">Beds</span>
            <span className="text-center">Baths</span>
            <span className="text-center">Sqft</span>
            <span className="text-center">Score</span>
          </div>

          {/* Rows */}
          {scored.map(
            (comp: {
              id: string;
              address: string;
              price: number;
              beds: number;
              baths: number;
              sqft: number;
              score: {
                total_score: number;
                investment_grade: string;
              };
            }) => {
              const priceDiff = Number(comp.price) - currentPrice;
              const priceDiffPct =
                currentPrice > 0
                  ? ((priceDiff / currentPrice) * 100).toFixed(0)
                  : "0";
              return (
                <Link
                  key={comp.id}
                  href={`/properties/${comp.id}`}
                  className="grid grid-cols-[1fr_80px_60px_60px_60px_50px] items-center gap-2 rounded-md px-1 py-2 transition-colors hover:bg-accent/50"
                >
                  <span className="truncate text-xs text-foreground">
                    {comp.address}
                  </span>
                  <span className="text-right text-xs font-medium text-foreground">
                    ${formatNumber(comp.price)}
                    <span
                      className={cn(
                        "ml-1 text-[9px]",
                        priceDiff > 0
                          ? "text-destructive"
                          : "text-[hsl(var(--success))]"
                      )}
                    >
                      {priceDiff > 0 ? "+" : ""}
                      {priceDiffPct}%
                    </span>
                  </span>
                  <span className="text-center text-xs text-muted-foreground">
                    {comp.beds}
                  </span>
                  <span className="text-center text-xs text-muted-foreground">
                    {comp.baths}
                  </span>
                  <span className="text-center text-xs text-muted-foreground">
                    {formatNumber(comp.sqft)}
                  </span>
                  <span
                    className={cn(
                      "text-center text-xs font-bold",
                      gradeColor[comp.score.investment_grade] || gradeColor.C
                    )}
                  >
                    {comp.score.investment_grade}
                  </span>
                </Link>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
