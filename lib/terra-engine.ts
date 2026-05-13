/**
 * TerraFusion Engine -- TypeScript implementation mirroring the Rust WASM engine
 * When Rust is compiled with `wasm-pack build`, swap this import for the WASM module.
 * Agent Echo says "this is the twin of the crab, but made of JavaScript instead of claws"
 *
 * Algorithms are IDENTICAL to rust-engine/src/{scoring,intent,market}.rs
 */

// ============================================================================
// Property Scoring -- weighted multi-factor analysis (mirrors scoring.rs)
// ============================================================================

export interface PropertyInput {
  price: number;
  sqft?: number;
  beds?: number;
  baths?: number;
  year_built?: number;
  lot_size?: number;
  city: string;
  status: string;
}

export interface PropertyScore {
  total_score: number;
  value_score: number;
  location_score: number;
  condition_score: number;
  market_score: number;
  investment_grade: string;
  recommendation: string;
}

export function scoreProperty(prop: PropertyInput): PropertyScore {
  const MARKET_MEDIAN_PPSF = 180;
  const ppsf = prop.sqft && prop.sqft > 0 ? prop.price / prop.sqft : MARKET_MEDIAN_PPSF;
  const valueRatio = MARKET_MEDIAN_PPSF / ppsf;
  const value_score = Math.min(Math.max(valueRatio * 50, 0), 100);

  const location_score =
    prop.city === "Richland" ? 85 :
    prop.city === "Kennewick" ? 75 :
    prop.city === "Pasco" ? 65 : 50;

  const age = prop.year_built ? 2026 - prop.year_built : 30;
  const condition_score = Math.min(Math.max(100 - age * 1.2, 20), 100);

  const market_score =
    prop.status === "active" ? 80 :
    prop.status === "pending" ? 90 :
    prop.status === "sold" ? 60 : 50;

  const total = value_score * 0.30 + location_score * 0.25 + condition_score * 0.25 + market_score * 0.20;

  const investment_grade = total >= 85 ? "A" : total >= 70 ? "B" : total >= 55 ? "C" : total >= 40 ? "D" : "F";
  const recommendation = total >= 80 ? "Strong Buy" : total >= 65 ? "Buy" : total >= 50 ? "Hold" : "Pass";

  return {
    total_score: Math.round(total * 10) / 10,
    value_score: Math.round(value_score * 10) / 10,
    location_score,
    condition_score: Math.round(condition_score * 10) / 10,
    market_score,
    investment_grade,
    recommendation,
  };
}

export function batchScore(properties: PropertyInput[]): PropertyScore[] {
  return properties
    .map((p) => scoreProperty(p))
    .sort((a, b) => b.total_score - a.total_score);
}

// ============================================================================
// Intent Parsing -- NL query to structured intent (mirrors intent.rs)
// ============================================================================

export interface ParsedIntent {
  intent: string;
  confidence: number;
  entities: {
    city?: string;
    min_beds?: number;
    max_price?: number;
    property_type?: string;
    keywords: string[];
  };
  suggested_action: string;
}

const SEARCH_WORDS = ["search", "find", "show", "list", "looking", "want", "need", "get"];
const MARKET_WORDS = ["market", "trend", "analysis", "price", "value", "worth", "appreciation"];
const RECOMMEND_WORDS = ["recommend", "suggest", "best", "top", "good", "investment", "roi"];
const COMPARE_WORDS = ["compare", "versus", "vs", "difference", "better"];
const STOP_WORDS = ["that", "this", "with", "from", "have", "been", "will", "them", "they", "what", "when", "your"];

function countMatches(words: string[], patterns: string[]): number {
  return words.filter((w) => patterns.includes(w)).length;
}

