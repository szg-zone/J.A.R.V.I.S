# Workflow Skill
# J.A.R.V.I.S - SZG — Automation Engine Implementation

> Expert knowledge for implementing workflow engine, triggers, and scheduled automation.

---

## When to Read

Read this skill before implementing:
- `src/automation/engine.ts` — Workflow execution
- `src/automation/triggers/*.ts` — Trigger implementations

---

## Dependencies

```bash
# For cron parsing
bun add cronstrue
```

---

## Workflow Definition

```typescript
// src/automation/types.ts
interface Workflow {
  id: string;
  name: string;
  enabled: boolean;
  trigger: Trigger;
  steps: WorkflowStep[];
  schedule?: string; // cron expression
}

interface WorkflowStep {
  id: string;
  action: string;
  args: Record<string, unknown>;
  onError?: 'continue' | 'stop' | 'retry';
}

type Trigger = 
  | { type: 'cron'; expression: string }
  | { type: 'webhook'; path: string }
  | { type: 'file'; path: string; events: ('create' | 'modify' | 'delete')[] };
```

---

## Engine Implementation

```typescript
// src/automation/engine.ts
class WorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();
  private executing: Set<string> = new Set();
  
  register(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
  }
  
  async execute(workflowId: string, context: object = {}): Promise<void> {
    if (this.executing.has(workflowId)) {
      console.log(`Workflow ${workflowId} already running`);
      return;
    }
    
    const workflow = this.workflows.get(workflowId);
    if (!workflow || !workflow.enabled) return;
    
    this.executing.add(workflowId);
    
    try {
      for (const step of workflow.steps) {
        const result = await this.executeStep(step, context);
        
        if (result.error && step.onError === 'stop') {
          break;
        }
      }
    } finally {
      this.executing.delete(workflowId);
    }
  }
  
  private async executeStep(step: WorkflowStep, context: object): Promise<{ error?: string }> {
    try {
      // Execute action based on step.action
      console.log(`Executing step: ${step.action}`);
      return { error: undefined };
    } catch (e) {
      return { error: e.message };
    }
  }
  
  topologicalSort(workflows: Workflow[]): Workflow[] {
    // Sort by dependencies
    const graph = new Map<string, string[]>();
    
    for (const wf of workflows) {
      graph.set(wf.id, []);
    }
    
    // Build dependency graph
    // Return sorted list
    return workflows;
  }
}

export const engine = new WorkflowEngine();
```

---

## Cron Trigger

```typescript
// src/automation/triggers/cron.ts
import { CronJob } from 'cron';

class CronTrigger {
  private jobs: Map<string, CronJob> = new Map();
  
  start(workflow: Workflow): void {
    if (!workflow.schedule) return;
    
    const job = new CronJob(workflow.schedule, () => {
      engine.execute(workflow.id);
    });
    
    job.start();
    this.jobs.set(workflow.id, job);
  }
  
  stop(workflowId: string): void {
    const job = this.jobs.get(workflowId);
    job?.stop();
    this.jobs.delete(workflowId);
  }
}

export const cronTrigger = new CronTrigger();
```

---

## Webhook Trigger

```typescript
// src/automation/triggers/webhook.ts

export function createWebhookHandler(workflow: Workflow) {
  return async (req: Request): Promise<Response> => {
    const body = await req.json();
    
    // Execute workflow with webhook payload as context
    await engine.execute(workflow.id, { payload: body, source: 'webhook' });
    
    return Response.json({ status: 'triggered', workflow: workflow.id });
  };
}
```

---

## File Trigger

```typescript
// src/automation/triggers/file.ts
import { watch } from 'fs';

class FileTrigger {
  private watchers: Map<string, ReturnType<typeof watch>> = new Map();
  
  start(workflow: Workflow): void {
    const trigger = workflow.trigger as { type: 'file'; path: string; events: string[] };
    
    const watcher = watch(trigger.path, (eventType, filename) => {
      if (trigger.events.includes(eventType)) {
        engine.execute(workflow.id, { eventType, filename });
      }
    });
    
    this.watchers.set(workflow.id, watcher);
  }
  
  stop(workflowId: string): void {
    const watcher = this.watchers.get(workflowId);
    watcher?.close();
    this.watchers.delete(workflowId);
  }
}

export const fileTrigger = new FileTrigger();
```

---

## Execution History

```typescript
// Store in SQLite
this.db.exec(`
  CREATE TABLE IF NOT EXISTS workflow_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    error TEXT
  )
`);
```

---

## Error Policies

| Policy | Behavior |
|--------|----------|
| `stop` | Abort workflow |
| `continue` | Skip failed step |
| `retry` | Re-attempt 3 times |

---

## Related Skills

- `server.md` — For webhook HTTP endpoints
- `memory.md` — For storing execution history
