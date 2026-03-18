'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X, MessageSquare, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AssistantPanelProps {
  clientId: string;
}

const SUGGESTIONS = [
  "What is Sarah's estimated Q4 tax liability?",
  "Flag any payroll compliance issues",
  "What are the biggest deduction risks?",
];

export default function AssistantPanel({ clientId }: AssistantPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm the Intuit Assistant. I have access to Sarah Chen's financial data across all 6 source systems. Ask me anything about her tax situation, compliance risks, or financial position.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          clientId,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply ?? data.error ?? 'Unable to generate response.',
        timestamp: data.timestamp ?? new Date().toISOString(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error. Please add your ANTHROPIC_API_KEY to .env.local and restart the server.',
        timestamp: new Date().toISOString(),
      }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center z-50 transition-all hover:scale-105 hover:shadow-xl"
        style={{ background: '#0077C5', boxShadow: '0 4px 16px rgba(0,119,197,0.4)' }}
        aria-label="Open Intuit Assistant"
      >
        <Sparkles size={22} className="text-white" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          style={{ height: '520px', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 16px 48px rgba(0,0,0,0.15)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100" style={{ background: '#F8FAFC' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#0077C5' }}>
                <Bot size={15} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-bold" style={{ color: '#1E293B' }}>Intuit Assistant</div>
                <div className="text-xs" style={{ color: '#94A3B8' }}>AI-powered · Atlas Platform</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X size={15} style={{ color: '#94A3B8' }} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#FAFBFC' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${
                  msg.role === 'assistant' ? 'bg-blue-100' : 'bg-slate-200'
                }`}>
                  {msg.role === 'assistant'
                    ? <Bot size={12} style={{ color: '#0077C5' }} />
                    : <User size={12} style={{ color: '#64748B' }} />
                  }
                </div>
                <div
                  className={`max-w-[280px] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                  style={{
                    background: msg.role === 'user' ? '#0077C5' : '#FFFFFF',
                    color: msg.role === 'user' ? '#FFFFFF' : '#1E293B',
                    border: msg.role === 'assistant' ? '1px solid #E2E8F0' : 'none',
                    boxShadow: msg.role === 'assistant' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot size={12} style={{ color: '#0077C5' }} />
                </div>
                <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm bg-white border border-slate-200">
                  <Loader2 size={13} className="text-blue-500 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 space-y-1" style={{ background: '#FAFBFC' }}>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInput(s)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg border transition-colors truncate font-medium"
                  style={{ color: '#0077C5', background: '#EFF6FF', borderColor: '#BAE0F7' }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="px-3 pb-3 border-t border-slate-100 pt-3" style={{ background: '#FFFFFF' }}>
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                className="flex-1 resize-none text-sm outline-none rounded-xl px-3 py-2.5 transition-shadow"
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  color: '#1E293B',
                  minHeight: '40px',
                  maxHeight: '80px',
                }}
                placeholder="Ask about Sarah's financials…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                style={{ background: '#0077C5', boxShadow: '0 2px 6px rgba(0,119,197,0.3)' }}
              >
                <Send size={14} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
