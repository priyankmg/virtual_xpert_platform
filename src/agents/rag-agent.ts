import { irsPrecedents } from '../data/mock/irs-precedents';
import { IRSPrecedent, RAGResult } from '../data/types/agents';
import { logAgentAction } from '../services/governance-store';

function computeRelevance(precedent: IRSPrecedent, query: string): number {
  const queryLower = query.toLowerCase();
  const keywords = precedent.relevanceKeywords.map(k => k.toLowerCase());
  const topicLower = precedent.topic.toLowerCase();

  let score = 0;
  for (const kw of keywords) {
    if (queryLower.includes(kw)) score += 0.15;
  }
  const topicWords = topicLower.split(/\W+/);
  for (const word of topicWords) {
    if (word.length > 4 && queryLower.includes(word)) score += 0.1;
  }

  return Math.min(score, 1.0);
}

export async function runRAGAgent(query: string, clientId: string = 'CLIENT-001'): Promise<RAGResult> {
  const scored = irsPrecedents.map(p => ({
    ...p,
    relevanceScore: computeRelevance(p, query),
  }));

  const topPrecedents = scored
    .filter(p => p.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5);

  const result: RAGResult = {
    query,
    precedents: topPrecedents.map(p => ({
      ...p,
      rulingSummary: p.rulingSummary ?? p.ruling.slice(0, 200),
      taxpayerOutcome: p.taxpayerOutcome ?? 'Not specified',
      applicabilityNote: p.applicabilityNote ?? 'Review for applicability to client situation.',
    })),
    sourcesRetrieved: irsPrecedents.length,
    confidenceInRelevance: topPrecedents.length > 0 ? topPrecedents[0].relevanceScore : 0,
  };

  logAgentAction({
    agentName: 'RAG Agent',
    actionType: 'READ',
    clientId,
    inputSummary: `Precedent lookup: "${query.slice(0, 80)}"`,
    outputSummary: `Retrieved ${topPrecedents.length} relevant precedents. Top confidence: ${result.confidenceInRelevance.toFixed(2)}`,
    confidenceScore: result.confidenceInRelevance,
    expertReviewRequired: false,
  });

  return result;
}
