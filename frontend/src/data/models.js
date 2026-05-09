export const MODELS = [
  { id: 'opus-4',    name: 'Opus 4.5',     meta: 'reasoning · 200k' },
  { id: 'sonnet-4',  name: 'Sonnet 4.5',   meta: 'balanced · 200k' },
  { id: 'haiku-4',   name: 'Haiku 4.5',    meta: 'fast · 100k' },
  { id: 'gpt-class', name: 'Generalist L', meta: 'long ctx · 1M' },
  { id: 'mini-fast', name: 'Mini',         meta: 'tiny · 32k' },
  { id: 'none',      name: 'No model',     meta: 'pass-through' },
];

export const MODEL_PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic', models: ['opus-4', 'sonnet-4', 'haiku-4'] },
  { id: 'openai',    name: 'OpenAI',    models: ['gpt-class', 'mini-fast'] },
  { id: 'none',      name: 'None',      models: ['none'] },
];
