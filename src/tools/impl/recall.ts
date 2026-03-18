import { vault } from '../../memory/vault.ts';

export const recall = {
  name: 'recall',
  description: 'Search and retrieve information from long-term memory. Use this when the user asks about something they previously told JARVIS.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to find relevant memories'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 5)',
        default: 5
      }
    },
    required: ['query']
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    const query = args.query as string;
    const limit = (args.limit as number) || 5;

    if (!query) {
      return JSON.stringify({ error: 'Missing query parameter' });
    }

    try {
      const memories = vault.search(query, limit);
      
      if (memories.length === 0) {
        return JSON.stringify({ 
          success: true, 
          message: 'No memories found matching query',
          memories: []
        });
      }

      const results = memories.map(m => ({
        type: m.type,
        content: m.content,
        tags: m.tags,
        confidence: m.confidence
      }));

      return JSON.stringify({ 
        success: true, 
        memories: results
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      return JSON.stringify({ error: errorMessage });
    }
  }
};
