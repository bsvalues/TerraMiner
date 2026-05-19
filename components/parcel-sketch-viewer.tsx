"use client";

import { useState, useRef, useEffect } from "react";
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Printer,
  Ruler,
  Square,
  ChevronDown,
  ChevronUp,
  Layers,
  Eye,
  EyeOff,
  Info,
  Move,
} from "lucide-react";

interface ParcelSketchViewerProps {
  propertyId: string;
  className?: string;
}

interface SketchLayer {
  id: string;
  name: string;
  visible: boolean;
  color: string;
}

interface BuildingSection {
  id: string;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  sqft: number;
  year?: number;
  stories?: number;
  type?: string;
}

// Mock parcel sketch data
const MOCK_SKETCH_DATA: Record<string, {
  parcelDimensions: { width: number; height: number };
  buildings: BuildingSection[];
  totalSqft: number;
  lotSize: number;
  frontage: number;
  depth: number;
}> = {
  default: {
    parcelDimensions: { width: 100, height: 150 },
    buildings: [
      { id: "main", name: "Main House", width: 40, height: 30, x: 30, y: 50, sqft: 1800, year: 2005, stories: 2, type: "Living" },
      { id: "garage", name: "Attached Garage", width: 24, height: 22, x: 30, y: 80, sqft: 528, year: 2005, stories: 1, type: "Garage" },
      { id: "porch", name: "Covered Porch", width: 12, height: 8, x: 30, y: 42, sqft: 96, year: 2005, stories: 1, type: "Porch" },
      { id: "deck", name: "Rear Deck", width: 16, height: 12, x: 54, y: 50, sqft: 192, year: 2010, stories: 1, type: "Deck" },
    ],
    totalSqft: 2616,
    lotSize: 15000,
    frontage: 100,
    depth: 150,
  },
};

const DEFAULT_LAYERS: SketchLayer[] = [
  { id: "parcel", name: "Parcel Boundary", visible: true, color: "hsl(var(--border))" },
  { id: "buildings", name: "Building Footprints", visible: true, color: "hsl(var(--primary))" },
  { id: "dimensions", name: "Dimensions", visible: true, color: "hsl(var(--muted-foreground))" },
  { id: "labels", name: "Labels", visible: true, color: "hsl(var(--foreground))" },
];

