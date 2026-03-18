# Voice Skill
# J.A.R.V.I.S - SZG — Voice Implementation (TTS/STT/Wake Word)

> Expert knowledge for implementing TTS, STT, wake word detection, and voice state machine.

---

## When to Read

Read this skill before implementing:
- `src/voice/tts.ts` — Text-to-speech
- `src/voice/stt.ts` — Speech-to-text
- Wake word detection

---

## Dependencies

```bash
bun add edge-tts
# For STT - use Groq Whisper API (free tier)
```

---

## TTS Implementation

```typescript
// src/voice/tts.ts
import edgeTTS from 'edge-tts';

const VOICE = process.env.TTS_VOICE || 'en-US-AriaNeural';
const SPEED = process.env.TTS_SPEED || '1.0';

export async function* synthesize(
  text: string
): AsyncGenerator<Buffer> {
  // Split into sentences for natural breaks
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  for (const sentence of sentences) {
    const track = new edgeTTS.Communicate(sentence.trim(), VOICE, {
      proxy: undefined,
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
    });
    
    track.setProsody({ rate: SPEED });
    
    let chunk: Buffer;
    while ((chunk = await track.read()) && chunk.length > 0) {
      yield chunk;
    }
  }
}

// Server sends chunks as binary WebSocket frames
// ws.send(chunk); // binary
```

---

## STT Implementation

```typescript
// src/voice/stt.ts

export async function transcribe(audioBuffer: Buffer): Promise<string> {
  const formData = new FormData();
  formData.append('file', new Blob([audioBuffer]), 'audio.webm');
  formData.append('model', 'whisper-large-v3');
  
  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: formData
  });
  
  const result = await response.json();
  return result.text;
}
```

---

## Wake Word Detection

```typescript
// src/voice/wake.ts
// Use openwakeword WASM in Web Worker

const WAKE_WORDS = ['hey jarvis', 'jarvis'];

class WakeWordDetector {
  private audioContext: AudioContext | null = null;
  private model: any = null;
  
  async initialize(): Promise<void> {
    // Load openwakeword WASM model
    // this.model = await loadModel();
  }
  
  async detect(audioChunk: Float32Array): Promise<boolean> {
    // Process audio through model
    // Return true if wake word detected
    return false;
  }
}
```

---

## Voice State Machine

```
States: idle → listening → processing → responding → idle

Events:
- wake_word_detected → listening
- push_to_talk_start → listening  
- push_to_talk_end → processing
- transcription_complete → processing
- response_started → responding
- response_complete → idle
```

---

## Audio Chunking

```typescript
// Web Audio API for microphone
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const audioContext = new AudioContext();
const source = audioContext.createMediaStreamSource(stream);
const processor = audioContext.createScriptProcessor(4096, 1, 1);

processor.onaudioprocess = (e) => {
  const chunk = e.inputBuffer.getChannelData(0);
  // Send to wake word detector or STT
};
```

---

## Sentence Splitting for TTS

```typescript
function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+/g) || [text];
}

// For long texts, chunk further
function chunkText(text: string, maxLength: number = 500): string[] {
  const sentences = splitSentences(text);
  const chunks: string[] = [];
  let current = '';
  
  for (const sentence of sentences) {
    if ((current + sentence).length > maxLength) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  
  if (current) chunks.push(current.trim());
  return chunks;
}
```

---

## WebSocket Binary Frames

```typescript
// Server → Client (TTS)
ws.send(audioBuffer); // Binary frame

// Client → Server (STT)
ws.send(audioBuffer); // Binary frame
```

---

## Related Skills

- `server.md` — For WebSocket binary handling
- `browser.md` — For voice-enabled browser interaction
