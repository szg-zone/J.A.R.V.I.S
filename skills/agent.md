# Agent Skill
# J.A.R.V.I.S - SZG — Agent Loop Implementation

> Expert knowledge for implementing the agent loop, tool calling, and multi-agent orchestration.

---

## When to Read

Read this skill before implementing or modifying:
- `src/core/agent.ts` — the main agent loop
- Any multi-agent orchestration
- Tool calling patterns

---

## Agent Loop Pattern

### Core Implementation

```typescript
// src/core/agent.ts
import { chat, streamChat } from './llm.ts';
import { vault } from '../memory/vault.ts';
import { toolRegistry } from '../tools/registry.ts';

const MAX_ITERATIONS = 20;

export async function runAgent(
  messages: Message[],
  onToken?: (token: string) => void
): Promise<string> {
  // 1. Load conversation history
  const history = vault.loadHistory(sessionId);
  
  // 2. Build knowledge context
  const context = vault.buildContext(userMessage);
  
  // 3. Combine: system prompt + knowledge context + history + current message
  const prompt = buildPrompt(context, history, userMessage);
  
  // 4. Iterate with tools
  let iteration = 0;
  let fullResponse = '';
  const toolMessages: Message[] = [];
  
  while (iteration < MAX_ITERATIONS) {
    iteration++;
    
    // 5. Call LLM with tools
    const response = await streamChat(prompt, toolMessages, {
      tools: toolRegistry.getDefinitions(),
      onToken: (token) => {
        fullResponse += token;
        onToken?.(token);
      }
    });
    
    // 6. Check for tool calls
    if (!response.toolCalls || response.toolCalls.length === 0) {
      break; // Done
    }
    
    // 7. Execute each tool
    for (const toolCall of response.toolCalls) {
      const result = await toolRegistry.execute(
        toolCall.function.name,
        JSON.parse(toolCall.function.arguments)
      );
      
      // 8. Push tool result back
      toolMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result
      });
    }
  }
  
  // 9. Save messages to memory
  vault.saveMessage(sessionId, 'user', userMessage);
  vault.saveMessage(sessionId, 'assistant', fullResponse);
  
  // 10. Fire-and-forget knowledge extraction
  vault.extractAsync(fullResponse).catch(console.error);
  
  return fullResponse;
}
```

---

## System Prompt

```typescript
const SYSTEM_PROMPT = `You are J.A.R.V.I.S., a helpful AI assistant.

Capabilities:
- You have access to tools for web search, file operations, running commands, and memory
- Always explain what you're doing before taking actions
- If a tool fails, explain the error and try alternatives

Memory context (retrieved from your knowledge base):
${context}

Instructions:
- Be concise but thorough
- Use tools proactively when needed
- Think step-by-step for complex tasks`;
```

---

## Tool Calling Best Practices

1. **Always validate tool arguments** before execution
2. **Catch all tool errors** — never throw from execute()
3. **Return strings** — never throw error objects
4. **Log tool usage** for debugging
5. **Set timeouts** for long-running operations

---

## Context Management

- **Max tokens**: Keep prompt under 80% of context window
- **History**: Last 20 messages or 10K tokens
- **Knowledge**: Top 5 most relevant memories
- **Budget**: Reserve 2K tokens for completion

---

## Multi-Agent Patterns

For parallel agents:
```typescript
// Dispatch multiple agents concurrently
const results = await Promise.all([
  agent1.run(task1),
  agent2.run(task2),
  agent3.run(task3)
]);
```

For supervisor pattern:
```typescript
// Supervisor decides which sub-agents to call
const supervisorResponse = await chat([
  { role: 'system', content: SUPERVISOR_PROMPT },
  { role: 'user', content: task }
]);
```

---

## Iteration Limits

| Scenario | Max Iterations |
|----------|---------------|
| Simple Q&A | 1-2 |
| Tool usage | 5-10 |
| Complex workflow | 15-20 |
| Fallback | 20 (hard limit) |

---

## Error Handling

```typescript
try {
  const result = await runAgent(messages, onToken);
  return result;
} catch (error) {
  // Don't expose internal errors to user
  return "I encountered an error processing your request.";
}
```

---

## Related Skills

- `memory.md` — For knowledge context injection
- `tools.md` — For tool definitions and execution
- `server.md` — For WebSocket streaming
