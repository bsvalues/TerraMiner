"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

export interface Shortcut {
  key: string;
  label: string;
  description: string;
  action: () => void;
  category: "navigation" | "actions" | "view";
}

export function useKeyboardShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts: Shortcut[] = [
    // Navigation
    { key: "g h", label: "G H", description: "Go to Dashboard", action: () => router.push("/"), category: "navigation" },
    { key: "g p", label: "G P", description: "Go to Properties", action: () => router.push("/properties"), category: "navigation" },
    { key: "g a", label: "G A", description: "Go to Assessment", action: () => router.push("/assessment"), category: "navigation" },
    { key: "g n", label: "G N", description: "Go to Analytics", action: () => router.push("/analytics"), category: "navigation" },
    { key: "g t", label: "G T", description: "Go to Agents", action: () => router.push("/agents"), category: "navigation" },
    { key: "g s", label: "G S", description: "Go to Settings", action: () => router.push("/settings"), category: "navigation" },
    // Actions
    { key: "/", label: "/", description: "Focus search", action: () => focusSearch(), category: "actions" },
    { key: "?", label: "?", description: "Show keyboard shortcuts", action: () => setShowHelp(true), category: "actions" },
    { key: "Escape", label: "Esc", description: "Close dialogs / Clear selection", action: () => closeDialogs(), category: "actions" },
    // View
    { key: "r", label: "R", description: "Refresh data", action: () => refreshData(), category: "view" },
  ];

  const focusSearch = useCallback(() => {
    const searchInput = document.querySelector<HTMLInputElement>('input[type="search"], input[placeholder*="Search"]');
    searchInput?.focus();
  }, []);

  const closeDialogs = useCallback(() => {
    setShowHelp(false);
    // Trigger escape event for other components
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  }, []);

  const refreshData = useCallback(() => {
    // Find and click the refresh button if present
    const refreshBtn = document.querySelector<HTMLButtonElement>('button[aria-label*="refresh"], button:has(.animate-spin)');
    if (!refreshBtn) {
      // Fallback: click any refresh button by text content
      const buttons = Array.from(document.querySelectorAll("button"));
      const refreshButton = buttons.find(b => b.textContent?.toLowerCase().includes("refresh"));
      refreshButton?.click();
    } else {
      refreshBtn.click();
    }
  }, []);

  useEffect(() => {
    let pendingKey: string | null = null;
    let pendingTimeout: NodeJS.Timeout | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        // Allow Escape in inputs
        if (e.key === "Escape") {
          (target as HTMLInputElement).blur();
        }
        return;
      }

      const key = e.key.toLowerCase();

      // Handle two-key combos (g + letter)
      if (pendingKey === "g") {
        const combo = `g ${key}`;
        const shortcut = shortcuts.find(s => s.key === combo);
        if (shortcut) {
          e.preventDefault();
          shortcut.action();
        }
        pendingKey = null;
        if (pendingTimeout) clearTimeout(pendingTimeout);
        return;
      }

      // Start pending for "g" key
      if (key === "g") {
        pendingKey = "g";
        pendingTimeout = setTimeout(() => {
          pendingKey = null;
        }, 500);
        return;
      }

      // Single-key shortcuts
      const singleShortcut = shortcuts.find(s => s.key === key || s.key === e.key);
      if (singleShortcut) {
        e.preventDefault();
        singleShortcut.action();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (pendingTimeout) clearTimeout(pendingTimeout);
    };
  }, [shortcuts]);

  return { shortcuts, showHelp, setShowHelp };
}
