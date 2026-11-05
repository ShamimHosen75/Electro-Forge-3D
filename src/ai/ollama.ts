import { holeLabel } from '../circuit/board';
import type { Circuit } from '../circuit/types';
import { blinkStats, formatHz, formatValue } from '../circuit/values';

export interface OllamaSettings {
  url: string;
  model: string;
}

/** In dev, Vite proxies /ollama to localhost:11434 so the browser doesn't hit CORS. */
export const DEFAULT_OLLAMA: OllamaSettings = {
  url: import.meta.env.DEV ? '/ollama' : 'http://localhost:11434',
  model: 'llama3.2',
};

const GRAMMAR = `You translate a user's request about a breadboard circuit into commands for a simple parser.
Reply with JSON only: {"commands": string[], "reply": string}.
Use only these command forms (one change per string, at most 4):
- "flip C1"                          (reverse a polarised part: electrolytic cap or LED)
- "move R3 to a20"                   (part id, destination hole)
- "swap R3 with 4.7k" / "swap C1 with 22uF"
- "change D1 color to green"         (red, green, blue, yellow, white, orange)
- "blink at 2 Hz" / "make it blink twice as fast" / "blink slower"
- "remove C2"
- "add a power LED" / "add a reset button" / "make it a monostable" / "make it astable"
- "undo"
Holes are a1..j30 (rows a-e front, f-j back, columns 1-30). Rails: FP/FN (front +/-), BP/BN (back +/-).
If the request can't be done with these commands, return "commands": [] and explain in "reply".`;

function describe(c: Circuit) {
  const parts = c.parts
    .map((p) => `${p.id} (${formatValue(p)}${p.reversed ? ', reversed' : ''}) at ${p.pins.map(holeLabel).join(', ')}`)
    .join('\n');
  const { freq } = blinkStats(c);
  return `Circuit "${c.name}", ${c.mode}${c.mode === 'astable' ? `, blinking at ${formatHz(freq)}` : ''}.\nParts:\n${parts}`;
}

export interface Translation {
  commands: string[];
  reply: string;
}

export async function translate(prompt: string, circuit: Circuit, s: OllamaSettings, signal?: AbortSignal): Promise<Translation> {
  const res = await fetch(`${s.url.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      model: s.model,
      stream: false,
      format: 'json',
      options: { temperature: 0.1 },
      messages: [
        { role: 'system', content: GRAMMAR },
        { role: 'user', content: `${describe(circuit)}\n\nRequest: ${prompt}` },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Ollama answered ${res.status}${res.status === 404 ? ` (is "${s.model}" pulled?)` : ''}`);
  const data = await res.json();
  let parsed: unknown;
  try {
    parsed = JSON.parse(data?.message?.content ?? '');
  } catch {
    throw new Error('The model did not return JSON.');
  }
  const obj = parsed as Partial<Translation>;
  const commands = Array.isArray(obj.commands) ? obj.commands.filter((x): x is string => typeof x === 'string').slice(0, 4) : [];
  return { commands, reply: typeof obj.reply === 'string' ? obj.reply : '' };
}

/** Lists installed models, or throws if Ollama isn't reachable. */
export async function listModels(url: string): Promise<string[]> {
  const res = await fetch(`${url.replace(/\/$/, '')}/api/tags`);
  if (!res.ok) throw new Error(`Ollama answered ${res.status}`);
  const data = await res.json();
  return (data?.models ?? []).map((m: { name: string }) => m.name);
}
