export const webSearch = {
  name: 'web_search',
  description: 'Search the web for current information. Use this when you need up-to-date information, facts, news, or answers to questions.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query'
      }
    },
    required: ['query']
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    const query = args.query as string;
    if (!query) {
      return JSON.stringify({ error: 'Missing query parameter' });
    }

    try {
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
      );
      const data = await response.json();
      
      if (data.AbstractText) {
        return JSON.stringify({ 
          success: true, 
          answer: data.AbstractText,
          source: data.AbstractSource
        });
      }
      
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        const results = data.RelatedTopics.slice(0, 5).map((topic: { Text: string; FirstURL: string }) => ({
          text: topic.Text,
          url: topic.FirstURL
        }));
        return JSON.stringify({ success: true, results });
      }

      return JSON.stringify({ success: true, message: 'No results found' });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      return JSON.stringify({ error: errorMessage });
    }
  }
};
