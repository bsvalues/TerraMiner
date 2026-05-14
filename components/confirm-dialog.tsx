"use client";

import { useState, useCallback, createContext, useContext, type ReactNode } from "react";
import { AlertTriangle, Trash2, X, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Types for confirmation dialog
type ConfirmVariant = "danger" | "warning" | "info";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: ReactNode;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  confirmDelete: (itemName: string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within ConfirmDialogProvider");
  }
  return context;
}

// Standalone ConfirmDialog component
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: ReactNode;
  onConfirm: () => void;
  onCancel?: () => void;
}

const variantStyles: Record<ConfirmVariant, { icon: ReactNode; buttonClass: string; iconBg: string }> = {
  danger: {
    icon: <Trash2 className="h-5 w-5" />,
    buttonClass: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    iconBg: "bg-destructive/10 text-destructive",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5" />,
    buttonClass: "bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))] hover:bg-[hsl(var(--warning))]/90",
    iconBg: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  },
  info: {
    icon: <Info className="h-5 w-5" />,
    buttonClass: "bg-primary text-primary-foreground hover:bg-primary/90",
    iconBg: "bg-primary/10 text-primary",
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  icon,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const styles = variantStyles[variant];
  const displayIcon = icon ?? styles.icon;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in-0"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div
        className="relative z-50 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
      >
        {/* Close button */}
        <button
          onClick={handleCancel}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className={cn("mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full", styles.iconBg)}>
          {displayIcon}
        </div>

        {/* Content */}
        <div className="text-center">
          <h2 id="confirm-title" className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          <p id="confirm-description" className="mt-2 text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={cn("flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors", styles.buttonClass)}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Provider component for programmatic confirm dialogs
export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve: ((value: boolean) => void) | null;
  }>({
    open: false,
    options: { title: "", description: "" },
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        options,
        resolve,
      });
    });
  }, []);

  const confirmDelete = useCallback((itemName: string): Promise<boolean> => {
    return confirm({
      title: `Delete ${itemName}?`,
      description: `Are you sure you want to delete this ${itemName.toLowerCase()}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
      icon: <Trash2 className="h-5 w-5" />,
    });
  }, [confirm]);

  const handleConfirm = () => {
    dialogState.resolve?.(true);
    setDialogState((prev) => ({ ...prev, open: false, resolve: null }));
  };

  const handleCancel = () => {
    dialogState.resolve?.(false);
    setDialogState((prev) => ({ ...prev, open: false, resolve: null }));
  };

  return (
    <ConfirmContext.Provider value={{ confirm, confirmDelete }}>
      {children}
      <ConfirmDialog
        open={dialogState.open}
        onOpenChange={(open) => {
          if (!open) handleCancel();
        }}
        title={dialogState.options.title}
        description={dialogState.options.description}
        confirmText={dialogState.options.confirmText}
        cancelText={dialogState.options.cancelText}
        variant={dialogState.options.variant}
        icon={dialogState.options.icon}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}
