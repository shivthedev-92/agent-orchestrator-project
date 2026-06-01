export const MODELS = [
  { id: 'opus-4',      name: 'Opus 4.5',          meta: 'reasoning · 200k', provider: 'anthropic' },
  { id: 'sonnet-4',    name: 'Sonnet 4.5',        meta: 'balanced · 200k',  provider: 'anthropic' },
  { id: 'haiku-4',     name: 'Haiku 4.5',         meta: 'fast · 100k',      provider: 'anthropic' },
  { id: 'gpt-4o',      name: 'GPT-4o',            meta: 'general · 128k',   provider: 'openai' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini',       meta: 'fast · 128k',      provider: 'openai' },
  { id: 'qwen3:8b',    name: 'Qwen3 8B',          meta: 'local · Ollama',   provider: 'ollama' },
  { id: 'none',        name: 'No model',          meta: 'pass-through',     provider: 'none' },
];

export const MODEL_PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic', models: ['opus-4', 'sonnet-4', 'haiku-4'] },
  { id: 'openai',    name: 'OpenAI',    models: ['gpt-4o', 'gpt-4o-mini'] },
  { id: 'ollama',    name: 'Ollama',    models: ['qwen3:8b'] },
  { id: 'none',      name: 'None',      models: ['none'] },
];
