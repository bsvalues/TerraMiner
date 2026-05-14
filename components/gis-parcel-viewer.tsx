"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  MapPin, Layers, ZoomIn, ZoomOut, Maximize2, Ruler,
  Building2, Trees, Droplets, Mountain, ChevronDown,
  X, Square, Info,
} from "lucide-react";

// ── types ──────────────────────────────────────────────────────────────────

interface Parcel {
  id: string;
  parcelNumber: string;
  address: string;
  owner: string;
  assessedValue: number;
  landValue: number;
  acreage: number;
  zoning: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  selected?: boolean;
}

interface GISLayer {
  id: string;
  label: string;
  icon: React.ElementType;
  enabled: boolean;
  color: string;
}

type MapMode = "satellite" | "street" | "terrain" | "assessment";

interface GISParcelViewerProps {
  propertyId?: string;
  className?: string;
}

// ── parcel data for Richland WA ────────────────────────────────────────────

function generateParcels(highlightId?: string): Parcel[] {
  const parcels: Parcel[] = [
    { id: "p1", parcelNumber: "1-0455-100-0001-000", address: "1425 Columbia Park Trail", owner: "Smith, John & Mary", assessedValue: 425000, landValue: 85000, acreage: 0.23, zoning: "R-1", x: 120, y: 85, width: 70, height: 55, color: "" },
    { id: "p2", parcelNumber: "1-0455-100-0002-000", address: "1523 Columbia Park Trail", owner: "Johnson, Robert", assessedValue: 392500, landValue: 78000, acreage: 0.21, zoning: "R-1", x: 200, y: 85, width: 65, height: 55, color: "" },
    { id: "p3", parcelNumber: "1-0455-100-0003-000", address: "1601 Columbia Park Trail", owner: "Williams, Patricia", assessedValue: 378500, landValue: 75000, acreage: 0.20, zoning: "R-1", x: 275, y: 85, width: 65, height: 55, color: "" },
    { id: "p4", parcelNumber: "1-0455-100-0004-000", address: "555 Jadwin Ave", owner: "Davis, Michael", assessedValue: 295000, landValue: 62000, acreage: 0.18, zoning: "R-2", x: 120, y: 155, width: 70, height: 50, color: "" },
    { id: "p5", parcelNumber: "1-0455-100-0005-000", address: "601 Jadwin Ave", owner: "Anderson, James", assessedValue: 310000, landValue: 65000, acreage: 0.19, zoning: "R-2", x: 200, y: 155, width: 65, height: 50, color: "" },
    { id: "p6", parcelNumber: "1-0455-200-0001-000", address: "2891 Bombing Range Rd", owner: "Wilson, David", assessedValue: 225000, landValue: 48000, acreage: 0.32, zoning: "R-1-12", x: 350, y: 85, width: 80, height: 60, color: "" },
    { id: "p7", parcelNumber: "1-0455-200-0002-000", address: "2950 Bombing Range Rd", owner: "Martinez, Carlos", assessedValue: 198000, landValue: 42000, acreage: 0.28, zoning: "R-1-12", x: 350, y: 155, width: 80, height: 55, color: "" },
    { id: "p8", parcelNumber: "1-0455-300-0001-000", address: "3100 Horn Rapids Rd", owner: "Thompson, Sarah", assessedValue: 445000, landValue: 95000, acreage: 0.35, zoning: "R-1", x: 445, y: 85, width: 75, height: 65, color: "" },
    { id: "p9", parcelNumber: "1-0455-300-0002-000", address: "3200 Horn Rapids Rd", owner: "Garcia, Maria", assessedValue: 520000, landValue: 110000, acreage: 0.42, zoning: "R-1", x: 445, y: 160, width: 75, height: 55, color: "" },
    { id: "p10", parcelNumber: "1-0460-100-0001-000", address: "1100 Meadow Springs Dr", owner: "Lee, Andrew", assessedValue: 675000, landValue: 145000, acreage: 0.48, zoning: "R-1", x: 120, y: 225, width: 85, height: 60, color: "" },
    { id: "p11", parcelNumber: "1-0460-100-0002-000", address: "1200 Meadow Springs Dr", owner: "Clark, Jennifer", assessedValue: 580000, landValue: 125000, acreage: 0.38, zoning: "R-1", x: 215, y: 225, width: 75, height: 60, color: "" },
    { id: "p12", parcelNumber: "1-0460-100-0003-000", address: "850 Island View Dr", owner: "Pacific NW Holdings LLC", assessedValue: 895000, landValue: 215000, acreage: 0.75, zoning: "C-2", x: 300, y: 225, width: 90, height: 65, color: "" },
    { id: "p13", parcelNumber: "1-0460-200-0001-000", address: "4500 Westcliffe Blvd", owner: "Taylor, Richard", assessedValue: 362000, landValue: 72000, acreage: 0.22, zoning: "R-1", x: 405, y: 225, width: 70, height: 55, color: "" },
    { id: "p14", parcelNumber: "1-0460-200-0002-000", address: "4600 Westcliffe Blvd", owner: "Brown, Linda", assessedValue: 345000, landValue: 68000, acreage: 0.21, zoning: "R-1", x: 485, y: 225, width: 65, height: 55, color: "" },
    { id: "p15", parcelNumber: "1-0455-100-0006-000", address: "700 Jadwin Ave", owner: "Rivera, Carmen", assessedValue: 415000, landValue: 88000, acreage: 0.24, zoning: "R-2", x: 275, y: 155, width: 65, height: 50, color: "" },
    { id: "p16", parcelNumber: "1-0460-300-0001-000", address: "5100 S Richland Loop", owner: "Kim, Susan", assessedValue: 189000, landValue: 38000, acreage: 0.15, zoning: "R-3", x: 120, y: 305, width: 60, height: 45, color: "" },
    { id: "p17", parcelNumber: "1-0460-300-0002-000", address: "5200 S Richland Loop", owner: "Patel, Raj", assessedValue: 205000, landValue: 41000, acreage: 0.17, zoning: "R-3", x: 190, y: 305, width: 60, height: 45, color: "" },
    { id: "p18", parcelNumber: "1-0460-300-0003-000", address: "5300 S Richland Loop", owner: "Nguyen, Tran", assessedValue: 215000, landValue: 43000, acreage: 0.18, zoning: "R-3", x: 260, y: 305, width: 65, height: 45, color: "" },
  ];

  // Color by assessed value
  const maxVal = Math.max(...parcels.map((p) => p.assessedValue));
  const minVal = Math.min(...parcels.map((p) => p.assessedValue));
  return parcels.map((p) => {
    const ratio = (p.assessedValue - minVal) / (maxVal - minVal);
    const r = Math.round(59 + (1 - ratio) * 140);
    const g = Math.round(130 + ratio * 70);
    const b = Math.round(246 - ratio * 100);
    return {
      ...p,
      color: `rgb(${r},${g},${b})`,
      selected: highlightId ? p.address.toLowerCase().includes("1425") : false,
    };
  });
}

