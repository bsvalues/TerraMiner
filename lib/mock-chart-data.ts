// ============================================================================
// Mock chart data -- these numbers were born in a spreadsheet and raised by wolves
// ============================================================================

// Median home price over 12 months -- Tri-Cities WA market
export const MARKET_TREND_DATA = [
  { month: "Mar", median: 342000, listings: 145 },
  { month: "Apr", median: 348000, listings: 162 },
  { month: "May", median: 355000, listings: 178 },
  { month: "Jun", median: 368000, listings: 201 },
  { month: "Jul", median: 372000, listings: 195 },
  { month: "Aug", median: 379000, listings: 188 },
  { month: "Sep", median: 375000, listings: 172 },
  { month: "Oct", median: 371000, listings: 156 },
  { month: "Nov", median: 365000, listings: 134 },
  { month: "Dec", median: 358000, listings: 112 },
  { month: "Jan", median: 362000, listings: 128 },
  { month: "Feb", median: 369000, listings: 141 },
];

// Agent performance comparison
export const AGENT_PERFORMANCE_DATA = [
  { agent: "Market Analyzer", avgResponse: 1240, tasksPerHour: 42, successRate: 94 },
  { agent: "NL Search", avgResponse: 890, tasksPerHour: 58, successRate: 91 },
  { agent: "Recommendation", avgResponse: 1560, tasksPerHour: 35, successRate: 88 },
  { agent: "Summarizer", avgResponse: 680, tasksPerHour: 72, successRate: 96 },
];

// ETL throughput over 24 hours
export const ETL_THROUGHPUT_DATA = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, "0")}:00`,
  records: Math.floor(800 + Math.random() * 600 + (i >= 8 && i <= 18 ? 400 : 0)),
  errors: Math.floor(Math.random() * 15),
}));

// Property type distribution
export const PROPERTY_DISTRIBUTION_DATA = [
  { type: "Single Family", count: 847, fill: "hsl(193 100% 42%)" },
  { type: "Condo", count: 213, fill: "hsl(134 61% 41%)" },
  { type: "Townhouse", count: 156, fill: "hsl(45 100% 51%)" },
  { type: "Multi-Family", count: 89, fill: "hsl(354 70% 54%)" },
  { type: "Land", count: 45, fill: "hsl(213 28% 56%)" },
];

// City breakdown
export const CITY_BREAKDOWN_DATA = [
  { city: "Richland", active: 312, sold: 245, pending: 67 },
  { city: "Kennewick", active: 287, sold: 198, pending: 54 },
  { city: "Pasco", active: 198, sold: 156, pending: 38 },
  { city: "W. Richland", active: 145, sold: 112, pending: 28 },
];
