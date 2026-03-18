import type {
  Message,
  ToolDefinition,
  ChatOptions,
  StreamOptions,
  ChatResponse,
  RetryConfig,
} from './types.ts';

const BASE_URL = 'https://integrate.api.nvidia.com/v1';
const MODEL = 'deepseek-ai/deepseek-v3-2';

function getApiKey(): string {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) {
    throw new Error('NVIDIA_API_KEY is not set in environment');
  }
  return key;
}

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getApiKey()}`,
  };
}

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  config: RetryConfig = { maxAttempts: 3, backoffMs: [1000, 2000, 4000], timeoutMs: 30000 }
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json() as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < config.maxAttempts - 1) {
        const backoffMs = config.backoffMs[attempt] || config.backoffMs[config.backoffMs.length - 1];
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

export async function chat(
  messages: Message[],
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 4096,
  };

  if (options.tools && options.tools.length > 0) {
    body.tools = options.tools;
  }

  const response = await fetchWithRetry<{
    choices: Array<{
      message: {
        content: string;
        tool_calls?: Array<{
          id: string;
          type: string;
          function: {
            name: string;
            arguments: string;
          };
        }>;
      };
    }>;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }>(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const choice = response.choices[0];
  if (!choice) {
    return { content: '' };
  }

  return {
    content: choice.message.content || '',
    toolCalls: choice.message.tool_calls?.map(tc => ({
      id: tc.id,
      type: tc.type,
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments,
      },
    })),
    usage: response.usage,
  };
}

export async function streamChat(
  messages: Message[],
  options: StreamOptions = {}
): Promise<ChatResponse> {
  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 4096,
    stream: true,
  };

  if (options.tools && options.tools.length > 0) {
    body.tools = options.tools;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  let fullReasoning = '';
  let toolCalls: { id: string; type: string; function: { name: string; arguments: string } }[] = [];
  let currentToolCall: { id: string; type: string; function: { name: string; arguments: string } } | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;
          
          if (!delta) continue;
          
          if (delta.reasoning_content) {
            fullReasoning += delta.reasoning_content;
            options.onReasoning?.(delta.reasoning_content);
          }
          
          if (delta.content) {
            fullContent += delta.content;
            options.onToken?.(delta.content);
          }
          
          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              if (tc.type === 'function') {
                if (!currentToolCall || currentToolCall.id !== tc.id) {
                  currentToolCall = {
                    id: tc.id,
                    type: tc.type,
                    function: {
                      name: tc.function.name,
                      arguments: tc.function.arguments || '',
                    },
                  };
                  toolCalls.push(currentToolCall);
                } else {
                  currentToolCall.function.arguments += tc.function.arguments || '';
                }
              }
            }
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return {
    content: fullContent,
    reasoning: fullReasoning || undefined,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
  };
}

export function validateApiKey(): boolean {
  return !!process.env.NVIDIA_API_KEY;
}
