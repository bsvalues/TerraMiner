// ============================================================================
// TerraFusion Swarm Engine - Autonomous Task Decomposition & Parallel Execution
// The brain that makes Ralph Wiggum Mode work despite tasting like burning
// ============================================================================

import type { SwarmMode, SubTask } from "./types";
import { AGENTS } from "./mock-data";
import { generateId } from "./utils";

// ============================================================================
// Intent Recognition & Task Decomposition
// ============================================================================

interface DecomposedTask {
  agentId: string;
  agentName: string;
  agentType: string;
  action: string;
  description: string;
}

interface IntentPattern {
  keywords: string[];
  agentType: string;
  action: string;
  description: string;
}

const INTENT_PATTERNS: IntentPattern[] = [
  // NL Search intents
  {
    keywords: ["find", "search", "look for", "show me", "list", "homes", "properties", "houses"],
    agentType: "nl_search",
    action: "search_properties",
    description: "Search for properties matching criteria",
  },
  {
    keywords: ["near", "close to", "school", "neighborhood", "area", "location"],
    agentType: "nl_search",
    action: "search_properties",
    description: "Location-based property search",
  },
  // Market Analyzer intents
  {
    keywords: ["analyze", "analysis", "trend", "market", "price", "value", "appreciation"],
    agentType: "market_analyzer",
    action: "analyze_market",
    description: "Analyze market trends and price movements",
  },
  {
    keywords: ["invest", "investment", "roi", "rental", "return", "opportunity", "potential"],
    agentType: "market_analyzer",
    action: "analyze_investment",
    description: "Evaluate investment potential and ROI",
  },
  {
    keywords: ["compare", "comparison", "versus", "vs", "between", "difference"],
    agentType: "market_analyzer",
    action: "comparative_analysis",
    description: "Comparative market analysis across areas",
  },
  // Recommendation Engine intents
  {
    keywords: ["recommend", "suggestion", "best", "top", "ideal", "match", "suitable"],
    agentType: "recommendation",
    action: "get_recommendations",
    description: "Generate property recommendations",
  },
  {
    keywords: ["first-time", "buyer", "starter", "affordable", "budget"],
    agentType: "recommendation",
    action: "get_recommendations",
    description: "First-time buyer recommendations",
  },
  // Text Summarizer intents
  {
    keywords: ["report", "summary", "summarize", "brief", "overview", "comprehensive"],
    agentType: "text_summarizer",
    action: "generate_report",
    description: "Generate comprehensive property report",
  },
  {
    keywords: ["describe", "description", "listing", "details", "about"],
    agentType: "text_summarizer",
    action: "summarize_property",
    description: "Generate property summary",
  },
];

/**
 * Decompose a natural language query into sub-tasks assigned to specific agents.
 * In Ralph Wiggum Mode, the decomposition is more aggressive, splitting into
 * more parallel tasks. In single mode, it picks the best single agent.
 */
