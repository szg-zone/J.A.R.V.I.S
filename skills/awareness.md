# Awareness Skill
# J.A.R.V.I.S - SZG — Screen Awareness Implementation

> Expert knowledge for implementing screen capture, OCR, struggle detection, and vision escalation.

---

## When to Read

Read this skill before implementing:
- `src/awareness/capture.ts` — Screenshot capture
- `src/awareness/ocr.ts` — Text extraction
- `src/awareness/struggle.ts` — Behavioral analysis

---

## Dependencies

```bash
bun add tesseract.js
```

---

## Screenshot Capture

```typescript
// src/awareness/capture.ts
import { exec } from 'child_process';

const INTERVAL_MS = parseInt(process.env.AWARENESS_INTERVAL_MS || '7000');

class ScreenCapture {
  private lastHash: string = '';
  private interval: Timer | null = null;
  
  async capture(): Promise<Buffer> {
    // PowerShell screenshot on Windows
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing
      $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
      $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
      $bitmap.Save("$env:TEMP\\screenshot.png", [System.Drawing.Imaging.ImageFormat]::Png)
      $graphics.Dispose()
      $bitmap.Dispose()
    `;
    
    return new Promise((resolve, reject) => {
      exec(`powershell -command "${script}"`, (err) => {
        if (err) reject(err);
        else resolve(require('fs').readFileSync('$env:TEMP\\screenshot.png'));
      });
    });
  }
  
  async captureIfChanged(): Promise<Buffer | null> {
    const buffer = await this.capture();
    const hash = await this.hashBuffer(buffer);
    
    if (hash === this.lastHash) {
      return null; // No change
    }
    
    this.lastHash = hash;
    return buffer;
  }
  
  private async hashBuffer(buffer: Buffer): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
  
  startLoop(): void {
    this.interval = setInterval(async () => {
      const frame = await this.captureIfChanged();
      if (frame) {
        // Process frame
      }
    }, INTERVAL_MS);
  }
}

export const capture = new ScreenCapture();
```

---

## OCR Implementation

```typescript
// src/awareness/ocr.ts
import Tesseract from 'tesseract.js';

interface OCRResult {
  text: string;
  hash: string;
  urls: string[];
}

export async function extractText(imageBuffer: Buffer): Promise<OCRResult> {
  const result = await Tesseract.recognize(imageBuffer, 'eng');
  
  const text = result.data.text;
  const urls = extractUrls(text);
  const hash = await hashText(text);
  
  return { text, hash, urls };
}

function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s]+/g;
  return text.match(urlRegex) || [];
}

async function hashText(text: string): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('md5').update(text).digest('hex');
}
```

---

## Struggle Detection

```typescript
// src/awareness/struggle.ts

interface Frame {
  timestamp: number;
  text: string;
  hash: string;
}

const GRACE_PERIOD_MS = 2 * 60 * 1000; // 2 minutes
const FRAME_WINDOW = 30;

class StruggleDetector {
  private frames: Frame[] = [];
  private signals = {
    repetition: 0,
    error: 0,
    idle: 0,
    frustration: 0
  };
  
  async analyze(frame: Frame): Promise<boolean> {
    this.frames.push(frame);
    
    // Keep only last 30 frames
    if (this.frames.length > FRAME_WINDOW) {
      this.frames.shift();
    }
    
    // Check grace period
    const recent = this.frames.filter(
      f => Date.now() - f.timestamp < GRACE_PERIOD_MS
    );
    
    if (recent.length < 5) return false;
    
    // Calculate signals
    this.calculateSignals(recent);
    
    // Struggle detected if any signal is high
    const threshold = 0.7;
    return Object.values(this.signals).some(s => s > threshold);
  }
  
  private calculateSignals(frames: Frame[]): void {
    // Repetition: same text appearing
    const hashes = frames.map(f => f.hash);
    const unique = new Set(hashes);
    this.signals.repetition = 1 - (unique.size / hashes.length);
    
    // Error: error keywords in text
    const errorWords = ['error', 'failed', 'exception', 'crash'];
    const hasError = frames.some(f => 
      errorWords.some(w => f.text.toLowerCase().includes(w))
    );
    this.signals.error = hasError ? 1 : 0;
    
    // Idle: very little text change
    this.signals.idle = this.signals.repetition > 0.8 ? 1 : 0;
    
    // Frustration: question marks, caps
    this.signals.frustration = frames.some(f => 
      f.text.includes('???') || f.text !== f.text.toLowerCase()
    ) ? 1 : 0;
  }
  
  getSignals(): Record<string, number> {
    return { ...this.signals };
  }
}

export const struggleDetector = new StruggleDetector();
```

---

## Vision Escalation

When struggle is detected, escalate to vision LLM:

```typescript
async function escalateToVision(screenshot: Buffer): Promise<string> {
  // Send screenshot + context to LLM with vision
  const response = await fetch('/api/vision', {
    method: 'POST',
    body: JSON.stringify({
      image: screenshot.toString('base64'),
      context: 'User appears to be struggling. What should I suggest?'
    })
  });
  
  return response.text;
}
```

---

## Related Skills

- `browser.md` — For browser-based screenshots
- `agent.md` — For proactive assistance
