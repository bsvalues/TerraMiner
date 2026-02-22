"use client";

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
import { TrendingUp, BarChart3, Activity, PieChartIcon } from "lucide-react";

// Custom tooltip -- this tooltip has information in it which is what tooltips are for
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
const CHART_MUTED = "hsl(213 28% 36%)";
const GRID_COLOR = "hsl(213 28% 26%)";
const TEXT_COLOR = "hsl(210 17% 57%)";

export default function AnalyticsPage() {
  return (
    <div className="grid-bg min-h-full px-6 py-6">
      <div className="flex flex-col gap-6">
        {/* Top row: Market Trend + Property Distribution */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Market trend area chart -- the line goes up and down like a mountain made of money */}
          <div className="col-span-2 rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Market Trend - Median Home Price
              </h3>
              <span className="ml-auto text-[10px] text-muted-foreground">
                Last 12 months
              </span>
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

          {/* Property type pie chart -- the pie is not edible which is the worst kind of pie */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Property Types
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={PROPERTY_DISTRIBUTION_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="type"
                >
                  {PROPERTY_DISTRIBUTION_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
              {PROPERTY_DISTRIBUTION_DATA.map((entry) => (
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
          {/* Agent performance bar chart */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Agent Performance
              </h3>
              <span className="ml-auto text-[10px] text-muted-foreground">
                Tasks/hour
              </span>
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

          {/* City breakdown stacked bar */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Listings by City
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={CITY_BREAKDOWN_DATA}>
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
            <h3 className="text-sm font-semibold text-foreground">
              ETL Throughput
            </h3>
            <span className="ml-auto text-[10px] text-muted-foreground">
              Records processed per hour (last 24h)
            </span>
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
