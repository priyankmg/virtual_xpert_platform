import Anthropic from '@anthropic-ai/sdk';
import { generateSnapshot, getCachedSnapshot } from './das';
import { runSummarizerAgent } from './summarizer-agent';
import { runPolicyEvaluationAgent } from './policy-evaluation-agent';
import { runRAGAgent } from './rag-agent';
import { runTaxClassifierAgent } from './tax-classifier-agent';
import { logAgentAction } from '../services/governance-store';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type IntentCategory =
  | 'SNAPSHOT_QUERY'
  | 'SUMMARY_REQUEST'
  | 'POLICY_CHECK'
  | 'PRECEDENT_LOOKUP'
  | 'TAX_ESTIMATE'
  | 'GENERAL';

function classifyIntent(message: string): IntentCategory {
  const lower = message.toLowerCase();
  if (lower.includes('snapshot') || lower.includes('balance') || lower.includes('revenue') || lower.includes('payroll data')) return 'SNAPSHOT_QUERY';
  if (lower.includes('summar') || lower.includes('overview') || lower.includes('brief') || lower.includes('financial position')) return 'SUMMARY_REQUEST';
  if (lower.includes('compliance') || lower.includes('deduct') || lower.includes('policy') || lower.includes('contractor') || lower.includes('classification')) return 'POLICY_CHECK';
  if (lower.includes('precedent') || lower.includes('case') || lower.includes('ruling') || lower.includes('audit') || lower.includes('irs decision')) return 'PRECEDENT_LOOKUP';
  if (lower.includes('tax') || lower.includes('liability') || lower.includes('estimate') || lower.includes('owe')) return 'TAX_ESTIMATE';
  return 'GENERAL';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function chat(messages: ChatMessage[], clientId: string): Promise<string> {
  const lastMessage = messages[messages.length - 1]?.content ?? '';
  const intent = classifyIntent(lastMessage);

  let contextData = '';
  let agentResults = '';

  try {
    if (intent === 'SNAPSHOT_QUERY') {
      const snapshot = getCachedSnapshot(clientId) ?? await generateSnapshot(clientId);
      contextData = `Revenue: $${snapshot.accounting.revenue.toLocaleString()}, Net Income: $${snapshot.accounting.netIncome.toLocaleString()}, Payroll: $${snapshot.payroll.totalWages.toLocaleString()}, Flagged Expenses: $${snapshot.expenses.flagged.toLocaleString()}`;
    } else if (intent === 'SUMMARY_REQUEST') {
      const snapshot = getCachedSnapshot(clientId) ?? await generateSnapshot(clientId);
      const summary = await runSummarizerAgent(snapshot, 'expert');
      contextData = `Executive Summary: ${summary.executiveSummary}. Attention items: ${summary.attentionItems.map(i => i.description).join('; ')}`;
    } else if (intent === 'POLICY_CHECK') {
      const snapshot = getCachedSnapshot(clientId) ?? await generateSnapshot(clientId);
      const report = await runPolicyEvaluationAgent(snapshot);
      const highRisk = report.findings.filter(f => f.riskLevel === 'HIGH');
      contextData = `Policy findings (${report.overallRiskLevel} overall risk): ${highRisk.map(f => `${f.area}: ${f.finding.slice(0, 100)}`).join('; ')}`;
    } else if (intent === 'PRECEDENT_LOOKUP') {
      const ragResult = await runRAGAgent(lastMessage, clientId);
      agentResults = ragResult.precedents.slice(0, 3).map(p => `${p.title} (${p.year}): ${p.rulingSummary}`).join('\n');
      contextData = `Relevant IRS precedents found:\n${agentResults}`;
    } else if (intent === 'TAX_ESTIMATE') {
      const snapshot = getCachedSnapshot(clientId) ?? await generateSnapshot(clientId);
      const estimate = await runTaxClassifierAgent(snapshot);
      contextData = `Tax Estimate — Base: $${estimate.scenarios.base.totalLiability.toLocaleString()}, Conservative: $${estimate.scenarios.conservative.totalLiability.toLocaleString()}, Optimistic: $${estimate.scenarios.optimistic.totalLiability.toLocaleString()}. Confidence: ${(estimate.confidenceScore * 100).toFixed(0)}%`;
    }
  } catch {
    contextData = 'Agent data unavailable — responding from general knowledge.';
  }

  const systemPrompt = `You are the Intuit Assistant for Atlas, a Virtual Expert Platform for financial accounting. You are helping prepare for an expert session with Sarah Chen, Controller at Meridian Home Goods (S-Corp, $12.4M revenue, 85 employees, California).

${contextData ? `Relevant data from Atlas agents:\n${contextData}\n` : ''}

Rules:
- Always identify when a response requires expert confirmation before being shared with the client
- Never state a tax position as definitive — always frame as 'based on the data available'
- Surface confidence scores when available
- Flag data gaps that could affect accuracy
- Be concise and professional
- ${contextData ? `Intent classified as: ${intent}` : 'Handling as general query'}`;

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });

  const reply = response.content[0].type === 'text' ? response.content[0].text : 'Unable to generate response.';

  logAgentAction({
    agentName: 'Intuit Assistant',
    actionType: 'ADVISORY',
    clientId,
    inputSummary: `Chat message (intent: ${intent}): "${lastMessage.slice(0, 80)}"`,
    outputSummary: `Response generated. ${reply.slice(0, 100)}`,
    confidenceScore: 0.85,
    expertReviewRequired: false,
  });

  return reply;
}
