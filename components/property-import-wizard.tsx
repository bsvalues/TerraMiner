"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  FileText,
  Database,
  Columns,
  Play,
  X,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

type ImportStep = "upload" | "mapping" | "preview" | "importing" | "complete";

interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  sampleData: string[];
}

interface ImportError {
  row: number;
  column: string;
  value: string;
  error: string;
}

interface ImportSummary {
  totalRows: number;
  validRows: number;
  errorRows: number;
  skippedRows: number;
  newProperties: number;
  updatedProperties: number;
}

// Target fields for property data
const targetFields = [
  { id: "parcel_id", label: "Parcel ID", required: true },
  { id: "address", label: "Address", required: true },
  { id: "city", label: "City", required: true },
  { id: "state", label: "State", required: false },
  { id: "zip", label: "ZIP Code", required: false },
  { id: "property_type", label: "Property Type", required: true },
  { id: "assessed_value", label: "Assessed Value", required: true },
  { id: "market_value", label: "Market Value", required: false },
  { id: "year_built", label: "Year Built", required: false },
  { id: "bedrooms", label: "Bedrooms", required: false },
  { id: "bathrooms", label: "Bathrooms", required: false },
  { id: "sqft", label: "Square Feet", required: false },
  { id: "lot_size", label: "Lot Size (acres)", required: false },
  { id: "neighborhood", label: "Neighborhood Code", required: false },
  { id: "owner_name", label: "Owner Name", required: false },
  { id: "sale_date", label: "Last Sale Date", required: false },
  { id: "sale_price", label: "Last Sale Price", required: false },
];

// Mock source columns from uploaded file
const mockSourceColumns = [
  "PIN",
  "SITUS_ADDR",
  "SITUS_CITY",
  "SITUS_ST",
  "SITUS_ZIP",
  "PROP_CLASS",
  "ASSESSED_VAL",
  "MARKET_VAL",
  "YR_BUILT",
  "BEDS",
  "BATHS",
  "SQ_FT",
  "LOT_ACRES",
  "NBHD_CD",
  "OWNER",
  "LAST_SALE_DT",
  "LAST_SALE_AMT",
];

// Auto-mapping suggestions
const autoMappings: Record<string, string> = {
  PIN: "parcel_id",
  SITUS_ADDR: "address",
  SITUS_CITY: "city",
  SITUS_ST: "state",
  SITUS_ZIP: "zip",
  PROP_CLASS: "property_type",
  ASSESSED_VAL: "assessed_value",
  MARKET_VAL: "market_value",
  YR_BUILT: "year_built",
  BEDS: "bedrooms",
  BATHS: "bathrooms",
  SQ_FT: "sqft",
  LOT_ACRES: "lot_size",
  NBHD_CD: "neighborhood",
  OWNER: "owner_name",
  LAST_SALE_DT: "sale_date",
  LAST_SALE_AMT: "sale_price",
};

interface PropertyImportWizardProps {
  onClose: () => void;
  onComplete?: (summary: ImportSummary) => void;
}

