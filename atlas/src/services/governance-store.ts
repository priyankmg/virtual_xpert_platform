import { AuditLogEntry, ActionType } from '../data/types/governance';
import { randomUUID } from 'crypto';

const auditLog: AuditLogEntry[] = [];

export function logAgentAction(params: {
  agentName: string;
  actionType: ActionType;
  clientId: string;
  inputSummary: string;
  outputSummary: string;
  confidenceScore: number;
  expertReviewRequired: boolean;
}): AuditLogEntry {
  const entry: AuditLogEntry = {
    logId: randomUUID(),
    timestamp: new Date().toISOString(),
    agentName: params.agentName,
    actionType: params.actionType,
    clientId: params.clientId,
    inputSummary: params.inputSummary,
    outputSummary: params.outputSummary,
    confidenceScore: params.confidenceScore,
    expertReviewRequired: params.expertReviewRequired,
    expertApproved: params.expertReviewRequired ? null : true,
    expertId: null,
  };
  auditLog.push(entry);
  return entry;
}

export function getAuditLog(): AuditLogEntry[] {
  return [...auditLog].reverse();
}

export function getPendingApprovals(): AuditLogEntry[] {
  return auditLog.filter(e => e.expertReviewRequired && e.expertApproved === null);
}

export function approveAction(logId: string, expertId: string): AuditLogEntry | null {
  const entry = auditLog.find(e => e.logId === logId);
  if (!entry) return null;
  entry.expertApproved = true;
  entry.expertId = expertId;
  return entry;
}

export function rejectAction(logId: string, expertId: string): AuditLogEntry | null {
  const entry = auditLog.find(e => e.logId === logId);
  if (!entry) return null;
  entry.expertApproved = false;
  entry.expertId = expertId;
  return entry;
}
