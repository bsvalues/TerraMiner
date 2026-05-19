"use client";

import { useState, useEffect } from "react";
import { Bookmark, Plus, X, Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, string | number | boolean>;
  isDefault?: boolean;
  createdAt: number;
}

interface FilterPresetsProps {
  storageKey: string;
  currentFilters: Record<string, string | number | boolean>;
  onApplyPreset: (filters: Record<string, string | number | boolean>) => void;
  className?: string;
}

const BUILT_IN_PRESETS: Omit<FilterPreset, "id" | "createdAt">[] = [
  {
    name: "Under-assessed Properties",
    filters: { quickFilter: "under-assessed" },
    isDefault: false,
  },
  {
    name: "High Value Residential",
    filters: { propertyType: "residential", minPrice: 500000 },
    isDefault: false,
  },
  {
    name: "New Construction",
    filters: { quickFilter: "new-construction" },
    isDefault: false,
  },
];

export function FilterPresets({
  storageKey,
  currentFilters,
  onApplyPreset,
  className,
}: FilterPresetsProps) {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Load presets from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setPresets(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, [storageKey]);

  // Save presets to localStorage
  const savePresets = (updated: FilterPreset[]) => {
    setPresets(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;

    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name: newPresetName.trim(),
      filters: currentFilters,
      createdAt: Date.now(),
    };

    savePresets([...presets, newPreset]);
    setNewPresetName("");
    setShowSaveDialog(false);
  };

  const handleDeletePreset = (id: string) => {
    savePresets(presets.filter((p) => p.id !== id));
    if (activePresetId === id) {
      setActivePresetId(null);
    }
  };

  const handleApplyPreset = (preset: FilterPreset | Omit<FilterPreset, "id" | "createdAt">) => {
    onApplyPreset(preset.filters);
    setActivePresetId("id" in preset ? preset.id : null);
  };

  const handleSetDefault = (id: string) => {
    savePresets(
      presets.map((p) => ({
        ...p,
        isDefault: p.id === id,
      }))
    );
  };

  const hasActiveFilters = Object.values(currentFilters).some(
    (v) => v !== "" && v !== null && v !== undefined
  );

  return (
    <div className={cn("rounded-lg border border-border bg-card p-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Saved Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="h-3 w-3" />
            Save Current
          </button>
        )}
      </div>

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="Filter name..."
            className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSavePreset();
              if (e.key === "Escape") setShowSaveDialog(false);
            }}
          />
          <button
            onClick={handleSavePreset}
            disabled={!newPresetName.trim()}
            className="rounded-md bg-primary p-1.5 text-primary-foreground disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShowSaveDialog(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Built-in presets */}
      <div className="mt-3 space-y-1">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Presets
        </p>
        <div className="flex flex-wrap gap-1.5">
          {BUILT_IN_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(preset)}
              className="rounded-full border border-border bg-secondary/30 px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* User presets */}
      {presets.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            Your Presets
          </p>
          <div className="space-y-1">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className={cn(
                  "group flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors",
                  activePresetId === preset.id
                    ? "border-primary bg-primary/5"
                    : "border-transparent hover:border-border"
                )}
              >
                <button
                  onClick={() => handleApplyPreset(preset)}
                  className="flex-1 text-left text-xs font-medium text-foreground"
                >
                  {preset.name}
                </button>
                <button
                  onClick={() => handleSetDefault(preset.id)}
                  className={cn(
                    "opacity-0 transition-opacity group-hover:opacity-100",
                    preset.isDefault && "opacity-100"
                  )}
                  title={preset.isDefault ? "Default preset" : "Set as default"}
                >
                  <Star
                    className={cn(
                      "h-3 w-3",
                      preset.isDefault
                        ? "fill-[hsl(var(--warning))] text-[hsl(var(--warning))]"
                        : "text-muted-foreground hover:text-[hsl(var(--warning))]"
                    )}
                  />
                </button>
                <button
                  onClick={() => handleDeletePreset(preset.id)}
                  className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  title="Delete preset"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {presets.length === 0 && !showSaveDialog && (
        <p className="mt-3 text-[10px] text-muted-foreground">
          Apply filters and click &quot;Save Current&quot; to create a preset.
        </p>
      )}
    </div>
  );
}
