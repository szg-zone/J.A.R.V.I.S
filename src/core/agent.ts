import { streamChat } from './llm.ts';
import { vault } from '../memory/vault.ts';
import { toolRegistry } from '../tools/registry.ts';
import type { Message } from './types.ts';

const MAX_ITERATIONS = 20;

const SYSTEM_PROMPT = `You are J.A.R.V.I.S., a helpful AI assistant.

Capabilities:
- You have access to tools for web search, file operations, running commands, and memory
- Always explain what you're doing before taking actions
- If a tool fails, explain the error and try alternatives
- Be concise but thorough
- Use tools proactively when needed
- Think step-by-step for complex tasks

Instructions:
- Use tools whenever needed to get accurate, up-to-date information
- Search the web for current information when needed
- Remember important information the user shares
- Check your memory when the user asks about things they've told you before`;

export interface AgentOptions {
  sessionId?: string;
  onToken?: (token: string) => void;
  onToolCall?: (tool: string, args: Record<string, unknown>) => void;
  onToolResult?: (tool: string, result: string) => void;
}

class Agent {
  async run(userMessage: string, options: AgentOptions = {}): Promise<string> {
    const sessionId = options.sessionId || 'default';
    const onToken = options.onToken;
    const onToolCall = options.onToolCall;
    const onToolResult = options.onToolResult;

    const history = vault.loadHistory(sessionId, 20);
    const context = vault.buildContext(userMessage, 2000);

    const systemContent = context 
      ? `${SYSTEM_PROMPT}\n\nMemory context (retrieved from your knowledge base):\n${context}`
      : SYSTEM_PROMPT;

    const messages: Message[] = [
      { role: 'system', content: systemContent },
      ...history,
      { role: 'user', content: userMessage }
    ];

    const toolMessages: Message[] = [];
    let fullResponse = '';
    let iteration = 0;

    while (iteration < MAX_ITERATIONS) {
      iteration++;

      const response = await streamChat(messages, {
        tools: toolRegistry.getDefinitions() as never,
        onToken: (token) => {
          fullResponse += token;
          onToken?.(token);
        }
      });

      if (!response.toolCalls || response.toolCalls.length === 0) {
        break;
      }

      for (const toolCall of response.toolCalls) {
        const args = JSON.parse(toolCall.function.arguments || '{}');
        
        onToolCall?.(toolCall.function.name, args);

        const result = await toolRegistry.execute(toolCall.function.name, args);
        
        onToolResult?.(toolCall.function.name, result);

        toolMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result
        });
      }

      messages.push(...toolMessages);
      toolMessages.length = 0;
    }

    vault.saveMessage(sessionId, 'user', userMessage);
    vault.saveMessage(sessionId, 'assistant', fullResponse);

    vault.extractAsync(fullResponse).catch(err => {
      console.error('[Agent] Extraction error:', err);
    });

    return fullResponse;
  }

  getToolDefinitions(): object[] {
    return toolRegistry.getDefinitions();
  }
}

export const agent = new Agent();
