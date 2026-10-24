import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env.local if present
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  const env = { ...process.env };
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx !== -1) {
        const key = line.slice(0, idx).trim();
        let val = line.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        env[key] = val;
      }
    }
  }
  return env;
}

const env = loadEnv();

// Configure target database connections
const DB_TARGETS = {
  neon: {
    id: 'neon',
    name: 'Remote Neon DB (Production)',
    url: env.OLD_DATABASE_URL || (env.DATABASE_URL?.includes('neon.tech') ? env.DATABASE_URL : ''),
    isRemote: true
  },
  local: {
    id: 'local',
    name: 'Local PostgreSQL',
    url: env.DATABASE_URL?.includes('neon.tech') ? '' : (env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/recovery_credit'),
    isRemote: false
  }
};

const pools = new Map();

function getPool(targetId = 'neon') {
  if (pools.has(targetId)) return pools.get(targetId);

  const target = DB_TARGETS[targetId] || DB_TARGETS.neon;
  if (!target || !target.url) {
    throw new Error(`Connection string for target "${targetId}" is not configured in .env.local`);
  }

  const isNeon = target.url.includes('neon.tech') || target.url.includes('sslmode=require');
  const pool = new Pool({
    connectionString: target.url,
    ssl: isNeon ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 7000,
    max: 5,
    idleTimeoutMillis: 15000
  });

  pools.set(targetId, pool);
  return pool;
}

// Fetch comprehensive DB stats
async function getDbStats(targetId) {
  const pool = getPool(targetId);
  const startTime = Date.now();

  // 1. Basic Health & Ping
  const pingRes = await pool.query('SELECT current_database() as db_name, current_user as user_name, version() as version, pg_backend_pid() as pid');
  const latencyMs = Date.now() - startTime;
  const dbInfo = pingRes.rows[0];

  // 2. Database Size & Cache Hit Ratio
  let dbSize = '0 MB';
  let dbSizeBytes = 0;
  let cacheHitRatio = 0;
  try {
    const sizeRes = await pool.query(`
      SELECT 
        pg_database_size(current_database()) as size_bytes,
        pg_size_pretty(pg_database_size(current_database())) as size_pretty
    `);
    dbSize = sizeRes.rows[0]?.size_pretty || '0 MB';
    dbSizeBytes = Number(sizeRes.rows[0]?.size_bytes || 0);

    const cacheRes = await pool.query(`
      SELECT 
        CASE WHEN (sum(heap_blks_hit) + sum(heap_blks_read)) = 0 THEN 100
             ELSE ROUND((sum(heap_blks_hit)::numeric / (sum(heap_blks_hit) + sum(heap_blks_read))::numeric) * 100, 2)
        END as cache_hit_ratio
      FROM pg_statio_user_tables;
    `);
    cacheHitRatio = Number(cacheRes.rows[0]?.cache_hit_ratio || 100);
  } catch (err) {
    console.warn('Size/cache stat note:', err.message);
  }

  // 3. Active Connections Count
  let connections = { active: 0, idle: 0, total: 0 };
  try {
    const connRes = await pool.query(`
      SELECT 
        count(*) as total,
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle
      FROM pg_stat_activity
      WHERE datname = current_database();
    `);
    connections = {
      total: Number(connRes.rows[0]?.total || 0),
      active: Number(connRes.rows[0]?.active || 0),
      idle: Number(connRes.rows[0]?.idle || 0)
    };
  } catch (err) {
    console.warn('Connections stat note:', err.message);
  }

  // 4. Tables Matrix (Exact counts & sizes)
  let tables = [];
  try {
    const tablesListRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `);

    for (const row of tablesListRes.rows) {
      const tName = row.table_name;
      try {
        const countRes = await pool.query(`SELECT count(*)::int as row_count FROM "${tName}"`);
        const sizeRes = await pool.query(`
          SELECT 
            pg_size_pretty(pg_total_relation_size('"' || $1 || '"')) as total_size,
            pg_size_pretty(pg_relation_size('"' || $1 || '"')) as data_size,
            pg_size_pretty(pg_indexes_size('"' || $1 || '"')) as index_size,
            pg_total_relation_size('"' || $1 || '"') as total_bytes
        `, [tName]);

        tables.push({
          name: tName,
          rowCount: countRes.rows[0]?.row_count || 0,
          totalSize: sizeRes.rows[0]?.total_size || '0 kB',
          dataSize: sizeRes.rows[0]?.data_size || '0 kB',
          indexSize: sizeRes.rows[0]?.index_size || '0 kB',
          totalBytes: Number(sizeRes.rows[0]?.total_bytes || 0)
        });
      } catch {
        tables.push({ name: tName, rowCount: 0, totalSize: 'N/A', dataSize: 'N/A', indexSize: 'N/A', totalBytes: 0 });
      }
    }
  } catch (err) {
    console.warn('Tables list error:', err.message);
  }

  // 5. High-level Business Domain Metrics
  let business = {
    debtorsCount: 0,
    totalOutstanding: 0,
    totalPaid: 0,
    totalBalance: 0,
    recoveryRate: 0,
    usersCount: 0,
    collectorsCount: 0,
    institutionsCount: 0,
    categories: {},
    flags: {},
    institutions: []
  };

  try {
    const dRes = await pool.query(`
      SELECT 
        COUNT(*)::int as cnt,
        COALESCE(SUM(outstanding_amount), 0)::float as total_out,
        COALESCE(SUM(paid_amount), 0)::float as total_paid,
        COALESCE(SUM(outstanding_balance), 0)::float as total_bal
      FROM debtors;
    `);
    if (dRes.rows.length > 0) {
      const r = dRes.rows[0];
      business.debtorsCount = Number(r.cnt || 0);
      business.totalOutstanding = Number(r.total_out || 0);
      business.totalPaid = Number(r.total_paid || 0);
      business.totalBalance = Number(r.total_bal || 0);
      business.recoveryRate = business.totalOutstanding > 0
        ? Math.round((business.totalPaid / business.totalOutstanding) * 100)
        : 0;
    }

    const catRes = await pool.query(`SELECT category, count(*)::int as count FROM debtors GROUP BY category`);
    for (const r of catRes.rows) business.categories[r.category || 'unassigned'] = r.count;

    const flagRes = await pool.query(`SELECT color_flag, count(*)::int as count FROM debtors GROUP BY color_flag`);
    for (const r of flagRes.rows) business.flags[r.color_flag || 'none'] = r.count;

    const uRes = await pool.query(`
      SELECT 
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE role = 'collector')::int as collectors
      FROM users;
    `);
    business.usersCount = uRes.rows[0]?.total || 0;
    business.collectorsCount = uRes.rows[0]?.collectors || 0;

    const instRes = await pool.query(`
      SELECT 
        fi.name,
        COUNT(d.id)::int as debtor_count,
        COALESCE(SUM(d.outstanding_balance), 0)::float as balance
      FROM financial_institutions fi
      LEFT JOIN debtors d ON d.institution_id = fi.id OR LOWER(d.client_name) = LOWER(fi.name)
      GROUP BY fi.id, fi.name
      ORDER BY debtor_count DESC;
    `);
    business.institutions = instRes.rows;
    business.institutionsCount = instRes.rows.length;
  } catch (err) {
    console.warn('Business metrics query note:', err.message);
  }

  // 6. Recent Audit Logs
  let recentAudit = [];
  try {
    const auditRes = await pool.query(`
      SELECT id, timestamp, actor_username, action, target_type, target_description, details 
      FROM audit_logs 
      ORDER BY timestamp DESC 
      LIMIT 8;
    `);
    recentAudit = auditRes.rows;
  } catch (err) {
    console.warn('Audit logs read note:', err.message);
  }

  return {
    target: DB_TARGETS[targetId] || DB_TARGETS.neon,
    timestamp: new Date().toISOString(),
    latencyMs,
    dbInfo,
    dbSize,
    dbSizeBytes,
    cacheHitRatio,
    connections,
    tables,
    business,
    recentAudit
  };
}

// Read-only SQL query runner for debugging / inspection
async function executeQuery(targetId, sqlQuery) {
  const clean = sqlQuery.trim();
  const lower = clean.toLowerCase();
  // Strictly enforce read-only
  if (!lower.startsWith('select') && !lower.startsWith('explain') && !lower.startsWith('show')) {
    throw new Error('Only read-only queries (SELECT, EXPLAIN, SHOW) are permitted in this monitor dashboard.');
  }

  const pool = getPool(targetId);
  const start = Date.now();
  const res = await pool.query(clean);
  const durationMs = Date.now() - start;

  return {
    rows: res.rows.slice(0, 100), // Cap at 100 for safety
    rowCount: res.rowCount,
    fields: res.fields?.map(f => f.name) || [],
    durationMs
  };
}

// Single-page HTML Dashboard UI
function renderHtml(initialTarget = 'neon') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recovery Credit — Local DB Monitor</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f17;
      --card: #111827;
      --card-border: #1f2937;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --accent: #3b82f6;
      --accent-hover: #2563eb;
      --green: #10b981;
      --green-bg: rgba(16, 185, 129, 0.12);
      --amber: #f59e0b;
      --red: #ef4444;
      --red-bg: rgba(239, 68, 68, 0.12);
      --font-mono: 'JetBrains Mono', monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      min-height: 100vh;
      padding: 24px;
      -webkit-font-smoothing: antialiased;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    
    /* Header */
    header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 24px;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: linear-gradient(135deg, #1e3a8a, #3b82f6);
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; color: #fff; font-size: 18px;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
    }
    .brand-title { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; color: #fff; }
    .brand-sub { font-size: 12px; color: var(--text-muted); }
    
    .header-controls { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    select, button, input {
      font-family: inherit; font-size: 13px;
      border-radius: 8px; border: 1px solid var(--card-border);
      background: var(--card); color: var(--text);
      padding: 8px 14px; outline: none; transition: all 0.15s;
    }
    select:focus, input:focus { border-color: var(--accent); }
    button {
      background: var(--accent); color: #fff; font-weight: 600; cursor: pointer; border: none;
      display: inline-flex; align-items: center; gap: 6px;
    }
    button:hover { background: var(--accent-hover); }
    button.secondary { background: #1f2937; color: var(--text); }
    button.secondary:hover { background: #374151; }

    .pulse-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--green); display: inline-block;
      box-shadow: 0 0 10px var(--green);
    }
    .pulse-dot.error { background: var(--red); box-shadow: 0 0 10px var(--red); }
    
    /* Metrics Grid */
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 18px 20px;
      position: relative;
    }
    .card-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 600; }
    .card-val { font-size: 24px; font-weight: 800; color: #fff; margin-top: 6px; font-family: var(--font-mono); }
    .card-sub { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
    
    /* Section Headers */
    .section-title {
      font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
      color: var(--text-muted); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;
    }

    /* Two column layout */
    .two-col { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 24px; }
    @media (max-width: 900px) { .two-col { grid-template-columns: 1fr; } }

    /* Tables */
    .table-container {
      background: var(--card); border: 1px solid var(--card-border);
      border-radius: 12px; overflow: hidden;
    }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
    th {
      background: rgba(31, 41, 55, 0.5); padding: 12px 16px;
      color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;
      font-weight: 600; border-bottom: 1px solid var(--card-border);
    }
    td { padding: 12px 16px; border-bottom: 1px solid var(--card-border); }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255, 255, 255, 0.02); }
    .mono { font-family: var(--font-mono); font-size: 12px; }

    .badge {
      display: inline-block; padding: 2px 8px; border-radius: 6px;
      font-size: 11px; font-weight: 700; text-transform: uppercase;
    }
    .badge-green { background: var(--green-bg); color: var(--green); }
    .badge-red { background: var(--red-bg); color: var(--red); }
    .badge-blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }

    /* Query console */
    .console-box {
      background: var(--card); border: 1px solid var(--card-border);
      border-radius: 12px; padding: 16px; margin-top: 24px;
    }
    textarea {
      width: 100%; background: #070a0f; border: 1px solid var(--card-border);
      border-radius: 8px; color: #38bdf8; font-family: var(--font-mono); font-size: 13px;
      padding: 12px; min-height: 80px; resize: vertical; outline: none; margin-bottom: 12px;
    }
    textarea:focus { border-color: var(--accent); }

    .loading-bar {
      height: 2px; background: linear-gradient(90deg, #3b82f6, #10b981);
      width: 100%; position: fixed; top: 0; left: 0; z-index: 9999;
      display: none; animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer {
      0% { opacity: 0.4; transform: scaleX(0.2); }
      50% { opacity: 1; transform: scaleX(0.8); }
      100% { opacity: 0.4; transform: scaleX(0.2); }
    }
  </style>
</head>
<body>
  <div id="loading" class="loading-bar"></div>

  <div class="container">
    <header>
      <div class="brand">
        <div class="brand-icon">RC</div>
        <div>
          <div class="brand-title">Recovery Credit — Local DB Monitor</div>
          <div class="brand-sub">Real-Time Database Health & Data Matrix (Local Only)</div>
        </div>
      </div>

      <div class="header-controls">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span id="status-dot" class="pulse-dot"></span>
          <span id="latency-text" class="mono" style="color: var(--text-muted); font-size: 11px;">Connecting...</span>
        </div>

        <select id="target-select" onchange="switchTarget()">
          <option value="neon">Remote Neon DB (Production)</option>
          <option value="local">Local PostgreSQL</option>
        </select>

        <select id="interval-select" onchange="updateInterval()">
          <option value="3000">Auto: 3s</option>
          <option value="5000" selected>Auto: 5s</option>
          <option value="15000">Auto: 15s</option>
          <option value="0">Manual Only</option>
        </select>

        <button onclick="fetchStats()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
          Refresh
        </button>
      </div>
    </header>

    <!-- Top KPI Cards -->
    <div class="grid">
      <div class="card">
        <div class="card-label">Database Name</div>
        <div id="kpi-db" class="card-val">-</div>
        <div id="kpi-version" class="card-sub truncate mono">-</div>
      </div>
      <div class="card">
        <div class="card-label">Database Storage</div>
        <div id="kpi-size" class="card-val" style="color: #38bdf8;">-</div>
        <div id="kpi-tables-count" class="card-sub">- tables tracked</div>
      </div>
      <div class="card">
        <div class="card-label">Total Debtors (Live)</div>
        <div id="kpi-debtors" class="card-val" style="color: var(--green);">-</div>
        <div id="kpi-claim" class="card-sub">Total Claim: -</div>
      </div>
      <div class="card">
        <div class="card-label">Remaining Balance Due</div>
        <div id="kpi-balance" class="card-val" style="color: #f87171;">-</div>
        <div id="kpi-paid" class="card-sub">Collected: -</div>
      </div>
      <div class="card">
        <div class="card-label">Connections & Cache</div>
        <div id="kpi-conn" class="card-val" style="color: #fbbf24;">-</div>
        <div id="kpi-cache" class="card-sub">Cache Hit: -%</div>
      </div>
    </div>

    <!-- Main Two-Column View -->
    <div class="two-col">
      <!-- Left: Table Schema & Physical Storage -->
      <div>
        <div class="section-title">
          <span>Public Tables & Storage Distribution</span>
          <span id="last-updated" class="mono" style="font-size: 11px; text-transform: none;"></span>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Table Name</th>
                <th style="text-align: right;">Live Rows</th>
                <th style="text-align: right;">Data Size</th>
                <th style="text-align: right;">Index Size</th>
                <th style="text-align: right;">Total Size</th>
              </tr>
            </thead>
            <tbody id="tables-tbody">
              <tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Loading tables...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right: Financial Institutions & Collectors -->
      <div>
        <div class="section-title">Client Banks & Institutions</div>
        <div class="table-container" style="margin-bottom: 24px;">
          <table>
            <thead>
              <tr>
                <th>Institution</th>
                <th style="text-align: right;">Debtors</th>
                <th style="text-align: right;">Balance</th>
              </tr>
            </thead>
            <tbody id="banks-tbody">
              <tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Loading...</td></tr>
            </tbody>
          </table>
        </div>

        <div class="section-title">Workflow Categories Breakdown</div>
        <div id="categories-box" class="card" style="display: flex; flex-wrap: wrap; gap: 8px;">
          <span style="color: var(--text-muted); font-size: 12px;">Loading categories...</span>
        </div>
      </div>
    </div>

    <!-- Recent Audit Logs -->
    <div class="section-title">Latest Transactions & Audit Trail</div>
    <div class="table-container" style="margin-bottom: 24px;">
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Target</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody id="audit-tbody">
          <tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Loading audit logs...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Read-Only Query Console -->
    <div class="console-box">
      <div class="section-title" style="margin-bottom: 8px;">
        <span>Live SQL Query Inspector (Read-Only)</span>
        <span style="font-size: 11px; color: var(--text-muted);">SELECT, EXPLAIN only</span>
      </div>
      <textarea id="sql-input" placeholder="SELECT id, debtor_name, client_name, outstanding_balance FROM debtors LIMIT 10;">SELECT id, debtor_name, client_name, outstanding_balance FROM debtors LIMIT 10;</textarea>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span id="query-meta" class="mono" style="font-size: 11px; color: var(--text-muted);"></span>
        <button onclick="runCustomQuery()">Run Query</button>
      </div>
      <div id="query-result" class="table-container" style="margin-top: 12px; display: none;"></div>
    </div>
  </div>

  <script>
    let currentTarget = '${initialTarget}';
    let timer = null;

    function formatMoney(num) {
      return 'R ' + Number(num || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    async function fetchStats() {
      const loader = document.getElementById('loading');
      loader.style.display = 'block';

      try {
        const res = await fetch('/api/stats?target=' + currentTarget);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Server error');
        }
        const data = await res.json();

        // Update Connection & Health
        document.getElementById('status-dot').className = 'pulse-dot';
        document.getElementById('latency-text').innerText = data.latencyMs + 'ms • ' + (data.target.isRemote ? 'Remote SSL' : 'Local');
        document.getElementById('kpi-db').innerText = data.dbInfo.db_name;
        document.getElementById('kpi-version').innerText = data.dbInfo.version.split(' ')[0] + ' ' + data.dbInfo.version.split(' ')[1];
        document.getElementById('kpi-size').innerText = data.dbSize;
        document.getElementById('kpi-tables-count').innerText = data.tables.length + ' tables tracked';

        // Update Business KPIs
        document.getElementById('kpi-debtors').innerText = Number(data.business.debtorsCount).toLocaleString();
        document.getElementById('kpi-claim').innerText = 'Claim: ' + formatMoney(data.business.totalOutstanding);
        document.getElementById('kpi-balance').innerText = formatMoney(data.business.totalBalance);
        document.getElementById('kpi-paid').innerText = 'Collected: ' + formatMoney(data.business.totalPaid) + ' (' + data.business.recoveryRate + '%)';
        document.getElementById('kpi-conn').innerText = data.connections.total + ' conns (' + data.connections.active + ' active)';
        document.getElementById('kpi-cache').innerText = 'Cache Hit: ' + data.cacheHitRatio + '%';

        // Update Tables Matrix
        const tBody = document.getElementById('tables-tbody');
        if (data.tables.length === 0) {
          tBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No public tables found.</td></tr>';
        } else {
          tBody.innerHTML = data.tables.map(t => \`
            <tr>
              <td class="mono" style="font-weight: 600; color: #fff;">\${t.name}</td>
              <td class="mono" style="text-align: right; color: var(--green); font-weight: 700;">\${Number(t.rowCount).toLocaleString()}</td>
              <td class="mono" style="text-align: right; color: var(--text-muted);">\${t.dataSize}</td>
              <td class="mono" style="text-align: right; color: var(--text-muted);">\${t.indexSize}</td>
              <td class="mono" style="text-align: right; font-weight: 700; color: #38bdf8;">\${t.totalSize}</td>
            </tr>
          \`).join('');
        }

        // Update Banks
        const bBody = document.getElementById('banks-tbody');
        if (!data.business.institutions || data.business.institutions.length === 0) {
          bBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No banks mapped yet.</td></tr>';
        } else {
          bBody.innerHTML = data.business.institutions.map(b => \`
            <tr>
              <td style="font-weight: 600;">\${b.name}</td>
              <td class="mono" style="text-align: right;">\${b.debtor_count}</td>
              <td class="mono" style="text-align: right; color: #f87171; font-weight: 600;">\${formatMoney(b.balance)}</td>
            </tr>
          \`).join('');
        }

        // Update Categories
        const catBox = document.getElementById('categories-box');
        const cats = Object.entries(data.business.categories);
        if (cats.length === 0) {
          catBox.innerHTML = '<span style="color: var(--text-muted); font-size: 12px;">No categorized debtors</span>';
        } else {
          catBox.innerHTML = cats.map(([k, v]) => \`
            <span class="badge badge-blue">\${k.replace('_', ' ')}: \${v}</span>
          \`).join('');
        }

        // Update Audit
        const aBody = document.getElementById('audit-tbody');
        if (!data.recentAudit || data.recentAudit.length === 0) {
          aBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No recent audit entries.</td></tr>';
        } else {
          aBody.innerHTML = data.recentAudit.map(a => \`
            <tr>
              <td class="mono" style="font-size: 11px; color: var(--text-muted);">\${new Date(a.timestamp).toLocaleTimeString()}</td>
              <td style="font-weight: 600;">@\${a.actor_username || 'system'}</td>
              <td><span class="badge badge-green">\${a.action}</span></td>
              <td class="mono" style="font-size: 11px;">\${a.target_type || '-'}: \${a.target_description || '-'}</td>
              <td style="color: var(--text-muted); font-size: 12px;">\${a.details || ''}</td>
            </tr>
          \`).join('');
        }

        document.getElementById('last-updated').innerText = 'Synced at ' + new Date().toLocaleTimeString();
      } catch (err) {
        document.getElementById('status-dot').className = 'pulse-dot error';
        document.getElementById('latency-text').innerText = 'Offline: ' + err.message;
      } finally {
        loader.style.display = 'none';
      }
    }

    function switchTarget() {
      currentTarget = document.getElementById('target-select').value;
      fetchStats();
    }

    function updateInterval() {
      const ms = Number(document.getElementById('interval-select').value);
      if (timer) clearInterval(timer);
      if (ms > 0) {
        timer = setInterval(fetchStats, ms);
      }
    }

    async function runCustomQuery() {
      const q = document.getElementById('sql-input').value.trim();
      const meta = document.getElementById('query-meta');
      const resBox = document.getElementById('query-result');

      meta.innerText = 'Executing query...';
      try {
        const res = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target: currentTarget, query: q })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        meta.innerText = 'Returned ' + data.rowCount + ' row(s) in ' + data.durationMs + 'ms';
        if (data.rows.length === 0) {
          resBox.style.display = 'block';
          resBox.innerHTML = '<p style="padding: 16px; color: var(--text-muted);">Query returned 0 rows.</p>';
          return;
        }

        const cols = data.fields;
        let html = '<table><thead><tr>' + cols.map(c => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>';
        for (const row of data.rows) {
          html += '<tr>' + cols.map(c => '<td class="mono">' + (row[c] !== null ? row[c] : '<span style="color:#6b7280">NULL</span>') + '</td>').join('') + '</tr>';
        }
        html += '</tbody></table>';
        resBox.style.display = 'block';
        resBox.innerHTML = html;
      } catch (err) {
        meta.innerText = 'Error: ' + err.message;
        resBox.style.display = 'none';
      }
    }

    fetchStats();
    updateInterval();
  </script>
</body>
</html>`;
}

// Create HTTP server
const PORT = process.env.PORT || 4050;
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS headers for local access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Route: /api/stats
  if (url.pathname === '/api/stats' && req.method === 'GET') {
    const target = url.searchParams.get('target') || 'neon';
    try {
      const stats = await getDbStats(target);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stats));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Route: /api/query
  if (url.pathname === '/api/query' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const target = payload.target || 'neon';
        const query = payload.query || '';
        const result = await executeQuery(target, query);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Route: / (Dashboard UI)
  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderHtml());
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  🚀 Recovery Credit — Local DB Monitor Dashboard`);
  console.log(`  🔗 Open in browser: http://localhost:${PORT}`);
  console.log(`  📊 Monitoring Targets: Remote Neon DB & Local PostgreSQL`);
  console.log(`  🔒 Stays 100% locally on your machine`);
  console.log(`======================================================\n`);
});
