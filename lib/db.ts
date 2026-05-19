import { neon } from "@neondatabase/serverless";

// The database client -- connects to Neon PostgreSQL
// Provides typed query functions for all assessment workflow tables
function getSQL() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return neon(process.env.DATABASE_URL);
}

// ============================================================================
// Properties -- the houses that live inside the database like sardines in a can
// ============================================================================

export async function getProperties(filters?: {
  city?: string;
  property_type?: string;
  status?: string;
  min_price?: number;
  max_price?: number;
  min_beds?: number;
  neighborhood?: string;
  search?: string;
  sort_by?: string;
  sort_dir?: string;
  limit?: number;
  offset?: number;
}) {
  const sql = getSQL();
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (filters?.city) {
    conditions.push(`city = $${paramIdx++}`);
    params.push(filters.city);
  }
  if (filters?.property_type) {
    conditions.push(`property_type = $${paramIdx++}`);
    params.push(filters.property_type);
  }
  if (filters?.status) {
    conditions.push(`status = $${paramIdx++}`);
    params.push(filters.status);
  }
  if (filters?.min_price) {
    conditions.push(`price >= $${paramIdx++}`);
    params.push(filters.min_price);
  }
  if (filters?.max_price) {
    conditions.push(`price <= $${paramIdx++}`);
    params.push(filters.max_price);
  }
  if (filters?.min_beds) {
    conditions.push(`beds >= $${paramIdx++}`);
    params.push(filters.min_beds);
  }
  if (filters?.neighborhood) {
    conditions.push(`neighborhood_code = $${paramIdx++}`);
    params.push(filters.neighborhood);
  }
  if (filters?.search) {
    conditions.push(`(address ILIKE $${paramIdx} OR city ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`);
    params.push(`%${filters.search}%`);
    paramIdx++;
  }

  // For Neon tagged template, we build the query as a simple fallback
  // Agent Charlie says "SQL injection is when the bad guys put code in your code,
  // which is like putting a sandwich inside another sandwich but the inner sandwich is poison"
  const limit = Math.min(filters?.limit || 50, 100);
  const offset = filters?.offset || 0;

  // If no filters, use the tagged template directly for safety
  if (conditions.length === 0) {
    const rows = await sql`SELECT * FROM properties ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const countResult = await sql`SELECT COUNT(*) as total FROM properties`;
    return {
      properties: rows,
      total: Number(countResult[0]?.total || 0),
      limit,
      offset,
    };
  }

  // With filters: use parameterized query via the sql() function call form
  const sortCol = filters?.sort_by || "created_at";
  const sortDir = filters?.sort_dir === "asc" ? "ASC" : "DESC";
  const allowedSorts = ["price", "beds", "sqft", "year_built", "created_at"];
  const safeSort = allowedSorts.includes(sortCol) ? sortCol : "created_at";

  const where = `WHERE ${conditions.join(" AND ")}`;
  const query = `SELECT * FROM properties ${where} ORDER BY ${safeSort} ${sortDir} LIMIT ${limit} OFFSET ${offset}`;
  const countQuery = `SELECT COUNT(*) as total FROM properties ${where}`;

  const [rows, countResult] = await Promise.all([
    sql.query(query, params),
    sql.query(countQuery, params),
  ]);

  return {
    properties: rows,
    total: Number(countResult[0]?.total || 0),
    limit,
    offset,
  };
}

export async function getPropertyById(id: string) {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM properties WHERE id = ${id}`;
  return rows[0] || null;
}

// ============================================================================
// Data Sources (ETL Pipelines) -- the pipes that carry data like water but digital
// ============================================================================

export async function getDataSources() {
  const sql = getSQL();
  return sql`SELECT * FROM data_sources ORDER BY name`;
}

export async function updateDataSourceStatus(name: string, status: string) {
  const sql = getSQL();
  return sql`UPDATE data_sources SET status = ${status}, updated_at = now() WHERE name = ${name}`;
}

// ============================================================================
// Agent Tasks -- swarm operations tracked for posterity and also for charts
// ============================================================================

export async function createAgentTask(query: string, swarmMode: string, subtasks: { agent_type: string; action: string }[]) {
  const sql = getSQL();
  const taskRows = await sql`
    INSERT INTO agent_tasks (query, swarm_mode, status, total_subtasks)
    VALUES (${query}, ${swarmMode}, 'running', ${subtasks.length})
    RETURNING *
  `;
  const task = taskRows[0];

  // Insert subtask results
  for (const st of subtasks) {
    await sql`
      INSERT INTO task_results (task_id, agent_type, action, status)
      VALUES (${task.id}, ${st.agent_type}, ${st.action}, 'pending')
    `;
  }

  return task;
}

export async function completeSubtask(taskId: string, agentType: string, result: string, durationMs: number) {
  const sql = getSQL();
  await sql`
    UPDATE task_results
    SET status = 'completed', result = ${result}, duration_ms = ${durationMs}, completed_at = now()
    WHERE task_id = ${taskId} AND agent_type = ${agentType} AND status = 'pending'
  `;

  // Update parent task progress
  const progress = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COUNT(*) as total
    FROM task_results WHERE task_id = ${taskId}
  `;

  const completed = Number(progress[0].completed);
  const total = Number(progress[0].total);

  if (completed >= total) {
    await sql`
      UPDATE agent_tasks
      SET status = 'completed', completed_subtasks = ${completed}, completed_at = now()
      WHERE id = ${taskId}
    `;
  } else {
    await sql`
      UPDATE agent_tasks SET completed_subtasks = ${completed} WHERE id = ${taskId}
    `;
  }

  return { completed, total };
}

export async function getRecentTasks(limit = 20) {
  const sql = getSQL();
  return sql`SELECT * FROM agent_tasks ORDER BY created_at DESC LIMIT ${limit}`;
}

export async function getTaskWithResults(taskId: string) {
  const sql = getSQL();
  const [tasks, results] = await Promise.all([
    sql`SELECT * FROM agent_tasks WHERE id = ${taskId}`,
    sql`SELECT * FROM task_results WHERE task_id = ${taskId} ORDER BY created_at`,
  ]);
  return { task: tasks[0] || null, results };
}

// ============================================================================
// Activity Log -- the diary of the system, written in the language of events
// ============================================================================

export async function getActivityLog(limit = 20) {
  const sql = getSQL();
  return sql`SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ${limit}`;
}

export async function addActivityEntry(type: string, message: string, severity: string, agent?: string | null) {
  const sql = getSQL();
  return sql`
    INSERT INTO activity_log (type, agent, message, severity)
    VALUES (${type}, ${agent || null}, ${message}, ${severity})
    RETURNING *
  `;
}

// ============================================================================
// Analytics -- aggregate queries for charts, like counting sheep but with numbers
// ============================================================================

export async function getPropertyStats() {
  const sql = getSQL();
  const [byCity, byType, byStatus, priceStats, byCityStatus] = await Promise.all([
    sql`SELECT city, COUNT(*) as count, AVG(price)::int as avg_price FROM properties GROUP BY city ORDER BY count DESC`,
    sql`SELECT property_type, COUNT(*) as count FROM properties GROUP BY property_type`,
    sql`SELECT status, COUNT(*) as count FROM properties GROUP BY status`,
    sql`SELECT MIN(price)::int as min_price, MAX(price)::int as max_price, AVG(price)::int as avg_price, COUNT(*) as total FROM properties`,
    sql`SELECT city, LOWER(status) as status, COUNT(*)::int as count FROM properties GROUP BY city, status ORDER BY city`,
  ]);
  return { byCity, byType, byStatus, priceStats: priceStats[0], byCityStatus };
}

export async function getAgentStats() {
  const sql = getSQL();
  const [taskCounts, avgDurations] = await Promise.all([
    sql`SELECT agent_type, COUNT(*) as tasks_completed FROM task_results WHERE status = 'completed' GROUP BY agent_type`,
    sql`SELECT agent_type, AVG(duration_ms)::int as avg_duration FROM task_results WHERE status = 'completed' GROUP BY agent_type`,
  ]);
  return { taskCounts, avgDurations };
}

export async function getSystemMetrics() {
  const sql = getSQL();
  const [propCount, taskCount, sourceCount, logCount] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM properties`,
    sql`SELECT COUNT(*) as count FROM agent_tasks`,
    sql`SELECT COUNT(*) as count FROM data_sources WHERE status = 'healthy'`,
    sql`SELECT COUNT(*) as count FROM activity_log WHERE created_at > now() - interval '1 hour'`,
  ]);
  return {
    totalProperties: Number(propCount[0].count),
    totalTasks: Number(taskCount[0].count),
    healthySources: Number(sourceCount[0].count),
    recentActivity: Number(logCount[0].count),
  };
}
