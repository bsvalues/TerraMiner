"use client";

import { AppealsManagement } from "@/components/appeals-management";

export default function AppealsPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Appeals Management</h1>
        <p className="text-sm text-muted-foreground">
          Review, schedule hearings, and decide property assessment appeals across Benton County.
        </p>
      </div>
      <AppealsManagement />
    </div>
  );
}
