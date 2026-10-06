export const aiProviders = ['openai', 'openrouter', 'groq', 'compatible', 'anthropic', 'gemini', 'local'] as const;
export type AIProvider = typeof aiProviders[number];
export const aiProviderProfiles: Record<AIProvider, { label: string; endpoint: string; modelPlaceholder: string; hint: string }> = {
  openai: { label: 'OpenAI', endpoint: 'https://api.openai.com/v1', modelPlaceholder: 'Model available on your account', hint: 'Use your OpenAI API key and model ID.' },
  openrouter: { label: 'OpenRouter', endpoint: 'https://openrouter.ai/api/v1', modelPlaceholder: 'provider/model', hint: 'Use your OpenRouter key and full model ID from its model catalog. Requests go through OpenRouter to the selected model provider.' },
  groq: { label: 'Groq', endpoint: 'https://api.groq.com/openai/v1', modelPlaceholder: 'Model ID from Groq', hint: 'Use your Groq API key and a model available on your account.' },
  compatible: { label: 'Custom OpenAI-compatible', endpoint: '', modelPlaceholder: 'Model ID supported by your endpoint', hint: 'Enter the HTTPS API base URL, model ID and key for an OpenAI-compatible Chat Completions service. Include its version path; do not append /chat/completions.' },
  anthropic: { label: 'Anthropic', endpoint: 'https://api.anthropic.com/v1', modelPlaceholder: 'Model available on your account', hint: 'Use your Anthropic API key and model ID.' },
  gemini: { label: 'Google Gemini', endpoint: 'https://generativelanguage.googleapis.com/v1beta', modelPlaceholder: 'Gemini model ID', hint: 'Use your Gemini API key and model ID.' },
  local: { label: 'Local OpenAI-compatible', endpoint: 'http://localhost:1234/v1', modelPlaceholder: 'Model loaded on your local server', hint: 'Use an OpenAI-compatible local server such as LM Studio or Ollama. A key is optional. The server must allow browser CORS requests.' },
};
export const usesChatCompletions = (provider: AIProvider) => provider !== 'anthropic' && provider !== 'gemini';
