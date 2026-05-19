"use client";

import { useState } from "react";
import {
  FileText,
  Printer,
  Download,
  Mail,
  Calendar,
  DollarSign,
  Home,
  Building2,
  User,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

interface TaxStatementData {
  taxYear: number;
  parcelNumber: string;
  accountNumber: string;
  ownerName: string;
  mailingAddress: string;
  propertyAddress: string;
  legalDescription: string;
  propertyClass: string;
  assessedLand: number;
  assessedImprove: number;
  totalAssessed: number;
  exemptions: number;
  taxableValue: number;
  levies: {
    district: string;
    rate: number;
    amount: number;
  }[];
  specialAssessments: {
    description: string;
    amount: number;
  }[];
  totalTax: number;
  payments: {
    date: string;
    amount: number;
    type: string;
    confirmationNumber: string;
  }[];
  dueDate1: string;
  dueDate2: string;
  halfPayment: number;
  status: "current" | "delinquent" | "paid";
  priorYearComparison: {
    assessed: number;
    tax: number;
  };
}

interface TaxStatementPreviewProps {
  propertyId: string;
  className?: string;
}

const MOCK_STATEMENT: TaxStatementData = {
  taxYear: 2026,
  parcelNumber: "1-2345-678-9012-001",
  accountNumber: "TAX-2026-001234",
  ownerName: "John & Mary Smith",
  mailingAddress: "1425 Columbia Park Trail\nRichland, WA 99352",
  propertyAddress: "1425 Columbia Park Trail, Richland, WA 99352",
  legalDescription: "LOT 15 BLOCK 3 COLUMBIA PARK ESTATES DIV 2",
  propertyClass: "Residential - Single Family",
  assessedLand: 85000,
  assessedImprove: 276250,
  totalAssessed: 361250,
  exemptions: 50000,
  taxableValue: 311250,
  levies: [
    { district: "Benton County", rate: 1.45, amount: 451.31 },
    { district: "Richland School District", rate: 4.82, amount: 1500.23 },
    { district: "Fire District #4", rate: 1.25, amount: 389.06 },
    { district: "Port of Benton", rate: 0.45, amount: 140.06 },
    { district: "Mid-Columbia Library", rate: 0.50, amount: 155.63 },
    { district: "Richland Parks & Rec", rate: 0.35, amount: 108.94 },
    { district: "Road District #1", rate: 0.65, amount: 202.31 },
    { district: "State School Fund", rate: 2.35, amount: 731.44 },
  ],
  specialAssessments: [
    { description: "LID #2024-001 Sewer Extension", amount: 125.00 },
  ],
  totalTax: 3803.98,
  payments: [
    {
      date: "2026-04-30",
      amount: 1901.99,
      type: "1st Half Payment",
      confirmationNumber: "PMT-2026-45678",
    },
  ],
  dueDate1: "2026-04-30",
  dueDate2: "2026-10-31",
  halfPayment: 1901.99,
  status: "current",
  priorYearComparison: {
    assessed: 342500,
    tax: 3612.45,
  },
};

export function TaxStatementPreview({ propertyId, className }: TaxStatementPreviewProps) {
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const statement = MOCK_STATEMENT;

  const paidAmount = statement.payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = statement.totalTax - paidAmount;
  const assessedChange = ((statement.totalAssessed - statement.priorYearComparison.assessed) / statement.priorYearComparison.assessed) * 100;
  const taxChange = ((statement.totalTax - statement.priorYearComparison.tax) / statement.priorYearComparison.tax) * 100;

  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
            <FileText className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Tax Statement Preview</h3>
            <p className="text-sm text-muted-foreground">
              Tax Year {statement.taxYear} | Account #{statement.accountNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">
            <Mail className="h-3.5 w-3.5" />
            Email
          </button>
          <button className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
          <button className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Statement Content */}
      <div className="p-4">
        {/* Status Banner */}
        <div
          className={cn(
            "mb-4 flex items-center justify-between rounded-lg p-4",
            statement.status === "paid"
              ? "bg-green-500/10"
              : statement.status === "current"
              ? "bg-blue-500/10"
              : "bg-red-500/10"
          )}
        >
          <div className="flex items-center gap-3">
            {statement.status === "paid" ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : statement.status === "current" ? (
              <Clock className="h-5 w-5 text-blue-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <p className="font-medium capitalize">
                {statement.status === "paid"
                  ? "Paid in Full"
                  : statement.status === "current"
                  ? "Current - 2nd Half Due"
                  : "Delinquent"}
              </p>
              <p className="text-sm text-muted-foreground">
                {statement.status === "current" && `Due by ${new Date(statement.dueDate2).toLocaleDateString()}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Remaining Balance</p>
            <p className="text-2xl font-bold">${formatNumber(remainingBalance)}</p>
          </div>
        </div>

        {/* Property & Owner Info */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Owner Information</span>
            </div>
            <p className="font-medium">{statement.ownerName}</p>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{statement.mailingAddress}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Property Information</span>
            </div>
            <p className="font-medium">{statement.propertyAddress}</p>
            <p className="text-sm text-muted-foreground">Parcel: {statement.parcelNumber}</p>
            <p className="text-sm text-muted-foreground">{statement.propertyClass}</p>
          </div>
        </div>

        {/* Assessment Summary */}
        <div className="mb-6">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Assessment Summary
          </h4>
          <div className="rounded-lg border border-border bg-background">
            <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Land Value</p>
                <p className="font-medium">${formatNumber(statement.assessedLand)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Improvement Value</p>
                <p className="font-medium">${formatNumber(statement.assessedImprove)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Assessed</p>
                <p className="font-medium">${formatNumber(statement.totalAssessed)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">YoY Change</p>
                <p className={cn("font-medium", assessedChange >= 0 ? "text-red-500" : "text-green-500")}>
                  {assessedChange >= 0 ? "+" : ""}{assessedChange.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">Exemptions:</span>
                <span className="font-medium text-green-500">-${formatNumber(statement.exemptions)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Taxable Value:</span>
                <span className="font-bold">${formatNumber(statement.taxableValue)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tax Levy Breakdown */}
        <div className="mb-6">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Tax Levy Breakdown
          </h4>
          <div className="rounded-lg border border-border bg-background">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-3 text-left font-medium">Taxing District</th>
                  <th className="p-3 text-right font-medium">Rate (mills)</th>
                  <th className="p-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {statement.levies.map((levy, idx) => (
                  <tr key={idx} className="border-b border-border last:border-0">
                    <td className="p-3">{levy.district}</td>
                    <td className="p-3 text-right">{levy.rate.toFixed(2)}</td>
                    <td className="p-3 text-right font-medium">${levy.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 font-medium">
                  <td className="p-3">Subtotal - Regular Levies</td>
                  <td className="p-3 text-right">
                    {statement.levies.reduce((sum, l) => sum + l.rate, 0).toFixed(2)}
                  </td>
                  <td className="p-3 text-right">
                    ${statement.levies.reduce((sum, l) => sum + l.amount, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Special Assessments */}
        {statement.specialAssessments.length > 0 && (
          <div className="mb-6">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Special Assessments
            </h4>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5">
              {statement.specialAssessments.map((sa, idx) => (
                <div key={idx} className="flex items-center justify-between p-3">
                  <span>{sa.description}</span>
                  <span className="font-medium">${sa.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total Tax */}
        <div className="mb-6 rounded-lg border-2 border-primary bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Tax Due for {statement.taxYear}</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold">${formatNumber(statement.totalTax)}</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    taxChange >= 0 ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                  )}
                >
                  {taxChange >= 0 ? "+" : ""}{taxChange.toFixed(1)}% from prior year
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Half Payment Amount</p>
              <p className="text-xl font-medium">${formatNumber(statement.halfPayment)}</p>
            </div>
          </div>
        </div>

        {/* Payment Due Dates */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">1st Half Due Date</p>
              <p className="font-medium">{new Date(statement.dueDate1).toLocaleDateString()}</p>
            </div>
            <CheckCircle2 className="ml-auto h-5 w-5 text-green-500" />
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">2nd Half Due Date</p>
              <p className="font-medium">{new Date(statement.dueDate2).toLocaleDateString()}</p>
            </div>
            <Clock className="ml-auto h-5 w-5 text-blue-500" />
          </div>
        </div>

        {/* Payment History */}
        <div>
          <button
            onClick={() => setShowPaymentHistory(!showPaymentHistory)}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-background p-4 hover:bg-muted/30"
          >
            <span className="font-medium">Payment History ({statement.payments.length})</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", showPaymentHistory && "rotate-180")} />
          </button>

          {showPaymentHistory && (
            <div className="mt-2 rounded-lg border border-border bg-background">
              {statement.payments.length > 0 ? (
                statement.payments.map((payment, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border-b border-border p-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{payment.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.date).toLocaleDateString()} | Conf# {payment.confirmationNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-500">${formatNumber(payment.amount)}</p>
                      <p className="text-xs text-muted-foreground">Paid</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-4 text-center text-sm text-muted-foreground">No payments recorded</p>
              )}
            </div>
          )}
        </div>

        {/* Payment Button */}
        {remainingBalance > 0 && (
          <div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-background p-4">
            <div>
              <p className="font-medium">Make a Payment</p>
              <p className="text-sm text-muted-foreground">Pay online or view payment options</p>
            </div>
            <button className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Pay ${formatNumber(remainingBalance)}
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Legal Description Footer */}
      <div className="border-t border-border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Legal Description:</strong> {statement.legalDescription}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          This statement is for informational purposes only. For official tax information, please contact the
          Benton County Treasurer&apos;s Office.
        </p>
      </div>
    </div>
  );
}
