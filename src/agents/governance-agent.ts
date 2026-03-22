import { GovernanceClassification, ActionType } from '../data/types/governance';
import { logAgentAction } from '../services/governance-store';

const agentRiskMap: Record<string, ActionType> = {
  'Data Aggregation Service': 'READ',
  'RAG Agent': 'READ',
  'Summarizer Agent': 'ADVISORY',
  'Policy Evaluation Agent': 'ADVISORY',
  'Tax Estimation Classifier': 'ADVISORY',
  'Atlas Assistant': 'ADVISORY',
};

export function classifyAction(agentName: string, outputDescription: string): GovernanceClassification {
  const actionType: ActionType = agentRiskMap[agentName] ?? 'ADVISORY';

  const isHighRisk =
    outputDescription.toLowerCase().includes('file') ||
    outputDescription.toLowerCase().includes('amend') ||
    outputDescription.toLowerCase().includes('pay') ||
    outputDescription.toLowerCase().includes('claim');

  const finalActionType: ActionType = isHighRisk ? 'ACTION' : actionType;

  const classification: GovernanceClassification = {
    actionType: finalActionType,
    riskLevel: finalActionType === 'ACTION' ? 'HIGH' : finalActionType === 'ADVISORY' ? 'MEDIUM' : 'LOW',
    requiresExpertApproval: finalActionType === 'ACTION',
    rationale: finalActionType === 'ACTION'
      ? 'Output contains actionable filing or payment recommendation requiring expert confirmation before client delivery.'
      : finalActionType === 'ADVISORY'
      ? 'Output is analytical. Surfaced to expert with confidence score. No client delivery without expert review.'
      : 'Data retrieval only. No advisory content. Safe for autonomous execution.',
  };

  logAgentAction({
    agentName: 'Governance Agent',
    actionType: 'READ',
    clientId: 'SYSTEM',
    inputSummary: `Classifying action for ${agentName}`,
    outputSummary: `Classified as ${finalActionType} — ${classification.riskLevel} risk`,
    confidenceScore: 1.0,
    expertReviewRequired: false,
  });

  return classification;
}
