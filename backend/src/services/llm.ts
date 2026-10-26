import { env } from '../config/env';

// Thin LLM wrapper (SRS 2.4: "AI/LLM-based component"). Uses plain fetch so no SDK
// is required. Only the Anthropic provider is implemented; add others here.
export const isLlmConfigured = () =>
  env.LLM_PROVIDER === 'anthropic' && !!env.LLM_API_KEY && !!env.LLM_MODEL;

export async function llmText(system: string, user: string, maxTokens = 2000): Promise<string> {
  if (!isLlmConfigured()) throw new Error('LLM is not configured');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.LLM_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.LLM_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!res.ok) throw new Error(`LLM request failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  lastUsage = { prompt: data.usage?.input_tokens ?? null, completion: data.usage?.output_tokens ?? null };
  return (data.content ?? []).map((c) => (c.type === 'text' ? c.text ?? '' : '')).join('').trim();
}

export let lastUsage: { prompt: number | null; completion: number | null } = { prompt: null, completion: null };

export async function llmJson<T>(system: string, user: string): Promise<T> {
  const raw = await llmText(system + '\nRespond with a single JSON object only, no prose, no code fences.', user, 600);
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean) as T;
}