export function ParcelSketchViewer({ propertyId, className = "" }: ParcelSketchViewerProps) {
  const [expanded, setExpanded] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [showLayers, setShowLayers] = useState(false);
  const [layers, setLayers] = useState<SketchLayer[]>(DEFAULT_LAYERS);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPanRef = useRef({ x: 0, y: 0 });

  const sketchData = MOCK_SKETCH_DATA.default;
  const scale = 2.5 * zoom; // Scale factor for SVG coordinates

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedBuilding(null);
  };

  const toggleLayer = (layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  };

  const isLayerVisible = (layerId: string) =>
    layers.find((l) => l.id === layerId)?.visible ?? true;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      lastPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - lastPanRef.current.x,
        y: e.clientY - lastPanRef.current.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const selectedBuildingData = sketchData.buildings.find((b) => b.id === selectedBuilding);

  return (
    <div className={`rounded-xl border border-border bg-card ${className}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-accent/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
            <Square className="h-4.5 w-4.5 text-violet-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Parcel Sketch</h3>
            <p className="text-xs text-muted-foreground">
              {sketchData.totalSqft.toLocaleString()} SF on {(sketchData.lotSize / 43560).toFixed(2)} acres
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {sketchData.buildings.length} sections
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border p-4">
          {/* Toolbar */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={handleZoomIn}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleZoomOut}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleReset}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                title="Reset View"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <div className="mx-1 h-5 w-px bg-border" />
              <button
                onClick={() => setShowLayers(!showLayers)}
                className={`flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-medium transition-colors ${
                  showLayers
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-accent"
                }`}
              >
                <Layers className="h-3 w-3" />
                Layers
              </button>
            </div>
            <div className="flex items-center gap-1">
              <span className="mr-1 text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                title="Print"
              >
                <Printer className="h-3.5 w-3.5" />
              </button>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                title="Download"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                title="Fullscreen"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Layer Controls */}
          {showLayers && (
            <div className="mb-3 rounded-lg border border-border bg-muted/30 p-2">
              <div className="grid grid-cols-2 gap-1">
                {layers.map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id)}
                    className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors ${
                      layer.visible
                        ? "bg-background text-foreground"
                        : "text-muted-foreground hover:bg-background/50"
                    }`}
                  >
                    {layer.visible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                    {layer.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sketch Canvas */}
          <div
            ref={containerRef}
            className="relative mb-3 h-64 overflow-hidden rounded-lg border border-border bg-[hsl(var(--background))]"
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${sketchData.parcelDimensions.width * scale + 40} ${sketchData.parcelDimensions.height * scale + 40}`}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px)`,
              }}
            >
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
                </pattern>
              </defs>

              {/* Grid Background */}
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Parcel Boundary */}
              {isLayerVisible("parcel") && (
                <rect
                  x={20}
                  y={20}
                  width={sketchData.parcelDimensions.width * scale}
                  height={sketchData.parcelDimensions.height * scale}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                  strokeDasharray="8 4"
                />
              )}

              {/* Building Footprints */}
              {isLayerVisible("buildings") &&
                sketchData.buildings.map((building) => (
                  <g key={building.id}>
                    <rect
                      x={20 + building.x * scale}
                      y={20 + building.y * scale}
                      width={building.width * scale}
                      height={building.height * scale}
                      fill={selectedBuilding === building.id ? "hsl(var(--primary) / 0.2)" : "hsl(var(--primary) / 0.1)"}
                      stroke={selectedBuilding === building.id ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.6)"}
                      strokeWidth={selectedBuilding === building.id ? 2 : 1}
                      className="cursor-pointer transition-colors hover:fill-[hsl(var(--primary)/0.15)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBuilding(building.id === selectedBuilding ? null : building.id);
                      }}
                    />
                    {/* Building Label */}
                    {isLayerVisible("labels") && (
                      <text
                        x={20 + building.x * scale + (building.width * scale) / 2}
                        y={20 + building.y * scale + (building.height * scale) / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="10"
                        fill="hsl(var(--foreground))"
                        className="pointer-events-none select-none"
                      >
                        {building.name}
                      </text>
                    )}
                  </g>
                ))}

              {/* Dimensions */}
              {isLayerVisible("dimensions") && (
                <>
                  {/* Width dimension */}
                  <line
                    x1={20}
                    y1={15}
                    x2={20 + sketchData.parcelDimensions.width * scale}
                    y2={15}
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth="1"
                    markerStart="url(#arrowStart)"
                    markerEnd="url(#arrowEnd)"
                  />
                  <text
                    x={20 + (sketchData.parcelDimensions.width * scale) / 2}
                    y={10}
                    textAnchor="middle"
                    fontSize="9"
                    fill="hsl(var(--muted-foreground))"
                  >
                    {sketchData.frontage}&apos;
                  </text>
                  {/* Depth dimension */}
                  <line
                    x1={15}
                    y1={20}
                    x2={15}
                    y2={20 + sketchData.parcelDimensions.height * scale}
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth="1"
                  />
                  <text
                    x={8}
                    y={20 + (sketchData.parcelDimensions.height * scale) / 2}
                    textAnchor="middle"
                    fontSize="9"
                    fill="hsl(var(--muted-foreground))"
                    transform={`rotate(-90, 8, ${20 + (sketchData.parcelDimensions.height * scale) / 2})`}
                  >
                    {sketchData.depth}&apos;
                  </text>
                </>
              )}

              {/* North Arrow */}
              <g transform={`translate(${sketchData.parcelDimensions.width * scale + 30}, 40)`}>
                <polygon points="0,-15 5,5 -5,5" fill="hsl(var(--foreground))" />
                <text y="15" textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">N</text>
              </g>
            </svg>

            {/* Pan indicator */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              <Move className="h-3 w-3" />
              Drag to pan
            </div>
          </div>

          {/* Selected Building Details */}
          {selectedBuildingData && (
            <div className="mb-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-semibold text-foreground">{selectedBuildingData.name}</h4>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  {selectedBuildingData.type}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <p className="text-[10px] text-muted-foreground">Size</p>
                  <p className="font-medium text-foreground">{selectedBuildingData.sqft.toLocaleString()} SF</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Dimensions</p>
                  <p className="font-medium text-foreground">{selectedBuildingData.width}&apos; x {selectedBuildingData.height}&apos;</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Year Built</p>
                  <p className="font-medium text-foreground">{selectedBuildingData.year || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Stories</p>
                  <p className="font-medium text-foreground">{selectedBuildingData.stories || 1}</p>
                </div>
              </div>
            </div>
          )}

          {/* Building Sections Summary */}
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Ruler className="h-3.5 w-3.5" />
              Building Sections
            </h4>
            <div className="space-y-1">
              {sketchData.buildings.map((building) => (
                <button
                  key={building.id}
                  onClick={() => setSelectedBuilding(building.id === selectedBuilding ? null : building.id)}
                  className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-xs transition-colors ${
                    selectedBuilding === building.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <span className="font-medium">{building.name}</span>
                  <span>{building.sqft.toLocaleString()} SF</span>
                </button>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-1.5 text-xs">
                <span className="font-semibold text-foreground">Total Building Area</span>
                <span className="font-bold text-primary">{sketchData.totalSqft.toLocaleString()} SF</span>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Parcel sketch shows building footprints to scale. Click on a section to view details. 
              Use toolbar to zoom, pan, and toggle layers. Lot size: {(sketchData.lotSize).toLocaleString()} SF 
              ({(sketchData.lotSize / 43560).toFixed(3)} acres).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
