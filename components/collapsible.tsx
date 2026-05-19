"use client";

import { useState, createContext, useContext, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleContextValue {
  open: boolean;
  toggle: () => void;
}

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

function useCollapsible() {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error("Collapsible components must be used within a Collapsible");
  }
  return context;
}

interface CollapsibleProps {
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Collapsible({ children, defaultOpen = false, className }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = () => setOpen((prev) => !prev);

  return (
    <CollapsibleContext.Provider value={{ open, toggle }}>
      <div className={cn("w-full", className)}>{children}</div>
    </CollapsibleContext.Provider>
  );
}

interface CollapsibleTriggerProps {
  children: ReactNode;
  className?: string;
  showChevron?: boolean;
}

export function CollapsibleTrigger({ children, className, showChevron = true }: CollapsibleTriggerProps) {
  const { open, toggle } = useCollapsible();

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "flex w-full items-center justify-between text-left",
        className
      )}
      aria-expanded={open}
    >
      {children}
      {showChevron && (
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      )}
    </button>
  );
}

interface CollapsibleContentProps {
  children: ReactNode;
  className?: string;
}

export function CollapsibleContent({ children, className }: CollapsibleContentProps) {
  const { open } = useCollapsible();

  return (
    <div
      className={cn(
        "grid transition-all duration-200 ease-in-out",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className
      )}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

// Accordion component (multiple collapsibles, only one open at a time)
interface AccordionContextValue {
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

interface AccordionProps {
  children: ReactNode;
  className?: string;
  defaultActiveId?: string | null;
}

export function Accordion({ children, className, defaultActiveId = null }: AccordionProps) {
  const [activeId, setActiveId] = useState<string | null>(defaultActiveId);

  return (
    <AccordionContext.Provider value={{ activeId, setActiveId }}>
      <div className={cn("w-full divide-y divide-border", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps {
  children: ReactNode;
  id: string;
  className?: string;
}

export function AccordionItem({ children, id, className }: AccordionItemProps) {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("AccordionItem must be used within an Accordion");
  }
  const { activeId, setActiveId } = context;
  const open = activeId === id;
  const toggle = () => setActiveId(open ? null : id);

  return (
    <CollapsibleContext.Provider value={{ open, toggle }}>
      <div className={cn("py-3", className)}>{children}</div>
    </CollapsibleContext.Provider>
  );
}
