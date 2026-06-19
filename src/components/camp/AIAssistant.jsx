import React, { useState } from 'react';
import { Sparkles, Send, Loader2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';

const QUICK_PROMPTS = [
  { label: '📋 Suggest Equipment List', prompt: 'Suggest a comprehensive equipment list for this camp' },
  { label: '💰 Budget Recommendation', prompt: 'Suggest a realistic budget breakdown for this camp' },
  { label: '⚡ Activity Schedule', prompt: 'Generate a suggested daily activity schedule for this camp' },
  { label: '🛡️ Safety Checklist', prompt: 'Identify potential safety risks and recommend mitigation measures' },
  { label: '🍽️ Meal Plan', prompt: 'Suggest a nutritious meal plan for the camp duration' },
  { label: '📊 Readiness Report', prompt: 'Assess the overall camp readiness based on the current plan and list what is missing' },
];

export default function AIAssistant({ formData }) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your AI Camp Planning Assistant. I can help you with budgets, schedules, equipment lists, safety planning, and more. What would you like help with?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const send = async (text) => {
    const userMsg = text || prompt;
    if (!userMsg.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setPrompt('');
    setIsLoading(true);

    try {
      const context = `
Camp Plan Context:
- Name: ${formData.title || 'Unnamed Camp'}
- Type: ${formData.camp_type || 'scouting'}
- Dates: ${formData.start_date || 'TBD'} to ${formData.end_date || 'TBD'}
- Location: ${formData.location || 'TBD'}
- Participants: ${formData.participants_count || 0}
- Status: ${formData.status || 'draft'}
- Budget (estimated): ${formData.budget?.planned_total || 0} ${formData.budget?.currency || 'RWF'}
- Schedule days: ${(formData.schedule || []).length}
- Tasks: ${(formData.tasks || []).length} total, ${(formData.tasks || []).filter(t => t.status === 'done').length} done
- Equipment items: ${(formData.equipment || []).length}
- Participants registered: ${(formData.participants || []).length}
- Risks identified: ${(formData.risks || []).length}

User question: ${userMsg}

You are an expert camp planning assistant. Provide practical, specific, actionable advice. Format your response clearly with sections, bullet points or numbered lists where appropriate.
      `;

      const response = await base44.integrations.Core.InvokeLLM({ prompt: context });
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Sorry, I couldn\'t process that request. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold">AI Camp Planning Assistant</h3>
            <p className="text-xs text-white/80">Powered by advanced AI to help you plan the perfect camp</p>
          </div>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map(qp => (
          <button
            key={qp.label}
            onClick={() => send(qp.prompt)}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-full border border-violet-200 transition-colors disabled:opacity-50"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Chat */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border">
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm ${msg.role === 'assistant' ? 'bg-violet-600' : 'bg-primary'}`}>
                {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : '👤'}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${msg.role === 'assistant' ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200' : 'bg-primary text-primary-foreground'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            </div>
          )}
        </div>
        <div className="border-t p-3 flex gap-2">
          <Textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything about your camp plan... (Enter to send)"
            className="flex-1 min-h-[40px] max-h-24 resize-none text-sm"
          />
          <Button onClick={() => send()} disabled={isLoading || !prompt.trim()} className="self-end">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}