export function parseIntent(query: string): ParsedIntent {
  const lower = query.toLowerCase();
  const words = lower.split(/\s+/);

  const searchScore = countMatches(words, SEARCH_WORDS);
  const marketScore = countMatches(words, MARKET_WORDS);
  const recommendScore = countMatches(words, RECOMMEND_WORDS);
  const compareScore = countMatches(words, COMPARE_WORDS);

  let intent: string;
  let confidence: number;

  if (searchScore >= marketScore && searchScore >= recommendScore && searchScore >= compareScore) {
    intent = "property_search";
    confidence = 0.5 + searchScore * 0.12;
  } else if (marketScore >= recommendScore && marketScore >= compareScore) {
    intent = "market_analysis";
    confidence = 0.5 + marketScore * 0.12;
  } else if (recommendScore >= compareScore) {
    intent = "recommendation";
    confidence = 0.5 + recommendScore * 0.12;
  } else {
    intent = "comparison";
    confidence = 0.5 + compareScore * 0.12;
  }

  const city = lower.includes("richland") ? "Richland" :
    lower.includes("kennewick") ? "Kennewick" :
    lower.includes("pasco") ? "Pasco" : undefined;

  const bedMatch = lower.match(/(\d+)\s*(?:bed|br|bedroom)/);
  const min_beds = bedMatch ? Number(bedMatch[1]) : undefined;

  let max_price: number | undefined;
  const pricePatterns = ["under ", "below ", "max ", "budget "];
  for (const pattern of pricePatterns) {
    const pos = lower.indexOf(pattern);
    if (pos >= 0) {
      const after = lower.slice(pos + pattern.length);
      const cleaned = after.match(/[\d,.kK$]+/)?.[0]?.replace(/[$,]/g, "") || "";
      if (cleaned.toLowerCase().endsWith("k")) {
        const n = parseFloat(cleaned.slice(0, -1));
        if (!isNaN(n)) max_price = n * 1000;
      } else {
        const n = parseFloat(cleaned);
        if (!isNaN(n)) max_price = n;
      }
      break;
    }
  }

  const property_type = lower.includes("condo") ? "condo" :
    lower.includes("townhouse") || lower.includes("town house") ? "townhouse" :
    lower.includes("multi") || lower.includes("duplex") ? "multi_family" :
    lower.includes("land") || lower.includes("lot") ? "land" : undefined;

  const keywords = words.filter((w) => w.length > 3 && !STOP_WORDS.includes(w));

  const actionMap: Record<string, string> = {
    property_search: "search_properties",
    market_analysis: "analyze_market",
    recommendation: "get_recommendations",
    comparison: "compare_properties",
  };

  return {
    intent,
    confidence: Math.min(confidence, 0.98),
    entities: { city, min_beds, max_price, property_type, keywords },
    suggested_action: actionMap[intent] || "search_properties",
  };
}

// ============================================================================
// Market Analysis -- statistical breakdown (mirrors market.rs)
// ============================================================================

export interface MarketDataPoint {
  price: number;
  sqft?: number;
  year_built?: number;
  city: string;
}

export interface MarketAnalysis {
  median_price: number;
  mean_price: number;
  price_std_dev: number;
  median_ppsf: number;
  price_range: { min: number; max: number; q1: number; q3: number };
  city_breakdown: { city: string; count: number; median_price: number; avg_ppsf: number }[];
  market_health: string;
  market_score: number;
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const n = sorted.length;
  return n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
}

export function analyzeMarket(data: MarketDataPoint[]): MarketAnalysis {
  if (data.length === 0) {
    return {
      median_price: 0, mean_price: 0, price_std_dev: 0, median_ppsf: 0,
      price_range: { min: 0, max: 0, q1: 0, q3: 0 },
      city_breakdown: [], market_health: "insufficient_data", market_score: 0,
    };
  }

  const prices = data.map((p) => p.price).sort((a, b) => a - b);
  const n = prices.length;
  const medianPrice = median(prices);
  const meanPrice = prices.reduce((s, p) => s + p, 0) / n;
  const variance = prices.reduce((s, p) => s + Math.pow(p - meanPrice, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  const ppsfValues = data
    .filter((p) => p.sqft && p.sqft > 0)
    .map((p) => p.price / p.sqft!);
  const medianPpsf = ppsfValues.length > 0 ? median(ppsfValues) : 0;

  const cities = [...new Set(data.map((p) => p.city))];
  const cityBreakdown = cities.map((city) => {
    const cityData = data.filter((p) => p.city === city);
    const cityPrices = cityData.map((p) => p.price);
    const cityPpsf = cityData
      .filter((p) => p.sqft && p.sqft > 0)
      .map((p) => p.price / p.sqft!);
    return {
      city,
      count: cityData.length,
      median_price: Math.round(median(cityPrices) * 100) / 100,
      avg_ppsf: cityPpsf.length > 0
        ? Math.round((cityPpsf.reduce((s, v) => s + v, 0) / cityPpsf.length) * 100) / 100
        : 0,
    };
  });

  const cv = stdDev / meanPrice;
  const [health, score] = n >= 20 && cv < 0.3 ? ["healthy", 85] :
    n >= 10 && cv < 0.5 ? ["stable", 70] :
    n >= 5 ? ["moderate", 55] : ["thin", 35];

  return {
    median_price: Math.round(medianPrice * 100) / 100,
    mean_price: Math.round(meanPrice * 100) / 100,
    price_std_dev: Math.round(stdDev * 100) / 100,
    median_ppsf: Math.round(medianPpsf * 100) / 100,
    price_range: { min: prices[0], max: prices[n - 1], q1: prices[Math.floor(n / 4)], q3: prices[Math.floor(3 * n / 4)] },
    city_breakdown: cityBreakdown,
    market_health: health,
    market_score: score,
  };
}

// ============================================================================
// Engine info -- matches rust-engine/src/lib.rs init() and health_check()
// ============================================================================

export function init(): string {
  return "TerraFusion Engine v0.1.0 (TypeScript mirror) initialized";
}

export function healthCheck() {
  return {
    engine: "terraminer-engine",
    version: "0.1.0",
    runtime: "typescript-mirror",
    capabilities: ["property_scoring", "intent_parsing", "market_analysis"],
    note: "Compile rust-engine/ with wasm-pack for native WASM performance",
  };
}
