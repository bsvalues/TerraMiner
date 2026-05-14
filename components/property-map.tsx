"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn, formatNumber } from "@/lib/utils";
import { scoreProperty } from "@/lib/terra-engine";
import { X, ExternalLink, Bed, Bath, Maximize } from "lucide-react";

// Dynamically import leaflet to avoid SSR issues
let L: typeof import("leaflet") | null = null;

interface MapProperty {
  id: string;
  address: string;
  city: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  status: string;
  latitude: number;
  longitude: number;
  year_built?: number;
  yearBuilt?: number;
  lot_size?: number;
  lotSize?: number;
  property_type?: string;
  propertyType?: string;
  grade?: string;
  condition_code?: string;
  assessed_value?: number;
  sale_price?: number;
  neighborhood_code?: string;
}

export function PropertyMap({
  properties,
  className,
}: {
  properties: MapProperty[];
  className?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [selected, setSelected] = useState<MapProperty | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamic import of leaflet
    Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([leaflet]) => {
      L = leaflet.default || leaflet;
      if (!mapRef.current || mapInstanceRef.current) return;

      // Center on Tri-Cities, WA
      const map = L.map(mapRef.current, {
        center: [46.24, -119.17],
        zoom: 12,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      setReady(true);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Add markers when properties or map changes
  useEffect(() => {
    if (!ready || !mapInstanceRef.current || !L) return;
    const map = mapInstanceRef.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if ((layer as L.Marker).getLatLng) {
        map.removeLayer(layer);
      }
    });

    // Re-add tile layer (was removed above)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    const validProps = properties.filter(
      (p) => p.latitude && p.longitude && !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude))
    );

    if (validProps.length === 0) return;

    validProps.forEach((property) => {
      const score = scoreProperty({
        price: Number(property.price),
        sqft: Number(property.sqft),
        beds: Number(property.beds),
        baths: Number(property.baths),
        city: property.city,
        status: property.status,
        grade: property.grade,
        condition_code: property.condition_code,
        assessed_value: property.assessed_value ? Number(property.assessed_value) : undefined,
        sale_price: property.sale_price ? Number(property.sale_price) : undefined,
        neighborhood_code: property.neighborhood_code,
      });

      const gradeColor =
        score.investment_grade === "A" ? "#22c55e" :
        score.investment_grade === "B" ? "#06b6d4" :
        score.investment_grade === "C" ? "#eab308" :
        "#ef4444";

      const icon = L!.divIcon({
        html: `<div style="
          background: ${gradeColor};
          color: #000;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 11px;
          border: 2px solid rgba(0,0,0,0.3);
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          cursor: pointer;
        ">${score.investment_grade}</div>`,
        className: "custom-marker",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L!.marker([Number(property.latitude), Number(property.longitude)], { icon }).addTo(map);
      marker.on("click", () => setSelected(property));
    });

    // Fit bounds to all markers
    if (validProps.length > 1) {
      const bounds = L.latLngBounds(
        validProps.map((p) => [Number(p.latitude), Number(p.longitude)] as [number, number])
      );
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [properties, ready]);

  const selectedScore = selected
    ? scoreProperty({
        price: Number(selected.price),
        sqft: Number(selected.sqft),
        beds: Number(selected.beds),
        baths: Number(selected.baths),
        city: selected.city,
        status: selected.status,
        grade: selected.grade,
        condition_code: selected.condition_code,
        assessed_value: selected.assessed_value ? Number(selected.assessed_value) : undefined,
        sale_price: selected.sale_price ? Number(selected.sale_price) : undefined,
        neighborhood_code: selected.neighborhood_code,
      })
    : null;

  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-border", className)}>
      <div ref={mapRef} className="h-full w-full" style={{ minHeight: 400 }} />

      {/* Selected property popup */}
      {selected && selectedScore && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] rounded-lg border border-primary/30 bg-card/95 p-3 shadow-xl backdrop-blur-sm sm:left-auto sm:right-3 sm:w-72">
          <button
            onClick={() => setSelected(null)}
            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            aria-label="Close popup"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-start gap-2.5">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black",
                selectedScore.investment_grade === "A" ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]" :
                selectedScore.investment_grade === "B" ? "bg-primary/15 text-primary" :
                "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]"
              )}
            >
              {selectedScore.investment_grade}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                ${formatNumber(Number(selected.price))}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {selected.address}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {selected.city}, WA
              </p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{selected.beds}</span>
            <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{selected.baths}</span>
            <span className="flex items-center gap-1"><Maximize className="h-3 w-3" />{formatNumber(Number(selected.sqft))}</span>
            <span className="ml-auto font-bold text-primary">{selectedScore.total_score}/100</span>
          </div>
          <Link
            href={`/properties/${selected.id}`}
            className="mt-2 flex items-center justify-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
          >
            View Details <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Map legend */}
      <div className="absolute left-3 top-3 z-[1000] rounded-md bg-card/90 px-2.5 py-1.5 text-[9px] backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[#22c55e]" /> A</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[#06b6d4]" /> B</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[#eab308]" /> C</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ef4444]" /> D</span>
        </div>
      </div>
    </div>
  );
}