// ── component ──────────────────────────────────────────────────────────────

export function GISParcelViewer({ propertyId, className = "" }: GISParcelViewerProps) {
  const [parcels] = useState<Parcel[]>(() => generateParcels(propertyId));
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(
    propertyId ? parcels.find((p) => p.selected) || null : null
  );
  const [mapMode, setMapMode] = useState<MapMode>("assessment");
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [measureMode, setMeasureMode] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const [layers, setLayers] = useState<GISLayer[]>([
    { id: "parcels", label: "Parcel Boundaries", icon: Square, enabled: true, color: "rgb(14,165,233)" },
    { id: "buildings", label: "Building Footprints", icon: Building2, enabled: true, color: "rgb(100,116,139)" },
    { id: "water", label: "Water Features", icon: Droplets, enabled: true, color: "rgb(96,165,250)" },
    { id: "vegetation", label: "Vegetation", icon: Trees, enabled: false, color: "rgb(34,197,94)" },
    { id: "contours", label: "Contour Lines", icon: Mountain, enabled: false, color: "rgb(168,85,247)" },
  ]);

  const toggleLayer = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l))
    );
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as Element).tagName === "rect") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  }, [panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z * 1.3, 4)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z / 1.3, 0.5)), []);
  const handleResetView = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (svgRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        if (e.deltaY < 0) {
          setZoom((z) => Math.min(z * 1.1, 4));
        } else {
          setZoom((z) => Math.max(z / 1.1, 0.5));
        }
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  const stats = useMemo(() => ({
    totalParcels: parcels.length,
    totalValue: parcels.reduce((s, p) => s + p.assessedValue, 0),
    avgValue: Math.round(parcels.reduce((s, p) => s + p.assessedValue, 0) / parcels.length),
    totalAcreage: parcels.reduce((s, p) => s + p.acreage, 0),
  }), [parcels]);

  const modeStyles: Record<MapMode, { bg: string; grid: string; label: string }> = {
    satellite: { bg: "bg-emerald-950", grid: "rgba(255,255,255,0.05)", label: "Satellite" },
    street: { bg: "bg-slate-100", grid: "rgba(0,0,0,0.06)", label: "Street" },
    terrain: { bg: "bg-amber-50", grid: "rgba(139,92,42,0.08)", label: "Terrain" },
    assessment: { bg: "bg-slate-900", grid: "rgba(255,255,255,0.04)", label: "Assessment" },
  };

  const currentStyle = modeStyles[mapMode];
  const isDark = mapMode === "satellite" || mapMode === "assessment";

  const fmt = (v: number) => v >= 1000000
    ? `$${(v / 1000000).toFixed(2)}M`
    : `$${(v / 1000).toFixed(0)}K`;

  return (
    <div className={`rounded-2xl border border-border bg-card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-500/10">
            <MapPin className="w-5 h-5 text-sky-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">GIS Parcel Viewer</h3>
            <p className="text-xs text-muted-foreground">
              {stats.totalParcels} parcels | {stats.totalAcreage.toFixed(1)} acres | {fmt(stats.totalValue)} total assessed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {(["assessment", "satellite", "street", "terrain"] as MapMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setMapMode(mode)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                mapMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {modeStyles[mode].label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Area */}
      <div className="relative flex">
        {/* SVG Map */}
        <div className={`relative flex-1 h-[480px] ${currentStyle.bg} overflow-hidden`}>
          <svg
            ref={svgRef}
            viewBox="0 0 600 380"
            className="w-full h-full select-none"
            style={{ cursor: isPanning ? "grabbing" : "grab" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <defs>
              <pattern id="gis-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke={currentStyle.grid} strokeWidth="0.5" />
              </pattern>
              <filter id="gis-glow">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                <feOffset dx="0" dy="0" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g transform={`translate(${panOffset.x / 2},${panOffset.y / 2}) scale(${zoom})`}>
              {/* Grid */}
              <rect width="600" height="380" fill="url(#gis-grid)" />

              {/* Water features */}
              {layers.find((l) => l.id === "water")?.enabled && (
                <g opacity="0.6">
                  <path
                    d="M 0 30 Q 150 15 300 25 Q 450 35 600 20 L 600 0 L 0 0 Z"
                    fill="rgba(96,165,250,0.3)"
                    stroke="rgba(96,165,250,0.5)"
                    strokeWidth="1"
                  />
                  <text x="300" y="16" textAnchor="middle" fontSize="8" fill="rgba(96,165,250,0.8)" fontWeight="500">
                    Columbia River
                  </text>
                </g>
              )}

              {/* Street grid */}
              <g opacity="0.25" stroke={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.15)"} strokeWidth="1.5" strokeDasharray="4,2">
                <line x1="110" y1="40" x2="110" y2="370" />
                <line x1="340" y1="40" x2="340" y2="370" />
                <line x1="440" y1="40" x2="440" y2="370" />
                <line x1="60" y1="80" x2="560" y2="80" />
                <line x1="60" y1="215" x2="560" y2="215" />
                <line x1="60" y1="295" x2="560" y2="295" />
              </g>

              {/* Street labels */}
              <g fontSize="6" fill={isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)"} fontWeight="400">
                <text x="225" y="76" textAnchor="middle">Columbia Park Trail</text>
                <text x="225" y="211" textAnchor="middle">Jadwin Ave</text>
                <text x="107" y="200" textAnchor="end" transform="rotate(-90 107 200)">Bombing Range Rd</text>
                <text x="350" y="200" transform="rotate(-90 350 200)">Horn Rapids Rd</text>
                <text x="225" y="291" textAnchor="middle">Meadow Springs Dr</text>
              </g>

              {/* Parcels */}
              {layers.find((l) => l.id === "parcels")?.enabled &&
                parcels.map((parcel) => {
                  const isSelected = selectedParcel?.id === parcel.id;
                  return (
                    <g key={parcel.id} onClick={() => setSelectedParcel(isSelected ? null : parcel)} style={{ cursor: "pointer" }}>
                      <rect
                        x={parcel.x}
                        y={parcel.y}
                        width={parcel.width}
                        height={parcel.height}
                        rx="2"
                        fill={isSelected ? "rgba(14,165,233,0.5)" : mapMode === "assessment" ? parcel.color : "rgba(14,165,233,0.15)"}
                        fillOpacity={mapMode === "assessment" ? 0.7 : 0.4}
                        stroke={isSelected ? "rgb(14,165,233)" : isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"}
                        strokeWidth={isSelected ? 2 : 0.8}
                        filter={isSelected ? "url(#gis-glow)" : undefined}
                      />
                      {/* Building footprint */}
                      {layers.find((l) => l.id === "buildings")?.enabled && (
                        <rect
                          x={parcel.x + parcel.width * 0.15}
                          y={parcel.y + parcel.height * 0.15}
                          width={parcel.width * 0.6}
                          height={parcel.height * 0.5}
                          rx="1"
                          fill={isDark ? "rgba(148,163,184,0.3)" : "rgba(100,116,139,0.2)"}
                          stroke={isDark ? "rgba(148,163,184,0.5)" : "rgba(100,116,139,0.3)"}
                          strokeWidth="0.5"
                          pointerEvents="none"
                        />
                      )}
                      {/* Value label */}
                      {zoom >= 0.9 && (
                        <text
                          x={parcel.x + parcel.width / 2}
                          y={parcel.y + parcel.height - 6}
                          textAnchor="middle"
                          fontSize={zoom > 1.5 ? "6" : "7"}
                          fill={isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)"}
                          fontWeight="600"
                          pointerEvents="none"
                        >
                          {fmt(parcel.assessedValue)}
                        </text>
                      )}
                    </g>
                  );
                })}

              {/* Vegetation overlay */}
              {layers.find((l) => l.id === "vegetation")?.enabled && (
                <g opacity="0.3">
                  {[{x:80,y:100},{x:540,y:120},{x:80,y:280},{x:540,y:300},{x:335,y:320}].map((pos, i) => (
                    <circle key={i} cx={pos.x} cy={pos.y} r="12" fill="rgba(34,197,94,0.4)" />
                  ))}
                </g>
              )}

              {/* Contour lines */}
              {layers.find((l) => l.id === "contours")?.enabled && (
                <g opacity="0.2" stroke="rgba(168,85,247,0.5)" strokeWidth="0.5" fill="none">
                  <path d="M 50 370 Q 200 340 400 355 Q 550 365 600 350" />
                  <path d="M 50 350 Q 200 320 400 335 Q 550 345 600 330" />
                  <path d="M 50 330 Q 200 300 400 315 Q 550 325 600 310" />
                </g>
              )}

              {/* Compass */}
              <g transform="translate(560,345)">
                <circle r="14" fill={isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.8)"} stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"} strokeWidth="0.5" />
                <text y="-3" textAnchor="middle" fontSize="7" fontWeight="bold" fill={isDark ? "#fff" : "#000"}>N</text>
                <path d="M 0 -9 L 2 -3 L -2 -3 Z" fill="rgb(239,68,68)" />
                <path d="M 0 9 L 2 3 L -2 3 Z" fill={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"} />
              </g>

              {/* Scale bar */}
              <g transform="translate(30,360)">
                <line x1="0" y1="0" x2="60" y2="0" stroke={isDark ? "#fff" : "#000"} strokeWidth="1" opacity="0.5" />
                <line x1="0" y1="-3" x2="0" y2="3" stroke={isDark ? "#fff" : "#000"} strokeWidth="1" opacity="0.5" />
                <line x1="60" y1="-3" x2="60" y2="3" stroke={isDark ? "#fff" : "#000"} strokeWidth="1" opacity="0.5" />
                <text x="30" y="10" textAnchor="middle" fontSize="6" fill={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)"}>500 ft</text>
              </g>
            </g>
          </svg>

          {/* Map controls */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            <button onClick={handleZoomIn} className="w-8 h-8 rounded-md bg-card/90 border border-border flex items-center justify-center hover:bg-muted transition-colors" aria-label="Zoom in">
              <ZoomIn className="w-4 h-4 text-foreground" />
            </button>
            <button onClick={handleZoomOut} className="w-8 h-8 rounded-md bg-card/90 border border-border flex items-center justify-center hover:bg-muted transition-colors" aria-label="Zoom out">
              <ZoomOut className="w-4 h-4 text-foreground" />
            </button>
            <button onClick={handleResetView} className="w-8 h-8 rounded-md bg-card/90 border border-border flex items-center justify-center hover:bg-muted transition-colors" aria-label="Reset view">
              <Maximize2 className="w-4 h-4 text-foreground" />
            </button>
            <button
              onClick={() => setMeasureMode(!measureMode)}
              className={`w-8 h-8 rounded-md border flex items-center justify-center transition-colors ${
                measureMode ? "bg-sky-500/20 border-sky-500/50 text-sky-400" : "bg-card/90 border-border text-foreground hover:bg-muted"
              }`}
              aria-label="Measure tool"
            >
              <Ruler className="w-4 h-4" />
            </button>
          </div>

          {/* Layer toggle */}
          <div className="absolute top-3 right-3">
            <div className="relative">
              <button
                onClick={() => setShowLayerMenu(!showLayerMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-card/90 border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                Layers
                <ChevronDown className={`w-3 h-3 transition-transform ${showLayerMenu ? "rotate-180" : ""}`} />
              </button>
              {showLayerMenu && (
                <div className="absolute top-9 right-0 w-52 rounded-lg bg-card border border-border shadow-xl p-2 z-10">
                  {layers.map((layer) => (
                    <button
                      key={layer.id}
                      onClick={() => toggleLayer(layer.id)}
                      className="flex items-center gap-2 w-full px-2.5 py-2 rounded-md text-xs hover:bg-muted transition-colors"
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors ${
                          layer.enabled ? "border-primary bg-primary" : "border-muted-foreground"
                        }`}
                      >
                        {layer.enabled && (
                          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-primary-foreground">
                            <path d="M 2 5 L 4 7 L 8 3" stroke="currentColor" strokeWidth="1.5" fill="none" />
                          </svg>
                        )}
                      </div>
                      <layer.icon className="w-3.5 h-3.5" style={{ color: layer.color }} />
                      <span className="text-foreground">{layer.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Zoom level indicator */}
          <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-card/80 border border-border text-[10px] text-muted-foreground">
            {Math.round(zoom * 100)}% | Lat 46.2856 | Lon -119.2836
          </div>
        </div>

        {/* Parcel Info Panel */}
        <div className="w-72 border-l border-border bg-card flex flex-col">
          {selectedParcel ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-xs font-semibold text-foreground">Parcel Details</span>
                <button
                  onClick={() => setSelectedParcel(null)}
                  className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Parcel Number */}
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Parcel Number</span>
                  <p className="text-sm font-mono font-semibold text-foreground mt-0.5">{selectedParcel.parcelNumber}</p>
                </div>

                {/* Address */}
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Address</span>
                  <p className="text-sm text-foreground mt-0.5">{selectedParcel.address}</p>
                </div>

                {/* Owner */}
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Owner</span>
                  <p className="text-sm text-foreground mt-0.5">{selectedParcel.owner}</p>
                </div>

                {/* Values */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-2.5">
                    <span className="text-[10px] text-muted-foreground block">Assessed</span>
                    <span className="text-sm font-bold text-foreground">${selectedParcel.assessedValue.toLocaleString()}</span>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5">
                    <span className="text-[10px] text-muted-foreground block">Land</span>
                    <span className="text-sm font-bold text-foreground">${selectedParcel.landValue.toLocaleString()}</span>
                  </div>
                </div>

                {/* Details grid */}
                <div className="space-y-2">
                  {[
                    { label: "Zoning", value: selectedParcel.zoning },
                    { label: "Acreage", value: `${selectedParcel.acreage.toFixed(2)} ac` },
                    { label: "Land $/SF", value: `$${(selectedParcel.landValue / (selectedParcel.acreage * 43560)).toFixed(2)}` },
                    { label: "Improvement", value: `$${(selectedParcel.assessedValue - selectedParcel.landValue).toLocaleString()}` },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border/50">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className="text-xs font-medium text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="space-y-1.5 pt-2">
                  <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                    <Info className="w-3.5 h-3.5" />
                    View Full Record
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors">
                    <Ruler className="w-3.5 h-3.5" />
                    Measure Parcel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                <MapPin className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Select a Parcel</p>
              <p className="text-xs text-muted-foreground mt-1">Click any parcel on the map to view its assessment details</p>

              {/* Quick stats */}
              <div className="w-full mt-6 space-y-2">
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30">
                  <span className="text-xs text-muted-foreground">Total Parcels</span>
                  <span className="text-xs font-semibold text-foreground">{stats.totalParcels}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30">
                  <span className="text-xs text-muted-foreground">Total Assessed</span>
                  <span className="text-xs font-semibold text-foreground">{fmt(stats.totalValue)}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30">
                  <span className="text-xs text-muted-foreground">Avg Value</span>
                  <span className="text-xs font-semibold text-foreground">{fmt(stats.avgValue)}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30">
                  <span className="text-xs text-muted-foreground">Total Acreage</span>
                  <span className="text-xs font-semibold text-foreground">{stats.totalAcreage.toFixed(1)} ac</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
