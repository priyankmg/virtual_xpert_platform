/**
 * Self-Healing API Agent
 *
 * Monitors the health of all source system integrations and internal agents.
 * When a failure is detected, it:
 *   1. Retries with exponential backoff (up to 3 attempts)
 *   2. Falls back to cached data if retries are exhausted
 *   3. Logs all recovery attempts to the governance store
 *   4. Reports a health summary so the UI can surface system status
 */

import { getCachedSnapshot } from './das';
import { logAgentAction } from '../services/governance-store';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SystemStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'RECOVERED';

export interface SystemHealth {
  system: string;
  status: SystemStatus;
  latencyMs: number | null;
  lastChecked: string;
  errorMessage?: string;
  recoveredFromCache: boolean;
  retryCount: number;
}

export interface HealingReport {
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'INCIDENT';
  systems: SystemHealth[];
  agentStatus: AgentHealth[];
  checkedAt: string;
  healingActionsCount: number;
  cacheHits: number;
  recommendation: string;
}

export interface AgentHealth {
  agent: string;
  status: SystemStatus;
  lastSuccessfulRun: string | null;
  avgLatencyMs: number | null;
  errorRate: number;
}

// ── Source system health simulation ──────────────────────────────────────────

const SOURCE_SYSTEMS = [
  { name: 'QuickBooks Online', key: 'quickbooks', owner: 'intuit', baseLatency: 180 },
  { name: 'ADP Payroll', key: 'adp', owner: 'third-party', baseLatency: 240 },
  { name: 'Expensify', key: 'expensify', owner: 'third-party', baseLatency: 210 },
  { name: 'Stripe', key: 'stripe', owner: 'third-party', baseLatency: 160 },
  { name: 'Inventory System (Legacy)', key: 'inventory', owner: 'third-party', baseLatency: 320 },
  { name: 'Prior Year Tax Returns', key: 'tax-returns', owner: 'intuit', baseLatency: 140 },
];

const AGENT_SYSTEMS = [
  { name: 'Data Aggregation Service', key: 'das', baseLatency: 850 },
  { name: 'Summarizer Agent', key: 'summarizer', baseLatency: 1200 },
  { name: 'Policy Evaluation Agent', key: 'policy', baseLatency: 1100 },
  { name: 'RAG Agent', key: 'rag', baseLatency: 720 },
  { name: 'Tax Classifier Agent', key: 'tax-classifier', baseLatency: 950 },
  { name: 'Governance Agent', key: 'governance', baseLatency: 380 },
  { name: 'Intuit Assistant', key: 'assistant', baseLatency: 1400 },
];

// Simulate realistic variance — most systems healthy, occasional degradation
function simulateSystemCheck(baseLatency: number): {
  ok: boolean;
  latencyMs: number;
  error?: string;
} {
  const variance = (Math.random() - 0.5) * 0.4; // ±20%
  const latency = Math.round(baseLatency * (1 + variance));

  // 4% chance of simulated failure per system check
  const failureRoll = Math.random();
  if (failureRoll < 0.02) {
    return { ok: false, latencyMs: latency, error: 'Connection timeout after 5000ms' };
  }
  if (failureRoll < 0.04) {
    return { ok: false, latencyMs: latency, error: 'HTTP 503 Service Temporarily Unavailable' };
  }

  // 5% chance of degraded (high latency)
  if (failureRoll < 0.09) {
    return { ok: true, latencyMs: latency * 3 };
  }

  return { ok: true, latencyMs: latency };
}

// ── Exponential backoff retry ─────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 200
): Promise<{ result: T | null; attempts: number; recovered: boolean }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      return { result, attempts: attempt, recovered: attempt > 1 };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxAttempts) {
        // Exponential backoff: 200ms, 400ms, 800ms
        await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, attempt - 1)));
      }
    }
  }

  return { result: null, attempts: maxAttempts, recovered: false };
}

// ── Wrapped agent caller with self-healing ────────────────────────────────────

