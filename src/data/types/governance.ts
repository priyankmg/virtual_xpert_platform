export type ActionType = 'READ' | 'ADVISORY' | 'ACTION';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AuditLogEntry {
  logId: string;
  timestamp: string;
  agentName: string;
  actionType: ActionType;
  clientId: string;
  inputSummary: string;
  outputSummary: string;
  confidenceScore: number;
  expertReviewRequired: boolean;
  expertApproved: boolean | null;
  expertId: string | null;
}

export interface GovernanceClassification {
  actionType: ActionType;
  riskLevel: RiskLevel;
  requiresExpertApproval: boolean;
  rationale: string;
}