export function PropertyImportWizard({ onClose, onComplete }: PropertyImportWizardProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mappings, setMappings] = useState<Record<string, string>>(autoMappings);
  const [importProgress, setImportProgress] = useState(0);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith(".csv") || droppedFile.name.endsWith(".xlsx"))) {
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const updateMapping = (sourceColumn: string, targetField: string) => {
    setMappings((prev) => ({ ...prev, [sourceColumn]: targetField }));
  };

  const clearMapping = (sourceColumn: string) => {
    setMappings((prev) => {
      const newMappings = { ...prev };
      delete newMappings[sourceColumn];
      return newMappings;
    });
  };

  const getMappedCount = () => {
    const requiredFields = targetFields.filter((f) => f.required).map((f) => f.id);
    const mappedTargets = Object.values(mappings);
    return requiredFields.filter((f) => mappedTargets.includes(f)).length;
  };

  const getRequiredCount = () => targetFields.filter((f) => f.required).length;

  const canProceedToPreview = getMappedCount() === getRequiredCount();

  const simulateImport = () => {
    setStep("importing");
    setImportProgress(0);

    // Simulate import progress
    const interval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // Set mock results
          setErrors([
            { row: 45, column: "ASSESSED_VAL", value: "N/A", error: "Invalid numeric value" },
            { row: 89, column: "YR_BUILT", value: "19xx", error: "Invalid year format" },
            { row: 156, column: "PIN", value: "", error: "Required field is empty" },
          ]);
          setSummary({
            totalRows: 1247,
            validRows: 1244,
            errorRows: 3,
            skippedRows: 0,
            newProperties: 892,
            updatedProperties: 352,
          });
          setStep("complete");
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const steps: { id: ImportStep; label: string; icon: typeof Upload }[] = [
    { id: "upload", label: "Upload File", icon: Upload },
    { id: "mapping", label: "Map Columns", icon: Columns },
    { id: "preview", label: "Preview", icon: Eye },
    { id: "importing", label: "Import", icon: Play },
    { id: "complete", label: "Complete", icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative flex h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Import Property Data</h2>
              <p className="text-sm text-muted-foreground">Import properties from CSV or Excel files</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => {
              const StepIcon = s.icon;
              const isActive = s.id === step;
              const isComplete = i < currentStepIndex;
              const isDisabled = i > currentStepIndex;

              return (
                <div key={s.id} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                        isActive && "bg-primary text-primary-foreground",
                        isComplete && "bg-[hsl(var(--success))] text-white",
                        isDisabled && "bg-muted text-muted-foreground"
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isActive && "text-foreground",
                        isComplete && "text-[hsl(var(--success))]",
                        isDisabled && "text-muted-foreground"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={cn(
                        "mx-4 h-0.5 w-12",
                        i < currentStepIndex ? "bg-[hsl(var(--success))]" : "bg-border"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Step */}
          {step === "upload" && (
            <div className="flex flex-col items-center justify-center">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "flex w-full max-w-lg flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : file
                    ? "border-[hsl(var(--success))] bg-[hsl(var(--success))]/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                {file ? (
                  <>
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--success))]/10">
                      <FileSpreadsheet className="h-8 w-8 text-[hsl(var(--success))]" />
                    </div>
                    <p className="mb-1 text-sm font-medium text-foreground">{file.name}</p>
                    <p className="mb-4 text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={() => setFile(null)}
                      className="text-xs font-medium text-muted-foreground hover:text-destructive"
                    >
                      Remove file
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="mb-1 text-sm font-medium text-foreground">
                      Drag and drop your file here
                    </p>
                    <p className="mb-4 text-xs text-muted-foreground">
                      Supports CSV and Excel files up to 50MB
                    </p>
                    <label className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                      Browse Files
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </>
                )}
              </div>

              <div className="mt-8 flex items-center gap-4">
                <a
                  href="#"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Download className="h-4 w-4" />
                  Download template
                </a>
                <span className="text-muted-foreground">|</span>
                <a href="#" className="text-sm text-primary hover:underline">
                  View import guide
                </a>
              </div>
            </div>
          )}

          {/* Mapping Step */}
          {step === "mapping" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Map source columns to property fields
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getMappedCount()} of {getRequiredCount()} required fields mapped
                  </p>
                </div>
                <button
                  onClick={() => setMappings(autoMappings)}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Auto-map
                </button>
              </div>

              <div className="rounded-lg border border-border">
                <div className="grid grid-cols-3 gap-4 border-b border-border bg-muted/30 px-4 py-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Source Column
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Target Field
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Sample Data
                  </p>
                </div>
                <div className="max-h-[400px] divide-y divide-border overflow-y-auto">
                  {mockSourceColumns.map((col) => {
                    const mappedTo = mappings[col];
                    const targetField = targetFields.find((f) => f.id === mappedTo);

                    return (
                      <div key={col} className="grid grid-cols-3 gap-4 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{col}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={mappedTo || ""}
                            onChange={(e) =>
                              e.target.value
                                ? updateMapping(col, e.target.value)
                                : clearMapping(col)
                            }
                            className={cn(
                              "h-8 w-full rounded-md border bg-background px-2 text-sm",
                              mappedTo
                                ? "border-[hsl(var(--success))] text-foreground"
                                : "border-border text-muted-foreground"
                            )}
                          >
                            <option value="">-- Skip --</option>
                            {targetFields.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.label}
                                {f.required ? " *" : ""}
                              </option>
                            ))}
                          </select>
                          {targetField?.required && (
                            <span className="shrink-0 text-[10px] font-medium text-[hsl(var(--warning))]">
                              Required
                            </span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="truncate text-xs text-muted-foreground">
                            {col === "PIN" && "12-34-56-789"}
                            {col === "SITUS_ADDR" && "1425 Columbia Park Trail"}
                            {col === "SITUS_CITY" && "Richland"}
                            {col === "ASSESSED_VAL" && "$285,000"}
                            {col === "YR_BUILT" && "2005"}
                            {!["PIN", "SITUS_ADDR", "SITUS_CITY", "ASSESSED_VAL", "YR_BUILT"].includes(col) && "..."}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === "preview" && (
            <div>
              <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="mb-3 text-sm font-medium text-foreground">Import Summary</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-foreground">1,247</p>
                    <p className="text-xs text-muted-foreground">Total Rows</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[hsl(var(--success))]">1,244</p>
                    <p className="text-xs text-muted-foreground">Valid Rows</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[hsl(var(--warning))]">3</p>
                    <p className="text-xs text-muted-foreground">Warnings</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">17</p>
                    <p className="text-xs text-muted-foreground">Mapped Fields</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="mb-2 text-sm font-medium text-foreground">Data Preview (first 5 rows)</h3>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Parcel ID</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Address</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">City</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Type</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Assessed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[
                        ["12-34-56-789", "1425 Columbia Park Trail", "Richland", "Residential", "$285,000"],
                        ["12-34-56-790", "2890 Bombing Range Rd", "West Richland", "Residential", "$425,000"],
                        ["12-34-56-791", "456 Keene Rd", "Richland", "Commercial", "$175,000"],
                        ["12-34-56-792", "789 George Washington Way", "Richland", "Residential", "$295,000"],
                        ["12-34-56-793", "1200 Stevens Dr", "Richland", "Commercial", "$1,250,000"],
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-muted/30">
                          <td className="px-3 py-2 font-mono text-xs">{row[0]}</td>
                          <td className="px-3 py-2">{row[1]}</td>
                          <td className="px-3 py-2">{row[2]}</td>
                          <td className="px-3 py-2">{row[3]}</td>
                          <td className="px-3 py-2 text-right font-medium">{row[4]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-lg border border-[hsl(var(--warning))]/50 bg-[hsl(var(--warning))]/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-[hsl(var(--warning))]" />
                  <div>
                    <p className="text-sm font-medium text-foreground">3 rows have warnings</p>
                    <p className="text-xs text-muted-foreground">
                      These rows will be imported but may have data quality issues. Review after import.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Importing Step */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <RefreshCw className="h-10 w-10 animate-spin text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Importing Properties...</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Please wait while we process your data
              </p>
              <div className="w-full max-w-md">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">{importProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === "complete" && summary && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--success))]/10">
                <CheckCircle2 className="h-10 w-10 text-[hsl(var(--success))]" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Import Complete!</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Successfully imported {formatNumber(summary.validRows)} properties
              </p>

              <div className="mb-6 grid w-full max-w-md grid-cols-2 gap-4">
                <div className="rounded-lg border border-border p-4 text-center">
                  <p className="text-2xl font-bold text-[hsl(var(--success))]">{formatNumber(summary.newProperties)}</p>
                  <p className="text-xs text-muted-foreground">New Properties</p>
                </div>
                <div className="rounded-lg border border-border p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{formatNumber(summary.updatedProperties)}</p>
                  <p className="text-xs text-muted-foreground">Updated Properties</p>
                </div>
              </div>

              {errors.length > 0 && (
                <div className="w-full max-w-md">
                  <button
                    onClick={() => setShowErrors(!showErrors)}
                    className="flex w-full items-center justify-between rounded-lg border border-[hsl(var(--warning))]/50 bg-[hsl(var(--warning))]/5 px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />
                      <span className="text-sm font-medium text-foreground">
                        {errors.length} rows had errors
                      </span>
                    </div>
                    {showErrors ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {showErrors && (
                    <div className="mt-2 divide-y divide-border rounded-lg border border-border">
                      {errors.map((err, i) => (
                        <div key={i} className="px-4 py-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-foreground">
                              Row {err.row}, Column: {err.column}
                            </span>
                            <span className="text-xs text-destructive">{err.error}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Value: &quot;{err.value}&quot;</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <div>
            {step !== "upload" && step !== "importing" && step !== "complete" && (
              <button
                onClick={() => {
                  if (step === "mapping") setStep("upload");
                  if (step === "preview") setStep("mapping");
                }}
                className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step === "complete" ? (
              <button
                onClick={() => {
                  onComplete?.(summary!);
                  onClose();
                }}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Done
              </button>
            ) : step === "importing" ? null : (
              <button
                onClick={() => {
                  if (step === "upload" && file) setStep("mapping");
                  if (step === "mapping" && canProceedToPreview) setStep("preview");
                  if (step === "preview") simulateImport();
                }}
                disabled={
                  (step === "upload" && !file) ||
                  (step === "mapping" && !canProceedToPreview)
                }
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {step === "preview" ? "Start Import" : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
