import { tts } from 'edge-tts';

const VOICE = process.env.TTS_VOICE || 'en-US-AriaNeural';
const SPEED = process.env.TTS_SPEED || '+0%';

function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+/g) || [text];
}

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

export async function synthesize(text: string): Promise<Buffer[]> {
  const chunks = chunkText(text);
  const audioBuffers: Buffer[] = [];

  for (const chunk of chunks) {
    const audio = await tts(chunk.trim(), {
      voice: VOICE,
      rate: SPEED
    });
    audioBuffers.push(audio);
  }

  return audioBuffers;
}

export function combineAudioBuffers(buffers: Buffer[]): Buffer {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
  const combined = Buffer.alloc(totalLength);
  let offset = 0;

  for (const buf of buffers) {
    buf.copy(combined, offset);
    offset += buf.length;
  }

  return combined;
}
