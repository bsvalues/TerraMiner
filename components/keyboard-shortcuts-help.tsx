"use client";

import { useEffect } from "react";
import { X, Keyboard, Navigation, MousePointer, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Shortcut } from "@/hooks/use-keyboard-shortcuts";

interface KeyboardShortcutsHelpProps {
  shortcuts: Shortcut[];
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ shortcuts, isOpen, onClose }: KeyboardShortcutsHelpProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigationShortcuts = shortcuts.filter(s => s.category === "navigation");
  const actionShortcuts = shortcuts.filter(s => s.category === "actions");
  const viewShortcuts = shortcuts.filter(s => s.category === "view");

  const CategoryIcon = {
    navigation: Navigation,
    actions: MousePointer,
    view: Eye,
  };

  const renderCategory = (title: string, items: Shortcut[], category: "navigation" | "actions" | "view") => {
    const Icon = CategoryIcon[category];
    return (
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </h3>
        <div className="space-y-2">
          {items.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <kbd className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-secondary/50 px-2 py-1 font-mono text-xs text-foreground">
                {shortcut.label.split(" ").map((k, i) => (
                  <span key={i} className={cn(i > 0 && "ml-1")}>
                    {k}
                  </span>
                ))}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Keyboard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Keyboard Shortcuts</h2>
              <p className="text-xs text-muted-foreground">Press ? anytime to see this help</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Shortcuts grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-6">
            {renderCategory("Navigation", navigationShortcuts, "navigation")}
          </div>
          <div className="space-y-6">
            {renderCategory("Actions", actionShortcuts, "actions")}
            {viewShortcuts.length > 0 && renderCategory("View", viewShortcuts, "view")}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Two-key combos: press first key, then second within 500ms
          </p>
          <kbd className="rounded-md border border-border bg-secondary/50 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            Esc to close
          </kbd>
        </div>
      </div>
    </div>
  );
}
