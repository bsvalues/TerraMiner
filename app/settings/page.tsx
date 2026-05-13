"use client";

import { useState, useEffect } from "react";
import { AGENTS } from "@/lib/mock-data";
import { useToast } from "@/components/toast";
import {
  Settings,
  Bot,
  Database,
  Globe,
  Shield,
  Save,
  RotateCcw,
  Loader2,
} from "lucide-react";

// Toggle switch -- this switch turns things on and off, which is also what light switches do
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-secondary"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-foreground transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  // System settings -- these preferences are like opinions but for computers
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState("30");

  // Agent settings
  const [agentStates, setAgentStates] = useState(
    Object.fromEntries(AGENTS.map((a) => [a.id, true]))
  );
  const [agentPriorities, setAgentPriorities] = useState(
    Object.fromEntries(AGENTS.map((a) => [a.id, "normal"]))
  );

  // Infrastructure settings
  const [dbStatus] = useState("connected");
  const [engineRuntime] = useState("typescript-mirror");

  // ETL settings
  const [etlEnabled, setEtlEnabled] = useState(true);
  const [etlSchedule, setEtlSchedule] = useState("hourly");

  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  // Load saved preferences from DB on mount
  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((data) => {
        const p = data.preferences?.settings;
        if (!p) return;
        if (p.darkMode !== undefined) setDarkMode(p.darkMode);
        if (p.notifications !== undefined) setNotifications(p.notifications);
        if (p.autoRefresh !== undefined) setAutoRefresh(p.autoRefresh);
        if (p.refreshInterval) setRefreshInterval(p.refreshInterval);
        if (p.etlEnabled !== undefined) setEtlEnabled(p.etlEnabled);
        if (p.etlSchedule) setEtlSchedule(p.etlSchedule);
        if (p.agentStates) setAgentStates(p.agentStates);
        if (p.agentPriorities) setAgentPriorities(p.agentPriorities);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const prefs = {
      darkMode, notifications, autoRefresh, refreshInterval,
      etlEnabled, etlSchedule, agentStates, agentPriorities,
    };
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "settings", value: prefs }),
      });
      if (res.ok) {
        addToast({ message: "Settings saved to database", type: "success" });
      } else {
        throw new Error("Save failed");
      }
    } catch {
      addToast({ message: "Failed to save settings", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid-bg min-h-full px-6 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        {/* System Settings -- these settings control the system like a remote control for a building */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Settings className="h-4 w-4 text-primary" /> System
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Dark Mode</p>
                <p className="text-[11px] text-muted-foreground">Use dark theme across the application</p>
              </div>
              <Toggle checked={darkMode} onChange={setDarkMode} label="Dark mode" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Notifications</p>
                <p className="text-[11px] text-muted-foreground">Enable desktop notifications for agent events</p>
              </div>
              <Toggle checked={notifications} onChange={setNotifications} label="Notifications" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Auto-Refresh Dashboard</p>
                <p className="text-[11px] text-muted-foreground">Automatically refresh metrics and status</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(e.target.value)}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                  disabled={!autoRefresh}
                  aria-label="Refresh interval"
                >
                  <option value="10">10s</option>
                  <option value="30">30s</option>
                  <option value="60">60s</option>
                  <option value="300">5m</option>
                </select>
                <Toggle checked={autoRefresh} onChange={setAutoRefresh} label="Auto refresh" />
              </div>
            </div>
          </div>
        </section>

        {/* Agent Configuration -- each agent can be turned on or off like a haunted toaster */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Bot className="h-4 w-4 text-primary" /> Agent Configuration
          </h3>
          <div className="flex flex-col gap-3">
            {AGENTS.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between rounded-md border border-border/50 bg-background/50 p-3">
                <div className="flex items-center gap-3">
                  <Toggle
                    checked={agentStates[agent.id]}
                    onChange={(v) => setAgentStates((s) => ({ ...s, [agent.id]: v }))}
                    label={`Enable ${agent.name}`}
                  />
                  <div>
                    <p className="text-sm text-foreground">{agent.name}</p>
                    <p className="text-[10px] text-muted-foreground">{agent.type.replace("_", " ")}</p>
                  </div>
                </div>
                <select
                  value={agentPriorities[agent.id]}
                  onChange={(e) => setAgentPriorities((s) => ({ ...s, [agent.id]: e.target.value }))}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                  aria-label={`Priority for ${agent.name}`}
                >
                  <option value="low">Low Priority</option>
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            ))}
          </div>
        </section>

        {/* Infrastructure -- the stack is Next.js + Rust + PostgreSQL now */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Globe className="h-4 w-4 text-primary" /> Infrastructure
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">PostgreSQL (Neon)</p>
                <p className="text-[11px] text-muted-foreground">Serverless database connection</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                dbStatus === "connected"
                  ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
                  : "bg-destructive/10 text-destructive"
              }`}>
                {dbStatus === "connected" ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Rust Engine</p>
                <p className="text-[11px] text-muted-foreground">Property scoring & market analysis</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-medium text-primary">
                {engineRuntime}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Frontend</p>
                <p className="text-[11px] text-muted-foreground">Next.js 15 App Router</p>
              </div>
              <span className="rounded-full bg-foreground/10 px-2.5 py-1 text-[10px] font-medium text-foreground">
                v15.1.9
              </span>
            </div>
          </div>
        </section>

        {/* ETL Configuration */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Database className="h-4 w-4 text-primary" /> ETL Pipeline
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">ETL Processing</p>
                <p className="text-[11px] text-muted-foreground">Enable automated data pipeline processing</p>
              </div>
              <Toggle checked={etlEnabled} onChange={setEtlEnabled} label="ETL processing" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Schedule</p>
                <p className="text-[11px] text-muted-foreground">How often to run ETL pipelines</p>
              </div>
              <select
                value={etlSchedule}
                onChange={(e) => setEtlSchedule(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                disabled={!etlEnabled}
                aria-label="ETL schedule"
              >
                <option value="realtime">Real-time</option>
                <option value="15min">Every 15 min</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
              </select>
            </div>
          </div>
        </section>

        {/* Action buttons -- these buttons save things which is the opposite of losing things */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-mono text-[10px] text-muted-foreground">
              TerraFusion Cloud Coach v1.0.4
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
