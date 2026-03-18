export const datetime = {
  name: 'datetime',
  description: 'Get the current date and time. Use this when the user asks for the current time, date, or both.',
  parameters: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        description: 'Format type: full, date, time, or relative',
        enum: ['full', 'date', 'time', 'relative']
      },
      timezone: {
        type: 'string',
        description: 'Optional timezone (e.g., "America/New_York", "Asia/Tokyo")'
      }
    }
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    const format = (args.format as string) || 'full';
    const timezone = args.timezone as string | undefined;

    try {
      const now = new Date();
      
      let formatted: string;
      
      if (timezone) {
        const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        
        if (format === 'date') {
          formatted = tzDate.toLocaleDateString('en-US', { 
            timeZone: timezone,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } else if (format === 'time') {
          formatted = tzDate.toLocaleTimeString('en-US', { 
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        } else if (format === 'relative') {
          formatted = getRelativeTime(now);
        } else {
          formatted = tzDate.toLocaleString('en-US', { 
            timeZone: timezone,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        }
      } else {
        if (format === 'date') {
          formatted = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } else if (format === 'time') {
          formatted = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        } else if (format === 'relative') {
          formatted = getRelativeTime(now);
        } else {
          formatted = now.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        }
      }

      return JSON.stringify({
        success: true,
        datetime: formatted,
        timestamp: now.getTime(),
        iso: now.toISOString()
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      return JSON.stringify({ error: errorMessage });
    }
  }
};

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US');
}
