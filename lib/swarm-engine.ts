import type {
  SubTask,
  SwarmTask,
  SwarmMode,
  SubTaskStatus,
} from "./types";
import { generateId } from "./utils";
import { AGENTS } from "./mock-data";

// ============================================================================
// TerraFusion Swarm Engine
// Autonomous task decomposition + parallel agent execution
// "Ralph Wiggum Mode" - All agents fire simultaneously
// ============================================================================

interface DecomposedTask {
  agentType: string;
  agentId: string;
  agentName: string;
  action: string;
  description: string;
}

// Keyword-based task decomposition logic
// Maps natural language intents to agent capabilities
const INTENT_PATTERNS: {
  pattern: RegExp;
  agentType: string;
  action: string;
  descriptionTemplate: string;
}[] = [
  {
    pattern: /\b(search|find|look\s*for|show|list|where)\b/i,
    agentType: "nl_search",
    action: "search_properties",
    descriptionTemplate: "Search for properties matching criteria",
  },
  {
    pattern: /\b(invest|roi|rental|yield|cap\s*rate|return)\b/i,
    agentType: "market_analyzer",
    action: "analyze_investment",
    descriptionTemplate: "Analyze investment potential and ROI metrics",
  },
  {
    pattern: /\b(trend|market|price\s*(drop|increase|change)|comparati|compare)\b/i,
    agentType: "market_analyzer",
    action: "analyze_market",
    descriptionTemplate: "Analyze market trends and price movements",
  },
  {
    pattern: /\b(recommend|suggest|best|top|match|similar)\b/i,
    agentType: "recommendation",
    action: "get_recommendations",
    descriptionTemplate: "Generate personalized property recommendations",
  },
  {
    pattern: /\b(summar|report|brief|overview|describe|generate\s*report)\b/i,
    agentType: "text_summarizer",
    action: "summarize_property",
    descriptionTemplate: "Generate executive summary and report",
  },
];

/**
 * Decomposes a natural language query into sub-tasks assigned to specific agents.
 * In Ralph Wiggum Mode, we intentionally assign more sub-tasks for parallel execution.
 */
export function decomposeTask(query: string, mode: SwarmMode): DecomposedTask[] {
  const tasks: DecomposedTask[] = [];
  const usedAgentActions = new Set<string>();

  // Match query against intent patterns
  for (const intent of INTENT_PATTERNS) {
    if (intent.pattern.test(query)) {
      const key = `${intent.agentType}:${intent.action}`;
      if (!usedAgentActions.has(key)) {
        const agent = AGENTS.find((a) => a.type === intent.agentType);
        if (agent) {
          tasks.push({
            agentType: intent.agentType,
            agentId: agent.id,
            agentName: agent.name,
            action: intent.action,
            description: intent.descriptionTemplate,
          });
          usedAgentActions.add(key);
        }
      }
    }
  }

  // In Ralph Wiggum Mode, always include a summarizer at the end
  if (mode === "ralph-wiggum" && tasks.length > 0) {
    const summarizerKey = "text_summarizer:summarize_property";
    if (!usedAgentActions.has(summarizerKey)) {
      const summarizer = AGENTS.find((a) => a.type === "text_summarizer");
      if (summarizer) {
        tasks.push({
          agentType: "text_summarizer",
          agentId: summarizer.id,
          agentName: summarizer.name,
          action: "generate_report",
          description: "Synthesize all findings into executive summary",
        });
      }
    }
  }

  // Fallback: if no patterns matched, use NL Search as default
  if (tasks.length === 0) {
    const nlSearch = AGENTS.find((a) => a.type === "nl_search");
    if (nlSearch) {
      tasks.push({
        agentType: "nl_search",
        agentId: nlSearch.id,
        agentName: nlSearch.name,
        action: "search_properties",
        description: "Process natural language query",
      });
    }
  }

  return tasks;
}

/**
 * Creates a SwarmTask with sub-tasks from decomposed tasks
 */
