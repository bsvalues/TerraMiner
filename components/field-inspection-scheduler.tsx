"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Plus,
  Camera,
  ClipboardList,
  Car,
  Phone,
} from "lucide-react";

interface Inspection {
  id: string;
  propertyId: string;
  address: string;
  city: string;
  scheduledDate: string;
  scheduledTime: string;
  inspector: string;
  type: "routine" | "appeal" | "new_construction" | "permit" | "recheck";
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "rescheduled";
  priority: "low" | "medium" | "high" | "urgent";
  notes?: string;
  estimatedDuration: number; // minutes
  contactName?: string;
  contactPhone?: string;
}

const MOCK_INSPECTIONS: Inspection[] = [
  {
    id: "insp-001",
    propertyId: "prop-001",
    address: "1425 Columbia Park Trail",
    city: "Richland",
    scheduledDate: "2026-05-14",
    scheduledTime: "09:00",
    inspector: "Sarah Chen",
    type: "routine",
    status: "scheduled",
    priority: "medium",
    notes: "Annual revaluation inspection",
    estimatedDuration: 45,
    contactName: "John Smith",
    contactPhone: "(509) 555-0123",
  },
  {
    id: "insp-002",
    propertyId: "prop-002",
    address: "2890 Bombing Range Rd",
    city: "West Richland",
    scheduledDate: "2026-05-14",
    scheduledTime: "10:30",
    inspector: "Sarah Chen",
    type: "appeal",
    status: "in_progress",
    priority: "high",
    notes: "Property owner appealing 2025 assessment",
    estimatedDuration: 60,
    contactName: "Jane Doe",
    contactPhone: "(509) 555-0456",
  },
  {
    id: "insp-003",
    propertyId: "prop-003",
    address: "456 Keene Rd",
    city: "Richland",
    scheduledDate: "2026-05-14",
    scheduledTime: "13:00",
    inspector: "Mike Rodriguez",
    type: "new_construction",
    status: "scheduled",
    priority: "high",
    notes: "Final inspection for new build",
    estimatedDuration: 90,
  },
  {
    id: "insp-004",
    propertyId: "prop-004",
    address: "789 George Washington Way",
    city: "Richland",
    scheduledDate: "2026-05-15",
    scheduledTime: "08:30",
    inspector: "Sarah Chen",
    type: "permit",
    status: "scheduled",
    priority: "medium",
    notes: "Addition permit - verify completion",
    estimatedDuration: 30,
  },
  {
    id: "insp-005",
    propertyId: "prop-005",
    address: "1200 Stevens Dr",
    city: "Richland",
    scheduledDate: "2026-05-13",
    scheduledTime: "14:00",
    inspector: "Lisa Park",
    type: "recheck",
    status: "completed",
    priority: "low",
    notes: "Follow-up on previous inspection findings",
    estimatedDuration: 30,
  },
];

