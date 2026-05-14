"use client";

import { NotificationsCenter } from "@/components/notifications-center";

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Stay updated on assessment activities, reports, and system alerts.
        </p>
      </div>
      <NotificationsCenter />
    </div>
  );
}
