import { vault } from '../../memory/vault.ts';

export const remember = {
  name: 'remember',
  description: 'Store important information in long-term memory. Use this to remember facts, preferences, events, or anything the user wants JARVIS to remember.',
  parameters: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'The information to remember'
      },
      type: {
        type: 'string',
        description: 'Type of memory: fact, preference, event, person, project, commitment, or note',
        enum: ['fact', 'preference', 'event', 'person', 'project', 'commitment', 'note']
      },
      tags: {
        type: 'string',
        description: 'Optional tags for organization (comma-separated)'
      }
    },
    required: ['content']
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    const content = args.content as string;
    const type = (args.type as string) || 'note';
    const tags = (args.tags as string) || '';

    if (!content) {
      return JSON.stringify({ error: 'Missing content parameter' });
    }

    try {
      const id = vault.store(type, content, tags);
      return JSON.stringify({ 
        success: true, 
        message: 'Memory stored successfully',
        id
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      return JSON.stringify({ error: errorMessage });
    }
  }
};
