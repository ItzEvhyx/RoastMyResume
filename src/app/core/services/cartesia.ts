/**
 * Cartesia text-to-speech for Denise’s spoken replies.
 */

export type DeniseSpeakMode = 'roast' | 'help';

export type CartesiaEmotion =
  | 'neutral'
  | 'curious'
  | 'calm'
  | 'sympathetic'
  | 'sarcastic'
  | 'ironic'
  | 'frustrated'
  | 'confident'
  | 'skeptical'
  | 'contemplative'
  | 'determined'
  | 'proud'
  | 'enthusiastic';

export type GenerationConfig = {
  volume?: number;
  speed?: number;
  emotion?: CartesiaEmotion;
};

export const DENISE_TTS_SAMPLE_RATE = 44100;

/** Mode-based delivery — slower, with room for pauses and contour. */
export function personalityForMode(
  mode: DeniseSpeakMode,
  phase?: 'interview' | 'fixes' | null,
): GenerationConfig {
  if (mode === 'roast') {
    return {
      emotion: 'sarcastic',
      speed: 0.78,
      volume: 1.05,
    };
  }
  if (phase === 'interview') {
    return {
      emotion: 'curious',
      speed: 0.75,
      volume: 1,
    };
  }
  if (phase === 'fixes') {
    return {
      emotion: 'determined',
      speed: 0.76,
      volume: 1,
    };
  }
  return {
    emotion: 'confident',
    speed: 0.76,
    volume: 1,
  };
}

/** Strip markdown / chrome so Cartesia reads natural speech. */
export function textForSpeech(raw: string): string {
  return raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[*_~|>]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2500);
}

const MAX_SPOKEN_BULLETS = 3;

const ROAST_DISMISSALS = [
  "Oh, don't even let me read the rest.",
  "Yeah — I'm stopping here. The rest is the same crime scene.",
  "And I haven't even gotten to the rest. Don't make me.",
  "You get the idea. I'm not reading the whole list out loud.",
  "That's enough. The rest is more of the same — look at your screen.",
];

const HELP_DISMISSALS = [
  "I'll spare you hearing the rest — it's all in the notes.",
  "Same pattern down the list. Read the rest on your screen.",
  "I won't narrate every line — the remaining notes are right there for you.",
];

function pickDismissal(mode: DeniseSpeakMode, seed: string): string {
  const list = mode === 'roast' ? ROAST_DISMISSALS : HELP_DISMISSALS;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i) * (i + 1)) % 997;
  return list[hash % list.length] ?? list[0]!;
}

function countMarkdownBullets(raw: string): number {
  return raw.split('\n').filter((line) => /^\s*[-*+]\s+/.test(line)).length;
}

/**
 * Cap spoken script after 3 bullets and append a short “I’m done reading”
 * closer — full chat text still shows; this only limits Cartesia characters.
 */
export function buildSpeechScript(
  rawMarkdown: string,
  mode: DeniseSpeakMode,
): { text: string; capped: boolean } {
  const totalBullets = countMarkdownBullets(rawMarkdown);
  if (totalBullets <= MAX_SPOKEN_BULLETS) {
    return { text: textForSpeech(rawMarkdown), capped: false };
  }

  const kept: string[] = [];
  let bulletsKept = 0;
  let enteredList = false;

  for (const line of rawMarkdown.split('\n')) {
    if (/^\s*[-*+]\s+/.test(line)) {
      enteredList = true;
      if (bulletsKept >= MAX_SPOKEN_BULLETS) continue;
      bulletsKept += 1;
      kept.push(line);
      continue;
    }
    // Keep opener / prose before the bullet list only
    if (!enteredList) kept.push(line);
  }

  const body = textForSpeech(kept.join('\n'));
  const closer = pickDismissal(mode, rawMarkdown.slice(0, 80));
  const text = [body, closer].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  return { text, capped: true };
}

/**
 * Pull complete speakable sentences from growing transcript text.
 * Leaves an unfinished trailing clause in `rest`.
 */