export function createSwarmTask(
  query: string,
  mode: SwarmMode,
  decomposed: DecomposedTask[]
): SwarmTask {
  const subtasks: SubTask[] = decomposed.map((d, index) => ({
    id: generateId(),
    agentId: d.agentId,
    agentName: d.agentName,
    action: d.action,
    description: d.description,
    status: "queued" as SubTaskStatus,
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
    status: "decomposing",
    subtasks,
    synthesizedResult: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    totalDuration: null,
  };
}

// ============================================================================
// Simulated execution results for each agent type
// ============================================================================

const MOCK_RESULTS: Record<string, string[]> = {
  search_properties: [
    "Found 18 properties matching criteria in Richland WA. Top match: 2847 Queensgate Dr - 3BR/2BA, 1,840 sqft, listed at $375,000. Average price in area: $362,500.",
    "Located 24 properties within parameters. Notable listings include 4 new constructions and 6 price-reduced homes. Median days on market: 28.",
    "Search returned 12 high-confidence matches. 8 properties are within 5% of target price range with matching amenity profiles.",
  ],
  analyze_investment: [
    "Investment Analysis: Market ROI score 8.2/10. Avg rental yield 6.8% for target area. Price-to-rent ratio: 14.2 (favorable). 3-year appreciation projection: +12.4%.",
    "Portfolio optimization suggests diversifying into Kennewick submarket. Cap rate analysis: 5.9% average, top quartile at 7.2%. Risk-adjusted return: 9.1%.",
  ],
  analyze_market: [
    "Market Trends: Median home price $385,000 (+4.2% YoY). Inventory down 12% vs last quarter. Days on market: 31 (down from 45). Seller's market conditions persist.",
    "Comparative analysis: Richland leads Tri-Cities in appreciation (+4.2%), followed by West Richland (+3.8%) and Kennewick (+3.1%). Pasco showing highest inventory growth.",
  ],
  get_recommendations: [
    "Top 5 Recommendations generated based on investment criteria: 1) 2847 Queensgate Dr (Score: 94), 2) 1156 Jadwin Ave (Score: 91), 3) 3302 W 45th Pl (Score: 88), 4) 892 Stevens Dr (Score: 85), 5) 4401 W Clearwater Ave (Score: 82).",
    "8 properties match buyer profile with >85% confidence. Prioritized by: rental potential (40%), appreciation forecast (30%), location score (20%), condition (10%).",
  ],
  summarize_property: [
    "Executive Summary: Analysis of Richland WA real estate market reveals strong investment fundamentals. The area shows consistent appreciation, favorable rental yields, and declining inventory suggesting continued upward price pressure. Recommended allocation: 60% single-family, 25% multi-family, 15% commercial.",
    "Property Portfolio Brief: 18 viable investment properties identified across 3 submarkets. Aggregate estimated annual return: 8.4%. Key risk factors: interest rate sensitivity (moderate), market concentration (low-moderate).",
  ],
  generate_report: [
    "Comprehensive Report: Multi-agent analysis complete. 4 specialized agents processed the query in parallel, analyzing market data from 3 sources (Zillow, PACMLS, ATTOM). Key finding: Richland WA presents a compelling investment opportunity with above-average returns and moderate risk profile. Full data synthesis attached.",
  ],
};

/**
 * Get a mock result for a given action
 */
export function getMockResult(action: string): string {
  const results = MOCK_RESULTS[action] || MOCK_RESULTS["search_properties"];
  return results[Math.floor(Math.random() * results.length)];
}

/**
 * Simulate execution timing for each agent type
 */
export function getSimulatedDuration(agentType: string): number {
  const baseTimes: Record<string, number> = {
    nl_search: 800,
    market_analyzer: 2000,
    recommendation: 1400,
    text_summarizer: 1000,
  };
  const base = baseTimes[agentType] || 1500;
  // Add some randomness (+-30%)
  return Math.round(base * (0.7 + Math.random() * 0.6));
}
