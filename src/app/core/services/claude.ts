// src/app/core/services/claude.ts
import Anthropic from '@anthropic-ai/sdk';

/**
 * Claude service for RoastMyResume.
 *
 * Initializes a Claude Haiku 4.5 companion that reviews resume snippets,
 * pinpoints fluff / vague phrasing, and responds in one of two modes:
 *   - "roast":     chews you out for the fluff, insults included.
 *   - "real-talk": blunt, honest, actionable advice, no insults, no sugarcoating.
 *
 * The companion is scope-guarded to career-adjacent topics only
 * (resume, hiring, HR, business, job applications, interviews, etc.).
 */

export const CLAUDE_MODEL = 'claude-haiku-4-5';

export type ReviewMode = 'roast' | 'real-talk';

/** Sentinel the model emits when a request falls outside the allowed scope. */
export const OUT_OF_SCOPE_SIGNAL = 'OUT_OF_SCOPE';

/** Message shown to the user when the input is out of scope. */
export const OUT_OF_SCOPE_MESSAGE =
  'Sorry, but I can not respond to that kind of topic';

/** Supported image media types for screenshot input. */
export type ImageMediaType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp';

export interface ReviewImage {
  /** Base64-encoded image data (no data: URI prefix). */
  data: string;
  mediaType: ImageMediaType;
}

export interface ReviewRequest {
  mode: ReviewMode;
  /** Pasted resume text. Optional when an image is supplied. */
  text?: string;
  /** Optional resume screenshot(s). */
  images?: ReviewImage[];
}

export interface ReviewResult {
  outOfScope: boolean;
  /** The model's review text, or the out-of-scope message. */
  content: string;
}

let client: Anthropic | null = null;

/** Lazily create a single Anthropic client. Reads ANTHROPIC_API_KEY from env. */
function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set. Add it to .env.local before using the Claude service.'
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

/** Per-mode character budgets, surfaced in the prompt to keep responses (and token spend) tight. */
export const MODE_CHAR_LIMITS: Record<ReviewMode, { min: number; max: number }> =
  {
    roast: { min: 350, max: 450 },
    'real-talk': { min: 600, max: 700 },
  };

/** Per-mode max_tokens. Sized to comfortably fit the char budget (~1 token ≈ 4 chars) plus markdown overhead. */
const MODE_MAX_TOKENS: Record<ReviewMode, number> = {
  roast: 220,
  'real-talk': 320,
};

/** Rules shared across both modes: scope + what "fluff" means + output shape. */
const SHARED_RULES = `You are the RoastMyResume companion. Your job is to review a snippet of someone's resume, pinpoint the fluff, vague filler, and empty buzzwords, and call it out.

"Fluff" means vague, unquantified, generic, or cliche phrasing that says little: things like "responsible for", "team player", "hard worker", "results-driven", "synergy", "helped with", duties with no measurable impact, and passive filler.

SCOPE — VERY IMPORTANT:
You ONLY handle career-adjacent topics: resumes, CVs, cover letters, job applications, interviews, hiring, HR, recruiting, professional experience, and business/workplace topics relevant to applying for a position.
If the user's input is NOT one of these topics (e.g. it asks about cooking, coding help, math, general trivia, or anything unrelated to job seeking / resumes / business / HR), you MUST respond with EXACTLY this token and nothing else:
${OUT_OF_SCOPE_SIGNAL}

When the input IS in scope:
- Extract the specific fluffy / vague phrases from what they gave you and highlight each offending phrase by wrapping it in **double asterisks**.
- Then deliver your take according to your current mode.
- Use markdown for structure: short paragraphs, bullet points where it helps.
- No preamble like "Sure!" or "Here's my review". Jump straight in.

VARIETY — CRITICAL:
Every response must feel freshly written. NEVER reuse the same opening line, structure, or stock phrases between reviews. In particular, do NOT open with "Oh man", "Oh wow", "This is a masterclass", "Let's break down", or any recycled hook. Surprise the reader with a different angle each time — a metaphor, a rhetorical question, a mock-quote, a cold hard verdict. Assume the reader has seen your other reviews and would notice repetition.`;

const ROAST_PERSONA = `MODE: ROAST.
Channel Gordon Ramsay tearing apart a sloppy dish — explosive, theatrical, brutally funny, and specific. Use vivid culinary/kitchen-style metaphors and cutting one-liners aimed squarely at the WRITING (never the person or protected characteristics). Be creative and unpredictable: no two roasts should sound alike. Quote and highlight the exact fluff, then torch it. Make them laugh and wince. You do NOT need to hand them a polished fix — this is the roast, not the rescue.

LENGTH: Keep the entire response between ${MODE_CHAR_LIMITS.roast.min} and ${MODE_CHAR_LIMITS.roast.max} characters. Make every word earn its place — punchy over padded.`;

const REAL_TALK_PERSONA = `MODE: REAL TALK.
No insults, no jokes, no sugarcoating. Be direct, honest, and genuinely useful. Point out exactly which parts are fluff and WHY they're weak, then give concrete, actionable rewrites: add metrics, strong action verbs, real impact. Vary your framing each time so advice never feels templated.

LENGTH: Keep the entire response between ${MODE_CHAR_LIMITS['real-talk'].min} and ${MODE_CHAR_LIMITS['real-talk'].max} characters. Be economical — prioritize the highest-impact fixes.`;

function buildSystemPrompt(mode: ReviewMode): string {
  const persona = mode === 'roast' ? ROAST_PERSONA : REAL_TALK_PERSONA;
  return `${SHARED_RULES}\n\n${persona}`;
}

/**
 * Run a resume review through Claude Haiku 4.5.
 * Returns either the review content or an out-of-scope result.
 */
export async function reviewResume(
  request: ReviewRequest
): Promise<ReviewResult> {
  const { mode, text, images } = request;

  const hasText = Boolean(text && text.trim().length > 0);
  const hasImages = Boolean(images && images.length > 0);
  if (!hasText && !hasImages) {
    throw new Error('reviewResume requires text or at least one image.');
  }

  const content: Anthropic.ContentBlockParam[] = [];

  if (hasImages) {
    for (const image of images!) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: image.mediaType,
          data: image.data,
        },
      });
    }
  }

  content.push({
    type: 'text',
    text: hasText
      ? `Here is a section from my resume. Review it:\n\n${text!.trim()}`
      : 'Here is a screenshot of a section from my resume. Review it.',
  });

  const response = await getClient().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MODE_MAX_TOKENS[mode],
    // Higher temperature = more varied, less repetitive phrasing across reviews.
    temperature: 1,
    system: buildSystemPrompt(mode),
    messages: [{ role: 'user', content }],
  });

  const responseText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  if (responseText === OUT_OF_SCOPE_SIGNAL) {
    return { outOfScope: true, content: OUT_OF_SCOPE_MESSAGE };
  }

  return { outOfScope: false, content: responseText };
}
