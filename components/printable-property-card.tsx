"use client";

import { useState, useRef, useCallback } from "react";
import { Printer, Download, FileText, ChevronDown, X } from "lucide-react";

// ── types ──────────────────────────────────────────────────────────────────

interface PropertyCardData {
  parcelNumber: string;
  accountNumber: string;
  taxYear: number;
  owner: { name: string; mailingAddress: string; city: string; state: string; zip: string };
  property: {
    address: string;
    city: string;
    state: string;
    zip: string;
    legalDescription: string;
    neighborhood: string;
    neighborhoodCode: string;
    zoning: string;
    landUse: string;
    totalAcreage: number;
    sqft: number;
  };
  building: {
    yearBuilt: number;
    stories: number;
    style: string;
    foundation: string;
    exterior: string;
    roof: string;
    heating: string;
    cooling: string;
    bedrooms: number;
    bathrooms: number;
    totalRooms: number;
    livingArea: number;
    basementArea: number;
    basementFinished: number;
    garageType: string;
    garageSqft: number;
    fireplaces: number;
    condition: string;
    quality: string;
  };
  values: {
    landValue: number;
    improvementValue: number;
    totalAssessed: number;
    priorYearTotal: number;
    marketValue: number;
    exemptions: { type: string; amount: number }[];
    taxableValue: number;
  };
  sales: { date: string; price: number; type: string; ratio: number }[];
  inspections: { date: string; type: string; inspector: string }[];
}

interface PrintablePropertyCardProps {
  propertyId: string;
  className?: string;
}

// ── mock card data ─────────────────────────────────────────────────────────

function generateCardData(): PropertyCardData {
  return {
    parcelNumber: "1-0455-100-0001-000",
    accountNumber: "R520918",
    taxYear: 2026,
    owner: {
      name: "Smith, John & Mary",
      mailingAddress: "1425 Columbia Park Trail",
      city: "Richland",
      state: "WA",
      zip: "99352",
    },
    property: {
      address: "1425 Columbia Park Trail",
      city: "Richland",
      state: "WA",
      zip: "99352",
      legalDescription: "Columbia Park Add Lot 15 Block 3 S22 T10N R28E",
      neighborhood: "Columbia Park",
      neighborhoodCode: "CP-01",
      zoning: "R-1",
      landUse: "Single Family Residential",
      totalAcreage: 0.23,
      sqft: 10019,
    },
    building: {
      yearBuilt: 2005,
      stories: 2,
      style: "Contemporary",
      foundation: "Concrete Slab",
      exterior: "Vinyl Siding",
      roof: "Composition Shingle",
      heating: "Forced Air Gas",
      cooling: "Central A/C",
      bedrooms: 4,
      bathrooms: 2.5,
      totalRooms: 9,
      livingArea: 2200,
      basementArea: 0,
      basementFinished: 0,
      garageType: "Attached 2-Car",
      garageSqft: 484,
      fireplaces: 1,
      condition: "Good",
      quality: "Average+",
    },
    values: {
      landValue: 85000,
      improvementValue: 276250,
      totalAssessed: 361250,
      priorYearTotal: 340000,
      marketValue: 425000,
      exemptions: [{ type: "Homestead", amount: 50000 }],
      taxableValue: 311250,
    },
    sales: [
      { date: "04/15/2026", price: 425000, type: "Warranty Deed", ratio: 0.850 },
      { date: "06/20/2019", price: 325000, type: "Warranty Deed", ratio: 0.923 },
      { date: "03/10/2012", price: 245000, type: "Warranty Deed", ratio: 0.959 },
    ],
    inspections: [
      { date: "05/10/2026", type: "Routine", inspector: "James Wilson" },
      { date: "03/15/2024", type: "Revaluation", inspector: "Sarah Chen" },
      { date: "09/22/2021", type: "Routine", inspector: "Mike Rodriguez" },
    ],
  };
}

// ── component ──────────────────────────────────────────────────────────────