export async function callWithHealing<T>(
  agentName: string,
  agentFn: () => Promise<T>,
  fallback: T,
  clientId: string
): Promise<{ data: T; healed: boolean; attempts: number }> {
  const { result, attempts, recovered } = await withRetry(agentFn, 3, 300);

  if (result !== null) {
    if (recovered) {
      logAgentAction({
        agentName: 'API Healing Agent',
        actionType: 'READ',
        clientId,
        inputSummary: `Monitored: ${agentName}`,
        outputSummary: `Recovered after ${attempts} attempt(s). System now healthy.`,
        confidenceScore: 0.95,
        expertReviewRequired: false,
      });
    }
    return { data: result, healed: recovered, attempts };
  }

  // All retries exhausted — use fallback (cached or mock data)
  logAgentAction({
    agentName: 'API Healing Agent',
    actionType: 'ADVISORY',
    clientId,
    inputSummary: `Monitored: ${agentName} — all ${attempts} attempts failed`,
    outputSummary: `Falling back to cached/mock data. System marked DEGRADED.`,
    confidenceScore: 0.60,
    expertReviewRequired: true,
  });

  return { data: fallback, healed: false, attempts };
}

// ── Full health report ────────────────────────────────────────────────────────

export async function runHealthCheck(clientId: string = 'CLIENT-001'): Promise<HealingReport> {
  const checkedAt = new Date().toISOString();
  let healingActionsCount = 0;
  let cacheHits = 0;

  // Check source systems
  const systems: SystemHealth[] = SOURCE_SYSTEMS.map(sys => {
    let retryCount = 0;
    let check = simulateSystemCheck(sys.baseLatency);
    let recovered = false;

    // Attempt up to 2 retries inline
    while (!check.ok && retryCount < 2) {
      retryCount++;
      healingActionsCount++;
      check = simulateSystemCheck(sys.baseLatency);
      if (check.ok) recovered = true;
    }

    const usedCache = !check.ok;
    if (usedCache) cacheHits++;

    let status: SystemStatus = 'HEALTHY';
    if (!check.ok) status = 'DOWN';
    else if (recovered) status = 'RECOVERED';
    else if (check.latencyMs > sys.baseLatency * 2) status = 'DEGRADED';

    return {
      system: sys.name,
      status,
      latencyMs: check.ok ? check.latencyMs : null,
      lastChecked: checkedAt,
      errorMessage: check.error,
      recoveredFromCache: usedCache,
      retryCount,
    };
  });

  // Check agent health
  const agentStatus: AgentHealth[] = AGENT_SYSTEMS.map(agent => {
    const check = simulateSystemCheck(agent.baseLatency);
    const errorRate = Math.random() < 0.05 ? Math.random() * 0.08 : Math.random() * 0.02;

    let status: SystemStatus = 'HEALTHY';
    if (!check.ok) status = 'DOWN';
    else if (check.latencyMs > agent.baseLatency * 2.5) status = 'DEGRADED';

    return {
      agent: agent.name,
      status,
      lastSuccessfulRun: new Date(Date.now() - Math.random() * 300000).toISOString(),
      avgLatencyMs: check.ok ? check.latencyMs : null,
      errorRate: +errorRate.toFixed(3),
    };
  });

  const downSystems = systems.filter(s => s.status === 'DOWN').length;
  const degradedSystems = systems.filter(s => s.status === 'DEGRADED').length;

  const overallStatus =
    downSystems > 1 ? 'INCIDENT' :
    downSystems === 1 || degradedSystems > 1 ? 'DEGRADED' : 'HEALTHY';

  const recommendation =
    overallStatus === 'HEALTHY'
      ? 'All systems operating normally. Session brief generation will use live data.'
      : overallStatus === 'DEGRADED'
      ? `${degradedSystems + downSystems} system(s) affected. Agent pipeline will use cached data where available. Session brief may reflect data from prior snapshot.`
      : 'Multiple system failures detected. Session brief is running entirely from cached data. Recommend rescheduling if data freshness is critical.';

  // Log the health check run
  if (healingActionsCount > 0) {
    logAgentAction({
      agentName: 'API Healing Agent',
      actionType: 'READ',
      clientId,
      inputSummary: `Periodic health check — ${SOURCE_SYSTEMS.length} source systems, ${AGENT_SYSTEMS.length} agents`,
      outputSummary: `Status: ${overallStatus}. ${healingActionsCount} healing action(s). ${cacheHits} cache fallback(s).`,
      confidenceScore: overallStatus === 'HEALTHY' ? 0.99 : 0.72,
      expertReviewRequired: overallStatus === 'INCIDENT',
    });
  }

  return {
    overallStatus,
    systems,
    agentStatus,
    checkedAt,
    healingActionsCount,
    cacheHits,
    recommendation,
  };
}
