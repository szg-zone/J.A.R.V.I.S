# Browser Skill
# J.A.R.V.I.S - SZG — Playwright Browser Controller

> Expert knowledge for implementing Playwright browser automation, CDP, and browser tools.

---

## When to Read

Read this skill before implementing:
- `src/browser/controller.ts` — Playwright controller
- Browser automation tools
- Screenshot and element interaction

---

## Setup

```bash
bun add playwright
bunx playwright install chromium
```

---

## Implementation

```typescript
// src/browser/controller.ts
import { chromium, Browser, Page } from 'playwright';

class BrowserController {
  private browser: Browser | null = null;
  private page: Page | null = null;
  
  async launch(): Promise<void> {
    // Detect Chrome on Windows
    const chromePath = process.env.JARVIS_BROWSER_PATH || 
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    
    this.browser = await chromium.launch({
      executablePath: chromePath,
      headless: false,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
      ]
    });
    
    // Create stealth context
    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    this.page = await context.newPage();
  }
  
  async navigate(url: string): Promise<string> {
    await this.page!.goto(url, { waitUntil: 'networkidle' });
    return this.page!.url();
  }
  
  async snapshot(): Promise<string> {
    return await this.page!.content();
  }
  
  async click(selector: string): Promise<void> {
    await this.page!.click(selector);
  }
  
  async type(selector: string, text: string): Promise<void> {
    await this.page!.fill(selector, text);
  }
  
  async extract(selector: string): Promise<string> {
    return await this.page!.textContent(selector) || '';
  }
  
  async screenshot(): Promise<Buffer> {
    return await this.page!.screenshot();
  }
  
  async close(): Promise<void> {
    await this.browser?.close();
  }
}

export const browser = new BrowserController();
```

---

## Tool Definitions

```typescript
export const browserTools = [
  {
    name: 'browser_navigate',
    description: 'Navigate to a URL in the browser',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The URL to navigate to' }
      },
      required: ['url']
    }
  },
  {
    name: 'browser_snapshot',
    description: 'Get the current page HTML content',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'browser_click',
    description: 'Click an element by CSS selector',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector' }
      },
      required: ['selector']
    }
  },
  {
    name: 'browser_type',
    description: 'Type text into an input field',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string' },
        text: { type: 'string' }
      },
      required: ['selector', 'text']
    }
  },
  {
    name: 'browser_extract',
    description: 'Extract text from an element',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string' }
      },
      required: ['selector']
    }
  },
  {
    name: 'browser_screenshot',
    description: 'Take a screenshot of the current page',
    parameters: { type: 'object', properties: {} }
  }
];
```

---

## Stealth Mode

- Disable automation flags
- Randomize viewport
- Use real user agent
- Disable webdriver property

---

## Element Selection Strategy

1. **Prefer semantic selectors**: `button[type="submit"]`
2. **Use data-testid**: `data-testid="login-btn"`
3. **Fallback to text**: `text=Submit`
4. **Last resort**: XPath with contains()

---

## Error Handling

```typescript
async function safeNavigate(url: string): Promise<string> {
  try {
    await page.goto(url, { timeout: 30000 });
    return `Navigated to ${url}`;
  } catch (e) {
    return `Navigation failed: ${e.message}`;
  }
}
```

---

## Windows Chrome Detection

```typescript
function findChromePath(): string | null {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
  ];
  
  for (const p of paths) {
    if (existsSync(p)) return p;
  }
  return null;
}
```

---

## Related Skills

- `tools.md` — For registering browser tools
- `awareness.md` — For screenshot-based screen awareness