export function PrintablePropertyCard({ propertyId, className = "" }: PrintablePropertyCardProps) {
  const [data] = useState<PropertyCardData>(generateCardData);
  const [showPreview, setShowPreview] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    setShowPreview(true);
    setTimeout(() => window.print(), 300);
  }, []);

  const fmt = (v: number) => `$${v.toLocaleString()}`;

  // ── print button (screen view) ────────────────────────────────────────

  if (!showPreview) {
    return (
      <div className={`rounded-2xl border border-border bg-card ${className}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-500/10">
              <FileText className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Property Record Card</h3>
              <p className="text-xs text-muted-foreground">
                Official assessment record | Parcel {data.parcelNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Card
            </button>
          </div>
        </div>

        {/* Summary preview */}
        <div className="p-5">
          <div className="grid grid-cols-3 gap-4">
            {/* Owner */}
            <div className="rounded-lg bg-muted/30 p-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Owner</span>
              <p className="text-sm font-semibold text-foreground mt-1">{data.owner.name}</p>
              <p className="text-xs text-muted-foreground">{data.property.address}</p>
            </div>

            {/* Assessed Value */}
            <div className="rounded-lg bg-muted/30 p-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total Assessed</span>
              <p className="text-lg font-bold text-foreground mt-1">{fmt(data.values.totalAssessed)}</p>
              <p className="text-xs text-muted-foreground">
                Land {fmt(data.values.landValue)} + Impr {fmt(data.values.improvementValue)}
              </p>
            </div>

            {/* Building */}
            <div className="rounded-lg bg-muted/30 p-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Building</span>
              <p className="text-sm font-semibold text-foreground mt-1">
                {data.building.livingArea.toLocaleString()} SF | {data.building.bedrooms}BR/{data.building.bathrooms}BA
              </p>
              <p className="text-xs text-muted-foreground">
                Built {data.building.yearBuilt} | {data.building.condition} condition
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-sky-500/5 border border-sky-500/10">
            <FileText className="w-4 h-4 text-sky-500 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Click <span className="font-medium text-foreground">Preview</span> to see the full property record card, or{" "}
              <span className="font-medium text-foreground">Print Card</span> to generate a print-ready document.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── full card preview ─────────────────────────────────────────────────

  return (
    <div className={`rounded-2xl border border-border bg-card ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border print:hidden">
        <span className="text-sm font-semibold text-foreground">Property Record Card Preview</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            onClick={() => setShowPreview(false)}
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Printable Card */}
      <div ref={cardRef} className="p-6 print:p-4 max-w-[800px] mx-auto">
        {/* Header */}
        <div className="text-center border-b-2 border-foreground pb-3 mb-4">
          <h1 className="text-lg font-bold text-foreground tracking-tight">BENTON COUNTY ASSESSOR&apos;S OFFICE</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Property Record Card | Tax Year {data.taxYear}</p>
          <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
            <span>Parcel: <span className="font-mono font-bold text-foreground">{data.parcelNumber}</span></span>
            <span>Account: <span className="font-mono font-bold text-foreground">{data.accountNumber}</span></span>
            <span>Printed: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Row 1: Owner & Property */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="border border-border rounded p-2.5">
            <h4 className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold border-b border-border pb-1 mb-2">Owner Information</h4>
            <table className="w-full text-xs">
              <tbody>
                <tr><td className="text-muted-foreground py-0.5 w-20">Name</td><td className="font-medium text-foreground">{data.owner.name}</td></tr>
                <tr><td className="text-muted-foreground py-0.5">Address</td><td className="text-foreground">{data.owner.mailingAddress}</td></tr>
                <tr><td className="text-muted-foreground py-0.5">City/State</td><td className="text-foreground">{data.owner.city}, {data.owner.state} {data.owner.zip}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="border border-border rounded p-2.5">
            <h4 className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold border-b border-border pb-1 mb-2">Property Location</h4>
            <table className="w-full text-xs">
              <tbody>
                <tr><td className="text-muted-foreground py-0.5 w-24">Situs Address</td><td className="font-medium text-foreground">{data.property.address}</td></tr>
                <tr><td className="text-muted-foreground py-0.5">Neighborhood</td><td className="text-foreground">{data.property.neighborhood} ({data.property.neighborhoodCode})</td></tr>
                <tr><td className="text-muted-foreground py-0.5">Legal</td><td className="text-foreground text-[10px]">{data.property.legalDescription}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Row 2: Land & Zoning */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          {[
            { label: "Zoning", value: data.property.zoning },
            { label: "Land Use", value: data.property.landUse },
            { label: "Acreage", value: `${data.property.totalAcreage.toFixed(2)} ac` },
            { label: "Lot SF", value: data.property.sqft.toLocaleString() },
          ].map((item) => (
            <div key={item.label} className="border border-border rounded p-2 text-center">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium block">{item.label}</span>
              <span className="text-xs font-bold text-foreground mt-0.5 block">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Row 3: Building Characteristics */}
        <div className="border border-border rounded p-2.5 mb-3">
          <h4 className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold border-b border-border pb-1 mb-2">Building Characteristics</h4>
          <div className="grid grid-cols-4 gap-x-4 gap-y-1 text-xs">
            {[
              ["Year Built", String(data.building.yearBuilt)],
              ["Stories", String(data.building.stories)],
              ["Style", data.building.style],
              ["Foundation", data.building.foundation],
              ["Exterior", data.building.exterior],
              ["Roof", data.building.roof],
              ["Heating", data.building.heating],
              ["Cooling", data.building.cooling],
              ["Bedrooms", String(data.building.bedrooms)],
              ["Bathrooms", String(data.building.bathrooms)],
              ["Total Rooms", String(data.building.totalRooms)],
              ["Fireplaces", String(data.building.fireplaces)],
              ["Living Area", `${data.building.livingArea.toLocaleString()} SF`],
              ["Basement", data.building.basementArea > 0 ? `${data.building.basementArea} SF` : "None"],
              ["Garage", data.building.garageType],
              ["Garage SF", data.building.garageSqft.toLocaleString()],
              ["Condition", data.building.condition],
              ["Quality", data.building.quality],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-0.5">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 4: Valuation */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="border border-border rounded p-2.5">
            <h4 className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold border-b border-border pb-1 mb-2">Assessed Valuation</h4>
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="text-muted-foreground py-1">Land Value</td>
                  <td className="text-right font-mono font-medium text-foreground">{fmt(data.values.landValue)}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="text-muted-foreground py-1">Improvement Value</td>
                  <td className="text-right font-mono font-medium text-foreground">{fmt(data.values.improvementValue)}</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="font-semibold text-foreground py-1">Total Assessed</td>
                  <td className="text-right font-mono font-bold text-foreground text-sm">{fmt(data.values.totalAssessed)}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="text-muted-foreground py-1">Prior Year</td>
                  <td className="text-right font-mono text-muted-foreground">{fmt(data.values.priorYearTotal)}</td>
                </tr>
                <tr>
                  <td className="text-muted-foreground py-1">Change</td>
                  <td className="text-right font-mono text-emerald-600 dark:text-emerald-400">
                    +{fmt(data.values.totalAssessed - data.values.priorYearTotal)} ({((data.values.totalAssessed / data.values.priorYearTotal - 1) * 100).toFixed(1)}%)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="border border-border rounded p-2.5">
            <h4 className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold border-b border-border pb-1 mb-2">Tax Computation</h4>
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="text-muted-foreground py-1">Market Value</td>
                  <td className="text-right font-mono font-medium text-foreground">{fmt(data.values.marketValue)}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="text-muted-foreground py-1">Assessed Value</td>
                  <td className="text-right font-mono text-foreground">{fmt(data.values.totalAssessed)}</td>
                </tr>
                {data.values.exemptions.map((ex, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="text-muted-foreground py-1">Exemption ({ex.type})</td>
                    <td className="text-right font-mono text-emerald-600 dark:text-emerald-400">-{fmt(ex.amount)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="font-semibold text-foreground py-1">Taxable Value</td>
                  <td className="text-right font-mono font-bold text-foreground text-sm">{fmt(data.values.taxableValue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Row 5: Sales History & Inspections */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="border border-border rounded p-2.5">
            <h4 className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold border-b border-border pb-1 mb-2">Sales History</h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-muted-foreground font-medium py-1">Date</th>
                  <th className="text-right text-muted-foreground font-medium">Price</th>
                  <th className="text-right text-muted-foreground font-medium">Ratio</th>
                  <th className="text-right text-muted-foreground font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {data.sales.map((sale, i) => (
                  <tr key={i} className="border-b border-border/30">
                    <td className="text-foreground py-1">{sale.date}</td>
                    <td className="text-right font-mono text-foreground">{fmt(sale.price)}</td>
                    <td className="text-right font-mono text-foreground">{sale.ratio.toFixed(3)}</td>
                    <td className="text-right text-muted-foreground text-[10px]">{sale.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border border-border rounded p-2.5">
            <h4 className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold border-b border-border pb-1 mb-2">Inspection History</h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-muted-foreground font-medium py-1">Date</th>
                  <th className="text-left text-muted-foreground font-medium">Type</th>
                  <th className="text-right text-muted-foreground font-medium">Inspector</th>
                </tr>
              </thead>
              <tbody>
                {data.inspections.map((insp, i) => (
                  <tr key={i} className="border-b border-border/30">
                    <td className="text-foreground py-1">{insp.date}</td>
                    <td className="text-foreground">{insp.type}</td>
                    <td className="text-right text-muted-foreground">{insp.inspector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-foreground pt-2 mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Benton County Assessor&apos;s Office | 620 Market Street, Prosser, WA 99350</span>
          <span>This record is for assessment purposes only and does not constitute a legal document.</span>
        </div>
      </div>
    </div>
  );
}