export function decomposeTask(
  query: string,
  mode: SwarmMode
): DecomposedTask[] {
  const lowerQuery = query.toLowerCase();
  const matchedIntents: DecomposedTask[] = [];
  const usedAgentActions = new Set<string>();

  // Score each intent pattern against the query
  const scored = INTENT_PATTERNS.map((pattern) => {
    const matchCount = pattern.keywords.filter((kw) =>
      lowerQuery.includes(kw)
    ).length;
    return { pattern, score: matchCount };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  for (const { pattern } of scored) {
    const key = `${pattern.agentType}:${pattern.action}`;
    if (usedAgentActions.has(key)) continue;

    const agent = AGENTS.find((a) => a.type === pattern.agentType);
    if (!agent) continue;

    usedAgentActions.add(key);
    matchedIntents.push({
      agentId: agent.id,
      agentName: agent.name,
      agentType: pattern.agentType,
      action: pattern.action,
      description: pattern.description,
    });
  }

  // If single mode, return only the top match
  if (mode === "single" && matchedIntents.length > 0) {
    return [matchedIntents[0]];
  }

  // If no matches found, default to NL Search + Text Summarizer
  if (matchedIntents.length === 0) {
    return [
      {
        agentId: "agent-nl-search",
        agentName: "NL Search",
        agentType: "nl_search",
        action: "search_properties",
        description: "Search for properties matching query",
      },
      {
        agentId: "agent-text-summarizer",
        agentName: "Text Summarizer",
        agentType: "text_summarizer",
        action: "generate_report",
        description: "Generate summary of results",
      },
    ];
  }

  // In Ralph Wiggum Mode, always include a summarizer if not already present
  if (
    mode === "ralph-wiggum" &&
    !matchedIntents.some((i) => i.agentType === "text_summarizer")
  ) {
    matchedIntents.push({
      agentId: "agent-text-summarizer",
      agentName: "Text Summarizer",
      agentType: "text_summarizer",
      action: "generate_report",
      description: "Synthesize findings into executive brief",
    });
  }

  return matchedIntents;
}

/**
 * Create a SwarmTask from decomposed sub-tasks.
 */
export function createSwarmTask(
  query: string,
  mode: SwarmMode,
  decomposed: DecomposedTask[]
) {
  const now = new Date().toISOString();
  const subtasks: SubTask[] = decomposed.map((d) => ({
    id: generateId(),
    agentId: d.agentId,
    agentName: d.agentName,
    action: d.action,
    description: d.description,
    status: "queued" as const,
    progress: 0,
    result: null,
    startedAt: null,
    completedAt: null,
    duration: null,
  }));

  return {
    id: generateId(),
    query,
    mode,
    status: "decomposing" as const,
    subtasks,
    synthesizedResult: null,
    createdAt: now,
    completedAt: null,
    totalDuration: null,
  };
}

// ============================================================================
// Simulated Execution (Client-side mock for demo)
// ============================================================================

const DURATION_RANGES: Record<string, [number, number]> = {
  nl_search: [800, 2000],
  market_analyzer: [1500, 3500],
  recommendation: [1200, 2800],
  text_summarizer: [900, 2200],
};

/**
 * Get a simulated execution duration for an agent type.
 * Randomized within realistic ranges for each agent.
 */
export function getSimulatedDuration(agentType: string): number {
  const range = DURATION_RANGES[agentType] || [1000, 3000];
  return range[0] + Math.random() * (range[1] - range[0]);
}

/**
 * Get a mock result string for a completed action.
 */
export function getMockResult(action: string): string {
  const results: Record<string, string> = {
    search_properties:
      "Found 24 matching properties in the Tri-Cities area. Top results include 3BR/2BA homes in West Richland ($345K-$389K) and newer constructions in South Kennewick ($312K-$367K).",
    analyze_market:
      "Benton County market shows 4.2% YoY appreciation. Median price: $385,000. Average days on market: 28. Inventory down 12% from last quarter indicating a seller's market.",
    analyze_investment:
      "Investment score: 8.2/10. Estimated rental yield: 6.8% gross, 4.1% net. Cap rate: 5.3%. Price-to-rent ratio of 14.7 indicates favorable investment conditions.",
    comparative_analysis:
      "Richland leads with 5.1% appreciation (median $412K), followed by Kennewick at 3.8% ($358K) and Pasco at 4.5% ($325K). Pasco offers best value-to-growth ratio.",
    get_recommendations:
      "Top 5 recommendations: 1) 1425 Birch Ave, Richland - Score 9.2, 2) 3201 W 4th, Kennewick - Score 8.8, 3) 812 Columbia Dr, Richland - Score 8.5, 4) 2109 Road 68, Pasco - Score 8.3, 5) 4455 Gage Blvd, Kennewick - Score 8.1",
    generate_report:
      "Executive Brief: The Tri-Cities real estate market continues strong growth driven by DOE expansion and tech sector jobs. Key opportunity areas include West Richland for family homes and South Kennewick for investment properties.",
    summarize_property:
      "Property Summary: Well-maintained 3BR/2BA ranch in established Richland neighborhood. 1,856 sqft on 0.23 acres. Updated kitchen, hardwood floors, attached 2-car garage. Zoned R-1. Walk score: 72.",
  };

  return (
    results[action] ||
    "Analysis completed successfully. Results are ready for review in the TerraFusion dashboard."
  );
}
