/**
 * TerraFusion API Client -- the bridge between Next.js and Flask backend
 * Agent Foxtrot says "this is the telephone wire between the two buildings
 * and also my nervous system is made of JSON"
 *
 * All methods gracefully degrade to mock data when Flask is unreachable,
 * ensuring the dashboard always renders even without a running backend.
 */

const FLASK_API_URL =
  process.env.NEXT_PUBLIC_FLASK_API_URL || "http://localhost:5000";

interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  source: "live" | "mock";
}

async function flaskFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const url = `${FLASK_API_URL}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      // 8 second timeout to avoid hanging on dead backend
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`Flask API returned ${res.status}: ${res.statusText}`);
    }

    const data = (await res.json()) as T;
    return { data, error: null, source: "live" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.warn(`[TerraFusion API] Flask unreachable: ${message}`);
    return { data: null, error: message, source: "mock" };
  }
}

// ─── Property Endpoints ─────────────────────────────────────────────
export async function searchProperties(params: {
  location?: string;
  min_price?: number;
  max_price?: number;
  beds?: number;
  baths?: number;
  property_type?: string;
  page?: number;
}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  return flaskFetch<{
    properties: Array<Record<string, unknown>>;
    total: number;
    page: number;
  }>(`/api/real-estate/search?${query.toString()}`);
}

export async function getPropertyDetails(propertyId: string) {
  return flaskFetch<Record<string, unknown>>(
    `/api/real-estate/property/${propertyId}`
  );
}

export async function getMarketTrends(location: string, period?: string) {
  const query = period ? `?period=${period}` : "";
  return flaskFetch<Record<string, unknown>>(
    `/api/real-estate/market-trends/${encodeURIComponent(location)}${query}`
  );
}

// ─── Agent Protocol Endpoints ────────────────────────────────────────
export async function executeAgentAction(
  action: string,
  parameters: Record<string, unknown>
) {
  return flaskFetch<{
    status: string;
    result: unknown;
    available_actions?: string[];
  }>("/api/agent-tools/execute", {
    method: "POST",
    body: JSON.stringify({ tool_name: action, arguments: parameters }),
  });
}

export async function getAgentToolStatus() {
  return flaskFetch<{
    api_keys: Record<string, boolean>;
    components: Record<string, unknown>;
    agent_tools_available: boolean;
  }>("/api/agent-tools/status");
}

export async function searchAgentTools(query: string, limit = 10) {
  return flaskFetch<{
    tools: Array<Record<string, unknown>>;
    count: number;
  }>(`/api/agent-tools/search?query=${encodeURIComponent(query)}&limit=${limit}`);
}

// ─── ETL Endpoints ───────────────────────────────────────────────────
export async function getETLPlugins() {
  return flaskFetch<{
    success: boolean;
    plugins: Array<Record<string, unknown>>;
  }>("/api/etl/plugins");
}

export async function runETLJob(pluginName: string, config?: Record<string, unknown>) {
  return flaskFetch<{
    success: boolean;
    job_id: string;
    status: Record<string, unknown>;
  }>("/api/etl/jobs", {
    method: "POST",
    body: JSON.stringify({ plugin_name: pluginName, config }),
  });
}

export async function getETLJobStatus(jobId: string) {
  return flaskFetch<{
    success: boolean;
    status: Record<string, unknown>;
  }>(`/api/etl/jobs/${jobId}`);
}

export async function getETLJobs(params?: {
  limit?: number;
  plugin_name?: string;
  status?: string;
}) {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.set(key, String(value));
    });
  }
  return flaskFetch<{
    success: boolean;
    jobs: Array<Record<string, unknown>>;
  }>(`/api/etl/jobs?${query.toString()}`);
}

// ─── County Data Endpoints ───────────────────────────────────────────
export async function getSupportedCounties() {
  return flaskFetch<{
    status: string;
    data: { count: number; counties: Array<{ name: string; state: string }> };
  }>("/api/county/supported");
}

export async function searchCountyProperties(
  county: string,
  state: string,
  query: string,
  limit = 10
) {
  return flaskFetch<Record<string, unknown>>(
    `/api/county/${encodeURIComponent(county)}/${state}/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );
}

// ─── Voice Endpoints ─────────────────────────────────────────────────
export async function processVoiceCommand(command: string) {
  return flaskFetch<{
    success: boolean;
    intent: string;
    entities: Record<string, unknown>;
    response: string;
  }>("/api/voice/process", {
    method: "POST",
    body: JSON.stringify({ command }),
  });
}

// ─── AI Endpoints ────────────────────────────────────────────────────
export async function analyzeMarket(location: string, daysBack = 90) {
  return flaskFetch<{
    status: string;
    result: Record<string, unknown>;
  }>("/api/agent-tools/execute", {
    method: "POST",
    body: JSON.stringify({
      tool_name: "analyze_market",
      arguments: { location, days_back: daysBack },
    }),
  });
}

export async function getPropertyRecommendations(
  query: string,
  limit = 5
) {
  return flaskFetch<{
    status: string;
    result: unknown;
    preferences: Record<string, unknown>;
  }>("/api/agent-tools/execute", {
    method: "POST",
    body: JSON.stringify({
      tool_name: "get_recommendations",
      arguments: { query, limit },
    }),
  });
}

// ─── System Health ───────────────────────────────────────────────────
export async function getSystemStatus() {
  return flaskFetch<{
    status: string;
    available_sources: string[];
    primary_source: string;
  }>("/api/real-estate/status");
}

export { FLASK_API_URL };
