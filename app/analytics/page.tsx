"use client";

import useSWR from "swr";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  MARKET_TREND_DATA,
  AGENT_PERFORMANCE_DATA,
  ETL_THROUGHPUT_DATA,
  PROPERTY_DISTRIBUTION_DATA,
  CITY_BREAKDOWN_DATA,
} from "@/lib/mock-chart-data";
import { TrendingUp, BarChart3, Activity, PieChartIcon, Database, Download } from "lucide-react";
import { RatioStudyDashboard } from "@/components/ratio-study-dashboard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-[10px] font-medium text-muted-foreground">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs font-semibold" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" && entry.value > 1000
            ? `$${(entry.value / 1000).toFixed(0)}k`
            : entry.value}
        </p>
      ))}
    </div>
  );
}

const CHART_PRIMARY = "hsl(193 100% 42%)";
const CHART_SUCCESS = "hsl(134 61% 41%)";
const CHART_WARNING = "hsl(45 100% 51%)";
const CHART_ERROR = "hsl(354 70% 54%)";
const CHART_MUTED = "hsl(210 17% 57%)";
const GRID_COLOR = "hsl(213 28% 26%)";
const TEXT_COLOR = "hsl(210 17% 57%)";

const TYPE_COLORS: Record<string, string> = {
  single_family: CHART_PRIMARY,
  condo: CHART_SUCCESS,
  townhouse: CHART_WARNING,
  multi_family: CHART_ERROR,
  land: CHART_MUTED,
};

const TYPE_LABELS: Record<string, string> = {
  single_family: "Single Family",
  condo: "Condo",
  townhouse: "Townhouse",
  multi_family: "Multi-Family",
  land: "Land",
};

export default function AnalyticsPage() {
  const { data: analyticsData } = useSWR("/api/analytics", fetcher, {
    revalidateOnFocus: false,
  });

  const isFromDB = analyticsData?.dataSource === "postgresql";

  // Build property type donut data from DB or fallback to mock
  const propertyTypeData = isFromDB && analyticsData?.properties?.byType?.length
    ? analyticsData.properties.byType.map((row: { property_type: string; count: string }) => ({
        type: TYPE_LABELS[row.property_type] || row.property_type,
        count: Number(row.count),
        fill: TYPE_COLORS[row.property_type] || CHART_MUTED,
      }))
    : PROPERTY_DISTRIBUTION_DATA;

  // Build city breakdown data from DB with per-status counts, or fallback to mock
  const cityData = (() => {
    const byCityStatus = analyticsData?.properties?.byCityStatus;
    if (!isFromDB || !byCityStatus?.length) return CITY_BREAKDOWN_DATA;
    const cityMap: Record<string, { city: string; active: number; sold: number; pending: number }> = {};
    for (const row of byCityStatus as { city: string; status: string; count: number }[]) {
      if (!cityMap[row.city]) cityMap[row.city] = { city: row.city, active: 0, sold: 0, pending: 0 };
      const s = row.status.toLowerCase();
      if (s === "active" || s === "new") cityMap[row.city].active += Number(row.count);
      else if (s === "sold") cityMap[row.city].sold += Number(row.count);
      else if (s === "pending") cityMap[row.city].pending += Number(row.count);
      else cityMap[row.city].active += Number(row.count);
    }
    return Object.values(cityMap);
  })();

  // Market snapshot stats from DB
  const priceStats = analyticsData?.properties?.priceStats;
  const totalListings = priceStats?.total ? Number(priceStats.total) : null;
  const avgPrice = priceStats?.avg_price ? Number(priceStats.avg_price) : null;
  const minPrice = priceStats?.min_price ? Number(priceStats.min_price) : null;
  const maxPrice = priceStats?.max_price ? Number(priceStats.max_price) : null;

  return (
    <div className="grid-bg min-h-full px-6 py-6">
      <div className="flex flex-col gap-6">
        {/* Market Snapshot Summary */}
        {isFromDB && priceStats && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Market Snapshot</h2>
              <a
                href="/api/properties/export"
                download
                className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Download className="h-3 w-3" />
                Export CSV
              </a>
            </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SnapshotCard label="Total Listings" value={totalListings?.toLocaleString() ?? "--"} sub="In database" color="text-primary" />
            <SnapshotCard label="Average Price" value={avgPrice ? `$${(avgPrice / 1000).toFixed(0)}k` : "--"} sub="Across all properties" color="text-[hsl(var(--success))]" />
            <SnapshotCard label="Price Range" value={minPrice && maxPrice ? `$${(minPrice / 1000).toFixed(0)}k - $${(maxPrice / 1000).toFixed(0)}k` : "--"} sub="Low to high" color="text-[hsl(var(--warning))]" />
            <SnapshotCard label="Cities" value={cityData.length.toString()} sub="Active markets" color="text-primary" />
          </div>
          </div>
        )}

        {/* Benton County IAAO Ratio Study */}
        <RatioStudyDashboard />

        {/* Top row: Market Trend + Property Distribution */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="col-span-2 rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Market Trend - Median Home Price</h3>
              <span className="ml-auto text-[10px] text-muted-foreground">Last 12 months</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={MARKET_TREND_DATA}>
                <defs>
                  <linearGradient id="colorMedian" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_PRIMARY} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_PRIMARY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: TEXT_COLOR }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: TEXT_COLOR }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="median" name="Median Price" stroke={CHART_PRIMARY} fill="url(#colorMedian)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Property Types</h3>
              {isFromDB && (
                <span className="ml-auto flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary">
                  <Database className="h-2.5 w-2.5" /> Live
                </span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={propertyTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count" nameKey="type">
                  {propertyTypeData.map((entry: { fill: string }, i: number) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
              {propertyTypeData.map((entry: { type: string; fill: string }) => (
                <div key={entry.type} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                  <span className="text-[10px] text-muted-foreground">{entry.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle row: Agent Performance + City Breakdown */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Agent Performance</h3>
              <span className="ml-auto text-[10px] text-muted-foreground">Tasks/hour</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={AGENT_PERFORMANCE_DATA} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis dataKey="agent" tick={{ fontSize: 9, fill: TEXT_COLOR }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: TEXT_COLOR }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="tasksPerHour" name="Tasks/hr" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
                <Bar dataKey="successRate" name="Success %" fill={CHART_SUCCESS} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Listings by City</h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cityData}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis dataKey="city" tick={{ fontSize: 10, fill: TEXT_COLOR }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: TEXT_COLOR }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: "10px" }} />
                <Bar dataKey="active" name="Active" stackId="a" fill={CHART_PRIMARY} radius={[0, 0, 0, 0]} />
                <Bar dataKey="sold" name="Sold" stackId="a" fill={CHART_SUCCESS} />
                <Bar dataKey="pending" name="Pending" stackId="a" fill={CHART_WARNING} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom row: ETL Throughput */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">ETL Throughput</h3>
            <span className="ml-auto text-[10px] text-muted-foreground">Records processed per hour (last 24h)</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ETL_THROUGHPUT_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: TEXT_COLOR }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: TEXT_COLOR }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="records" name="Records" stroke={CHART_PRIMARY} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="errors" name="Errors" stroke={CHART_ERROR} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function SnapshotCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`text-xl font-bold ${color}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground">{sub}</span>
    </div>
  );
}