const TYPE_CONFIG = {
  routine: { label: "Routine", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  appeal: { label: "Appeal", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  new_construction: { label: "New Construction", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  permit: { label: "Permit", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  recheck: { label: "Recheck", color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
};

const STATUS_CONFIG = {
  scheduled: { label: "Scheduled", icon: Clock, color: "text-blue-500" },
  in_progress: { label: "In Progress", icon: AlertCircle, color: "text-amber-500" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-emerald-500" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-red-500" },
  rescheduled: { label: "Rescheduled", icon: Calendar, color: "text-purple-500" },
};

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-slate-100 text-slate-600" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-600" },
  high: { label: "High", color: "bg-amber-100 text-amber-600" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-600" },
};

interface FieldInspectionSchedulerProps {
  propertyId?: string;
  compact?: boolean;
  className?: string;
}

export function FieldInspectionScheduler({
  propertyId,
  compact = false,
  className = "",
}: FieldInspectionSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<string>("2026-05-14");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredInspections = MOCK_INSPECTIONS.filter((insp) => {
    if (propertyId && insp.propertyId !== propertyId) return false;
    if (statusFilter !== "all" && insp.status !== statusFilter) return false;
    return true;
  });

  const todayInspections = filteredInspections.filter(
    (insp) => insp.scheduledDate === selectedDate
  );

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const formatDate = (date: string) => {
    return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (compact) {
    const upcomingInspections = MOCK_INSPECTIONS.filter(
      (insp) =>
        (!propertyId || insp.propertyId === propertyId) &&
        (insp.status === "scheduled" || insp.status === "in_progress")
    ).slice(0, 3);

    return (
      <div className={`rounded-xl border border-border bg-card p-5 ${className}`}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
              <Calendar className="h-4 w-4 text-cyan-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Inspections</h3>
              <p className="text-xs text-muted-foreground">
                {upcomingInspections.length} upcoming
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex h-7 items-center gap-1 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3 w-3" />
            Schedule
          </button>
        </div>

        {upcomingInspections.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No upcoming inspections
          </p>
        ) : (
          <div className="space-y-2">
            {upcomingInspections.map((insp) => {
              const StatusIcon = STATUS_CONFIG[insp.status].icon;
              return (
                <div
                  key={insp.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-2.5"
                >
                  <StatusIcon
                    className={`h-4 w-4 ${STATUS_CONFIG[insp.status].color}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {insp.address}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDate(insp.scheduledDate)} at {formatTime(insp.scheduledTime)}
                    </p>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${TYPE_CONFIG[insp.type].color}`}
                  >
                    {TYPE_CONFIG[insp.type].label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
            <Calendar className="h-5 w-5 text-cyan-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Field Inspection Schedule
            </h2>
            <p className="text-xs text-muted-foreground">
              {todayInspections.length} inspections for {formatDate(selectedDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "calendar"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Calendar
            </button>
          </div>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Schedule Inspection
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="text-xs text-muted-foreground">Status:</span>
        {["all", "scheduled", "in_progress", "completed"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              statusFilter === status
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {status === "all"
              ? "All"
              : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}
          </button>
        ))}
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <button
          onClick={() => {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() - 1);
            setSelectedDate(d.toISOString().split("T")[0]);
          }}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
        </button>
        <div className="flex gap-1">
          {[-2, -1, 0, 1, 2].map((offset) => {
            const d = new Date("2026-05-14");
            d.setDate(d.getDate() + offset);
            const dateStr = d.toISOString().split("T")[0];
            const isSelected = dateStr === selectedDate;
            const isToday = offset === 0;
            return (
              <button
                key={offset}
                onClick={() => setSelectedDate(dateStr)}
                className={`flex flex-col items-center rounded-lg px-3 py-1.5 transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <span className="text-[10px] font-medium uppercase">
                  {d.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className={`text-sm font-semibold ${isToday && !isSelected ? "text-primary" : ""}`}>
                  {d.getDate()}
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() + 1);
            setSelectedDate(d.toISOString().split("T")[0]);
          }}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Inspection List */}
      <div className="max-h-[500px] overflow-y-auto p-4">
        {todayInspections.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No inspections scheduled for this date
            </p>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="mt-3 text-xs font-medium text-primary hover:underline"
            >
              Schedule an inspection
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {todayInspections.map((insp) => {
              const StatusIcon = STATUS_CONFIG[insp.status].icon;
              const isExpanded = expandedId === insp.id;

              return (
                <div
                  key={insp.id}
                  className="overflow-hidden rounded-xl border border-border bg-muted/20"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : insp.id)}
                    className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/50"
                  >
                    {/* Time */}
                    <div className="w-16 shrink-0 text-center">
                      <p className="text-sm font-semibold text-foreground">
                        {formatTime(insp.scheduledTime)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {insp.estimatedDuration} min
                      </p>
                    </div>

                    {/* Status indicator */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        insp.status === "completed"
                          ? "bg-emerald-500/10"
                          : insp.status === "in_progress"
                          ? "bg-amber-500/10"
                          : "bg-blue-500/10"
                      }`}
                    >
                      <StatusIcon
                        className={`h-4 w-4 ${STATUS_CONFIG[insp.status].color}`}
                      />
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {insp.address}
                        </p>
                        <span
                          className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${TYPE_CONFIG[insp.type].color}`}
                        >
                          {TYPE_CONFIG[insp.type].label}
                        </span>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_CONFIG[insp.priority].color}`}
                        >
                          {PRIORITY_CONFIG[insp.priority].label}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {insp.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {insp.inspector}
                        </span>
                      </div>
                    </div>

                    {/* Expand indicator */}
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/30 p-4">
                      {insp.notes && (
                        <p className="mb-3 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Notes:</span>{" "}
                          {insp.notes}
                        </p>
                      )}

                      {insp.contactName && (
                        <div className="mb-3 flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            {insp.contactName}
                          </span>
                          {insp.contactPhone && (
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              {insp.contactPhone}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <button className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                          <ClipboardList className="h-3.5 w-3.5" />
                          Start Inspection
                        </button>
                        <button className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
                          <Camera className="h-3.5 w-3.5" />
                          Take Photos
                        </button>
                        <button className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
                          <Car className="h-3.5 w-3.5" />
                          Get Directions
                        </button>
                        <button className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
                          <Calendar className="h-3.5 w-3.5" />
                          Reschedule
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Schedule Field Inspection
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  Property Address
                </label>
                <input
                  type="text"
                  placeholder="Enter property address"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">
                    Time
                  </label>
                  <input
                    type="time"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  Inspection Type
                </label>
                <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="routine">Routine</option>
                  <option value="appeal">Appeal</option>
                  <option value="new_construction">New Construction</option>
                  <option value="permit">Permit</option>
                  <option value="recheck">Recheck</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  Assign Inspector
                </label>
                <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="sarah">Sarah Chen</option>
                  <option value="mike">Mike Rodriguez</option>
                  <option value="lisa">Lisa Park</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Add inspection notes..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
