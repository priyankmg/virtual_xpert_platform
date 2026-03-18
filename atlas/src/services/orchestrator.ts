import { generateSnapshot } from '../agents/das';
import { runSummarizerAgent } from '../agents/summarizer-agent';
import { runPolicyEvaluationAgent } from '../agents/policy-evaluation-agent';
import { runRAGAgent } from '../agents/rag-agent';
import { runTaxClassifierAgent } from '../agents/tax-classifier-agent';
import { OrchestratorResult } from '../data/types/agents';
import { logAgentAction } from './governance-store';

export async function runFullPipeline(clientId: string): Promise<OrchestratorResult> {
  const startTime = Date.now();

  // Step 1: DAS (must complete first)
  const snapshot = await generateSnapshot(clientId);

  // Step 2: Sequential agents that depend on snapshot
  const [summary, policyReport, taxEstimate] = await Promise.all([
    runSummarizerAgent(snapshot, 'expert'),
    runPolicyEvaluationAgent(snapshot),
    runTaxClassifierAgent(snapshot),
  ]);

  // Step 3: RAG agent uses policy findings as query
  const policyQuery = policyReport.findings
    .filter(f => f.riskLevel === 'HIGH')
    .map(f => f.area)
    .join(', ');

  const ragResult = await runRAGAgent(
    `${policyQuery} contractor classification S-Corp reasonable compensation meals entertainment`,
    clientId
  );

  const totalDurationMs = Date.now() - startTime;

  const result: OrchestratorResult = {
    snapshot,
    summary,
    policyReport,
    ragResult,
    taxEstimate,
    completedAt: new Date().toISOString(),
    totalDurationMs,
  };

  logAgentAction({
    agentName: 'Orchestrator',
    actionType: 'ADVISORY',
    clientId,
    inputSummary: `Full pipeline triggered for client ${clientId}`,
    outputSummary: `Pipeline complete in ${totalDurationMs}ms. All agents succeeded.`,
    confidenceScore: 0.88,
    expertReviewRequired: false,
  });

  return result;
}
