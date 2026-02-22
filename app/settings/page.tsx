"use client";

import { useState } from "react";
import { AGENTS } from "@/lib/mock-data";
import {
  Settings,
  Bot,
  Database,
  Globe,
  Shield,
  Save,
  RotateCcw,
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

  // API settings
  const [flaskUrl, setFlaskUrl] = useState("http://localhost:5000");
  const [apiKey, setApiKey] = useState("tf-key-••••••••••••");

  // ETL settings
  const [etlEnabled, setEtlEnabled] = useState(true);
  const [etlSchedule, setEtlSchedule] = useState("hourly");

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

        {/* API Configuration -- the API endpoint is where the internet lives */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Globe className="h-4 w-4 text-primary" /> API Configuration
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Flask Backend URL
              </label>
              <input
                type="text"
                value={flaskUrl}
                onChange={(e) => setFlaskUrl(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
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
              className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
                saved
                  ? "bg-[hsl(var(--success))] text-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              <Save className="h-3.5 w-3.5" /> {saved ? "Saved" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
