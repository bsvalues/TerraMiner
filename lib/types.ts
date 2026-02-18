// ============================================================================
// TerraFusion Cloud Coach - Agent Swarm Type System
// Maps to the existing Python AgentProtocol and agent implementations
// ============================================================================

export type AgentStatus = "idle" | "active" | "processing" | "error" | "offline";
export type TaskStatus = "pending" | "decomposing" | "executing" | "completed" | "failed";
export type SubTaskStatus = "queued" | "running" | "completed" | "failed";
export type ETLHealth = "healthy" | "degraded" | "down";
export type SwarmMode = "single" | "ralph-wiggum";

// Mirrors the Python agent capabilities from ai/agents/
export interface Agent {
  id: string;
  name: string;
  type: "market_analyzer" | "nl_search" | "recommendation" | "text_summarizer";
  status: AgentStatus;
  capabilities: string[];
  description: string;
  currentTask: string | null;
  tasksCompleted: number;
  avgResponseTime: number; // ms
  lastActive: string; // ISO timestamp
}

export interface SubTask {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  description: string;
  status: SubTaskStatus;
  progress: number; // 0-100
  result: string | null;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null; // ms
}

export interface SwarmTask {
  id: string;
  query: string;
  mode: SwarmMode;
  status: TaskStatus;
  subtasks: SubTask[];
  synthesizedResult: string | null;
  createdAt: string;
  completedAt: string | null;
  totalDuration: number | null; // ms
}

export interface SwarmExecution {
  taskId: string;
  mode: SwarmMode;
  phases: ExecutionPhase[];
  currentPhase: number;
  metrics: ExecutionMetrics;
}

export interface ExecutionPhase {
  name: string;
  status: SubTaskStatus;
  subtaskIds: string[];
  startedAt: string | null;
  completedAt: string | null;
}

export interface ExecutionMetrics {
  totalSubtasks: number;
  completedSubtasks: number;
  failedSubtasks: number;
  parallelism: number; // max concurrent subtasks
  estimatedTimeRemaining: number | null;
}

// ETL Pipeline types matching the existing data sources
export interface ETLPipeline {
  id: string;
  source: string;
  displayName: string;
  status: ETLHealth;
  lastRun: string; // ISO timestamp
  nextRun: string; // ISO timestamp
  recordsProcessed: number;
  recordsTotal: number;
  errorRate: number; // percentage
  avgProcessingTime: number; // ms per record
}

// System-level metrics
export interface SystemMetrics {
  activeAgents: number;
  totalAgents: number;
  tasksProcessed: number;
  tasksToday: number;
  uptime: number; // seconds
  swarmEfficiency: number; // percentage
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  avgResponseTime: number; // ms
}

// Activity log entry
export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  type: "agent_action" | "task_completed" | "task_failed" | "system_event" | "swarm_event";
  agent: string | null;
  message: string;
  severity: "info" | "success" | "warning" | "error";
}

// API response wrappers matching Flask AgentProtocol shape
export interface AgentProtocolResponse {
  status: "success" | "error";
  agent: string;
  action: string;
  result: unknown;
  execution_time: number;
  timestamp: string;
}

export interface SwarmExecutionRequest {
  query: string;
  mode: SwarmMode;
}

export interface SwarmExecutionResponse {
  task: SwarmTask;
  execution: SwarmExecution;
}
