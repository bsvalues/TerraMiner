import type {
  Agent,
  ETLPipeline,
  SystemMetrics,
  ActivityLogEntry,
} from "./types";

// ============================================================================
// Mock Agents - Maps directly to the 4 Python agents in ai/agents/
// ============================================================================

export const AGENTS: Agent[] = [
  {
    id: "agent-market-analyzer",
    name: "Market Analyzer",
    type: "market_analyzer",
    status: "active",
    capabilities: [
      "analyze_market",
      "analyze_investment",
      "price_trends",
      "comparative_analysis",
    ],
    description:
      "Analyzes real estate market trends, investment opportunities, and price movement patterns across multiple data sources.",
    currentTask: null,
    tasksCompleted: 1247,
    avgResponseTime: 2340,
    lastActive: new Date(Date.now() - 30000).toISOString(),
  },
  {
    id: "agent-nl-search",
    name: "NL Search",
    type: "nl_search",
    status: "active",
    capabilities: [
      "search_properties",
      "answer_property_question",
      "semantic_search",
      "filter_properties",
    ],
    description:
      "Natural language property search engine that translates human queries into structured database searches with semantic understanding.",
    currentTask: null,
    tasksCompleted: 3891,
    avgResponseTime: 890,
    lastActive: new Date(Date.now() - 15000).toISOString(),
  },
  {
    id: "agent-recommendation",
    name: "Recommendation Engine",
    type: "recommendation",
    status: "idle",
    capabilities: [
      "get_recommendations",
      "similarity_scoring",
      "preference_matching",
      "portfolio_optimization",
    ],
    description:
      "AI-powered property recommendation engine using collaborative filtering and content-based algorithms to match properties to buyer profiles.",
    currentTask: null,
    tasksCompleted: 892,
    avgResponseTime: 1560,
    lastActive: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: "agent-text-summarizer",
    name: "Text Summarizer",
    type: "text_summarizer",
    status: "idle",
    capabilities: [
      "summarize_property",
      "generate_report",
      "executive_brief",
      "listing_description",
    ],
    description:
      "Generates concise property summaries, executive briefs, and human-readable reports from structured real estate data.",
    currentTask: null,
    tasksCompleted: 2156,
    avgResponseTime: 1120,
    lastActive: new Date(Date.now() - 60000).toISOString(),
  },
];

// ============================================================================
// ETL Pipelines - Matches the data sources referenced in the codebase
// ============================================================================

export const ETL_PIPELINES: ETLPipeline[] = [
  {
    id: "etl-zillow",
    source: "zillow",
    displayName: "Zillow Data Feed",
    status: "healthy",
    lastRun: new Date(Date.now() - 3600000).toISOString(),
    nextRun: new Date(Date.now() + 3600000).toISOString(),
    recordsProcessed: 48752,
    recordsTotal: 48752,
    errorRate: 0.02,
    avgProcessingTime: 12,
  },
  {
    id: "etl-pacmls",
    source: "pacmls",
    displayName: "PACMLS Listings",
    status: "healthy",
    lastRun: new Date(Date.now() - 1800000).toISOString(),
    nextRun: new Date(Date.now() + 5400000).toISOString(),
    recordsProcessed: 12340,
    recordsTotal: 12341,
    errorRate: 0.08,
    avgProcessingTime: 24,
  },
  {
    id: "etl-attom",
    source: "attom",
    displayName: "ATTOM Property Data",
    status: "degraded",
    lastRun: new Date(Date.now() - 7200000).toISOString(),
    nextRun: new Date(Date.now() + 1800000).toISOString(),
    recordsProcessed: 31200,
    recordsTotal: 35400,
    errorRate: 11.86,
    avgProcessingTime: 18,
  },
];

// ============================================================================
// System Metrics
// ============================================================================

export const SYSTEM_METRICS: SystemMetrics = {
  activeAgents: 2,
  totalAgents: 4,
  tasksProcessed: 8186,
  tasksToday: 127,
  uptime: 864000, // 10 days in seconds
  swarmEfficiency: 94.2,
  cpuUsage: 34,
  memoryUsage: 62,
  avgResponseTime: 1478,
};

// ============================================================================
// Activity Log
// ============================================================================

export function generateActivityLog(): ActivityLogEntry[] {
  const entries: ActivityLogEntry[] = [
    {
      id: "log-1",
      timestamp: new Date(Date.now() - 5000).toISOString(),
      type: "agent_action",
      agent: "NL Search",
      message: 'Property search completed: "3BR homes near Richland WA" - 24 results',
      severity: "success",
    },
    {
      id: "log-2",
      timestamp: new Date(Date.now() - 15000).toISOString(),
      type: "task_completed",
      agent: "Market Analyzer",
      message: "Market trend analysis for Benton County completed in 2.3s",
      severity: "success",
    },
    {
      id: "log-3",
      timestamp: new Date(Date.now() - 30000).toISOString(),
      type: "system_event",
      agent: null,
      message: "ATTOM ETL pipeline reporting elevated error rate (11.86%)",
      severity: "warning",
    },
    {
      id: "log-4",
      timestamp: new Date(Date.now() - 45000).toISOString(),
      type: "swarm_event",
      agent: null,
      message: 'Ralph Wiggum Mode: Swarm task decomposed into 4 parallel subtasks',
      severity: "info",
    },
    {
      id: "log-5",
      timestamp: new Date(Date.now() - 60000).toISOString(),
      type: "agent_action",
      agent: "Text Summarizer",
      message: "Executive brief generated for property portfolio #TF-2847",
      severity: "success",
    },
    {
      id: "log-6",
      timestamp: new Date(Date.now() - 90000).toISOString(),
      type: "agent_action",
      agent: "Recommendation Engine",
      message: "Generated 8 property recommendations for buyer profile BP-1192",
      severity: "success",
    },
    {
      id: "log-7",
      timestamp: new Date(Date.now() - 120000).toISOString(),
      type: "system_event",
      agent: null,
      message: "Zillow ETL sync completed: 48,752 records processed",
      severity: "info",
    },
    {
      id: "log-8",
      timestamp: new Date(Date.now() - 180000).toISOString(),
      type: "task_completed",
      agent: "Market Analyzer",
      message: "Investment analysis: Richland WA market scored 8.2/10 for rental ROI",
      severity: "success",
    },
  ];
  return entries;
}

// ============================================================================
// Swarm Task Decomposition Examples
// ============================================================================

export const EXAMPLE_QUERIES = [
  "Analyze investment opportunities in Richland WA under $400k with good rental potential",
  "Find 3-bedroom homes near good schools in Kennewick with recent price drops",
  "Compare market trends between Richland, Kennewick, and Pasco for the last 6 months",
  "Generate a comprehensive report on waterfront properties in Benton County",
  "What are the best neighborhoods for first-time buyers in the Tri-Cities area?",
];