export function pullCompleteSpeechChunks(
  speechText: string,
  alreadySpokenChars: number,
): { chunks: string[]; nextOffset: number } {
  if (speechText.length <= alreadySpokenChars) {
    return { chunks: [], nextOffset: alreadySpokenChars };
  }

  const pending = speechText.slice(alreadySpokenChars);
  const chunks: string[] = [];
  let cursor = 0;
  const boundary = /[.!?…]["')\]]*(?:\s+|$)/g;
  let match: RegExpExecArray | null;
  while ((match = boundary.exec(pending)) !== null) {
    const end = match.index + match[0].length;
    const piece = pending.slice(cursor, end).trim();
    if (piece.length >= 8) {
      chunks.push(piece);
      cursor = end;
    }
  }

  // Also flush long clauses on semicolon / em dash / newline-ish gaps
  if (!chunks.length && pending.length > 140) {
    const soft = pending.search(/[,;—–:]\s+/);
    if (soft > 40) {
      const end = soft + 1;
      const piece = pending.slice(0, end).trim();
      if (piece) {
        chunks.push(piece);
        cursor = end;
      }
    }
  }

  return {
    chunks,
    nextOffset: alreadySpokenChars + cursor,
  };
}

export function flushRemainingSpeech(
  speechText: string,
  alreadySpokenChars: number,
): string | null {
  const rest = speechText.slice(alreadySpokenChars).trim();
  return rest.length >= 2 ? rest : null;
}

async function cartesiaBytes(options: {
  transcript: string;
  generation_config: GenerationConfig;
  output_format: Record<string, unknown>;
}): Promise<ArrayBuffer> {
  const apiKey = process.env.CARTESIA_API_KEY;
  const voiceId = process.env.CARTESIA_VOICE_ID;
  if (!apiKey) throw new Error('CARTESIA_API_KEY is not set.');
  if (!voiceId) throw new Error('CARTESIA_VOICE_ID is not set.');

  const res = await fetch('https://api.cartesia.ai/tts/bytes', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Cartesia-Version': '2025-04-16',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model_id: 'sonic-2',
      transcript: options.transcript,
      voice: {
        mode: 'id',
        id: voiceId,
      },
      language: 'en',
      output_format: options.output_format,
      generation_config: options.generation_config,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(
      `Cartesia TTS failed (${res.status})${detail ? `: ${detail.slice(0, 280)}` : ''}`,
    );
  }

  return res.arrayBuffer();
}

export async function synthesizeSpeech(options: {
  transcript: string;
  mode: DeniseSpeakMode;
  phase?: 'interview' | 'fixes' | null;
  emotionOverride?: CartesiaEmotion;
}): Promise<{ audio: ArrayBuffer; contentType: string }> {
  const transcript = buildSpeechScript(options.transcript, options.mode).text;
  if (!transcript) throw new Error('Nothing to speak.');

  const generation_config: GenerationConfig = {
    ...personalityForMode(options.mode, options.phase),
    ...(options.emotionOverride ? { emotion: options.emotionOverride } : {}),
  };

  const audio = await cartesiaBytes({
    transcript,
    generation_config,
    output_format: {
      container: 'mp3',
      bit_rate: 128000,
      sample_rate: DENISE_TTS_SAMPLE_RATE,
    },
  });

  return { audio, contentType: 'audio/mpeg' };
}

/** Low-latency PCM for streaming playback (sentence chunks). */
export async function synthesizeSpeechPcm(options: {
  transcript: string;
  mode: DeniseSpeakMode;
  phase?: 'interview' | 'fixes' | null;
}): Promise<{ pcm: ArrayBuffer; sampleRate: number }> {
  // Chunks are already speech-ready (pre-capped by the stream route).
  const transcript = textForSpeech(options.transcript);
  if (!transcript) throw new Error('Nothing to speak.');

  const pcm = await cartesiaBytes({
    transcript,
    generation_config: personalityForMode(options.mode, options.phase),
    output_format: {
      container: 'raw',
      encoding: 'pcm_s16le',
      sample_rate: DENISE_TTS_SAMPLE_RATE,
    },
  });

  return { pcm, sampleRate: DENISE_TTS_SAMPLE_RATE };
}
