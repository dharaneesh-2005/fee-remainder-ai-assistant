import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;
const defaultModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

export const groq = new Groq({ apiKey });

export async function quickAnswer(messages, { model = defaultModel, temperature = 0.2 } = {}) {
  const start = Date.now();
  const completion = await groq.chat.completions.create({
    model,
    messages,
    temperature,
  });
  const latencyMs = Date.now() - start;
  return { text: completion.choices?.[0]?.message?.content || '', latencyMs };
}

// Placeholder plan for Whisper live transcription
// For 2s E2E target: use client-streaming WebSocket to send audio chunks to a
// proxy; Groq Whisper large v3 turbo transcribes; partials are forwarded to quickAnswer
// Not implemented here yet, we will add a signaling endpoint under /remind/live.
