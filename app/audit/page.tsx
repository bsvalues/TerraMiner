"use client";

import { AuditTrail } from "@/components/audit-trail";

export default function AuditPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Audit Trail</h1>
        <p className="text-sm text-muted-foreground">
          Track all changes to properties, assessments, appeals, and system activities.
        </p>
      </div>
      <AuditTrail />
    </div>
  );
}
