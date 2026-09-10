// src/app/core/services/claude.ts
import Anthropic from '@anthropic-ai/sdk';
import { normalizeDeniseMarkdown } from '@/app/features/canvas_page/utils/denise.markdown';

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

// ─── Denise (Ask Denise) ──────────────────────────────────────────────────────

/**
 * Denise is the conversational AI companion in the assist panel.
 * She has full visibility of the resume canvas and can hold multi-turn
 * conversations about it. She shares the same scope-guard as reviewResume
 * but uses her own persona and prompt structure.
 *
 * This is intentionally separate from `reviewResume` so both features
 * can evolve independently.
 */

export type DeniseMode = 'roast' | 'help';

export type DeniseSeverity = 'weak' | 'vague' | 'improve';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DeniseRequest {
  mode: DeniseMode;
  /** Serialized canvas snapshot (from canvas.snapshot.ts). */
  canvasSnapshot: string;
  /** The full conversation history including the latest user message. */
  messages: ConversationMessage[];
  /**
   * Text Denise already rewrote (id → suggested content). Still-matching
   * canvas text must not be highlighted or rewritten again.
   */
  approvedElements?: Record<string, string>;
}

export interface DeniseHighlight {
  elementId: string;
  quote: string;
  severity: DeniseSeverity;
}

export interface DeniseFix {
  elementId: string;
  suggestedContent: string;
}

/** Help-me flow: ask for details first, then deliver concrete rewrites. */
export type DenisePhase = 'interview' | 'fixes';

export interface DeniseResult {
  outOfScope: boolean;
  content: string;
  highlights: DeniseHighlight[];
  fixes: DeniseFix[];
  /**
   * Help mode: `interview` = clarifying questions only (no Apply).
   * `fixes` = concrete rewrites ready to apply.
   * Roast always uses `fixes` (highlights only on the client).
   */
  phase: DenisePhase;
}

/** Soft guidance for reply length — coverage of every highlight beats brevity. */
const DENISE_CHAR_LIMITS: Record<DeniseMode, { min: number; max: number }> = {
  roast: { min: 600, max: 3200 },
  help:  { min: 700, max: 3600 },
};

/**
 * Hard token caps for the model call (tool JSON + markdown).
 * Needs headroom for MANY highlights, full chat callouts, and long rewrites.
 */
const DENISE_MAX_TOKENS: Record<DeniseMode, number> = {
  roast: 4500,
  help:  5500,
};

const DENISE_TOOL_NAME = 'submit_denise_review';

const DENISE_REVIEW_TOOL: Anthropic.Tool = {
  name: DENISE_TOOL_NAME,
  description:
    'Submit Denise’s resume review: a markdown chat reply plus canvas highlights and (when ready) concrete suggested rewrites.',
  input_schema: {
    type: 'object',
    properties: {
      outOfScope: {
        type: 'boolean',
        description:
          'True only when the user message is not career/resume related.',
      },
      phase: {
        type: 'string',
        enum: ['interview', 'fixes'],
        description:
          'HELP mode: use "interview" while gathering missing metrics/details (fixes MUST be empty). Ask EXACTLY ONE question per turn. Use "fixes" only after enough answers to write concrete bullets — never bracket placeholders. ROAST mode: always "fixes".',
      },
      content: {
        type: 'string',
        description:
          'Markdown chat reply. HELP interview: EXACTLY ONE clarifying question about ONE weak quote (short opener optional). Never a list of multiple questions. HELP fixes / ROAST: list weak quotes in **bold** as specified. No JSON. If outOfScope, use the fixed out-of-scope sentence.',
      },
      interviewFocus: {
        type: 'object',
        description:
          'Required when phase is "interview" (help mode). The single weak point you are asking about THIS turn.',
        properties: {
          elementId: {
            type: 'string',
            description: 'Canvas text element id for the quote you are probing',
          },
          quote: {
            type: 'string',
            description: 'Exact weak substring from that element',
          },
          question: {
            type: 'string',
            description: 'The single clarifying question for the user',
          },
        },
        required: ['elementId', 'quote', 'question'],
      },
      highlights: {
        type: 'array',
        description:
          'EVERY weak / vague / improvable phrase on the canvas. Multiple entries per elementId are required when one text box has several bad bullets. Empty only when outOfScope or nothing is weak.',
        items: {
          type: 'object',
          properties: {
            elementId: {
              type: 'string',
              description: 'Exact text element id from the canvas snapshot (id:…)',
            },
            quote: {
              type: 'string',
              description:
                'Exact contiguous substring copied from that element’s content — ideally one full weak bullet or phrase',
            },
            severity: {
              type: 'string',
              enum: ['weak', 'vague', 'improve'],
              description:
                'weak=critically bad, vague=unquantified, improve=okay but sharper',
            },
          },
          required: ['elementId', 'quote', 'severity'],
        },
      },
      fixes: {
        type: 'array',
        description:
          'Full rewritten content for each weak top-level text element. EMPTY during interview phase. When phase is fixes: rewrite ALL weak bullets with REAL specifics from the user — NEVER [placeholders], <angle brackets>, or X%/TBD.',
        items: {
          type: 'object',
          properties: {
            elementId: { type: 'string' },
            suggestedContent: {
              type: 'string',
              description:
                'Full replacement for that element’s entire content — every bullet rewritten with concrete facts only',
            },
          },
          required: ['elementId', 'suggestedContent'],
        },
      },
    },
    required: ['outOfScope', 'phase', 'content', 'highlights', 'fixes'],
  },
};

const DENISE_SHARED_RULES = `You are Denise, the RoastMyResume AI Human Resources companion. You are an expert HR recruiter with 15+ years of experience reviewing resumes across all industries.

You are looking at a user's resume canvas. The full contents of every element on their canvas (text, dividers, icons, shapes, pen drawings, grouped elements) is provided below as structured context. Each text line includes an \`id:\` you MUST use when citing elements.

"Fluff" means vague, unquantified, generic, or cliche phrasing that says little: things like "responsible for", "team player", "hard worker", "results-driven", "synergy", "helped with", duties with no measurable impact, and passive filler.

VOICE / DELIVERY (your \`content\` is spoken aloud by Denise’s voice):
- Write for the ear, not a wall of text. Prefer short sentences and clear line breaks.
- Use commas, em dashes, and occasional ellipses (…) so the voice can pause and breathe.
- Vary rhythm: a sharp jab, a beat, then the punchline — especially in roast mode. Avoid rushing through long run-ons.
- Do not stack dense lists into one breathless paragraph; each bullet should be speakable on its own.

SCOPE — VERY IMPORTANT:
You ONLY handle career-adjacent topics: resumes, CVs, cover letters, job applications, interviews, hiring, HR, recruiting, professional experience, and business/workplace topics relevant to applying for a position.
If the user's message is NOT one of these topics, call ${DENISE_TOOL_NAME} with outOfScope=true, content exactly "${OUT_OF_SCOPE_MESSAGE}", and empty highlights/fixes arrays.

When the input IS in scope, you MUST call the ${DENISE_TOOL_NAME} tool (never reply with raw JSON in the assistant text).

Rules for tool fields:
- \`phase\` — ROAST: always \`"fixes"\`. HELP: \`"interview"\` until you have enough real details from the user to rewrite without guessing; then \`"fixes"\`.
- \`content\` — MUST use PROPER MARKDOWN:
  1. Short opener paragraph (can use *italics* for tone).
  2. Then a blank line.
  3. Then mode-specific body (see below). NEVER put multiple bullets on one line. NEVER use the \`•\` character as a separator mid-paragraph.
  4. ROAST / HELP-fixes: a markdown bullet list where EACH weak point is on its OWN LINE starting with \`- \` (hyphen + space). Each bullet: \`- **exact quote** — your roast/tip\`. Coverage: every \`highlights\` quote must appear as its own \`- **quote**\` line.
  5. HELP-interview — ONE-AT-A-TIME Q&A (CRITICAL):
     - Ask about EXACTLY ONE weak quote this turn. Wait for the user's reply before asking about the next.
     - Do NOT dump a list of questions. Do NOT use multiple \`- \` bullets that each ask something. One question only.
     - Shape: optional 1-sentence opener, then the weak quote in **bold**, then ONE clear question (metrics, tools, what they built, outcomes).
     - Also fill \`interviewFocus\` with that same elementId / quote / question.
     - Read the conversation history: skip weak points the user already answered; pick the next unanswered highlight (worst / vaguest first).
     - After they answer, briefly acknowledge (one short line is fine), then ask the next single question — still \`phase: "interview"\`, \`fixes: []\`.
     - Only when you have enough real detail across the weak spots to rewrite without inventing numbers: switch to \`phase: "fixes"\`.
  Example roast/fixes shape:
  \`\`\`
  Not even close.

  - **Responsible for helping** — zero ownership.
  - **worked hard to ensure** — vibes aren't metrics.
  \`\`\`
  Example HELP-interview shape (ONE question only):
  \`\`\`
  Let's make this bullet real — starting with the vaguest one.

  **Responsible for helping the development team with various tasks** — What were the main 2–3 things you actually worked on (feature, API, bug fix, migration, tests…)?
  \`\`\`
- \`highlights\` — COMPREHENSIVE COVERAGE IS MANDATORY: Read the ENTIRE canvas snapshot end-to-end. Add a highlight for EVERY weak / vague / fluff bullet or phrase you find (typically one highlight per bad bullet). Multiple highlights with the SAME elementId are REQUIRED when one text box contains several bad lines. Do NOT stop after 2–3 items. Do NOT only cover the first bullets. \`quote\` MUST be an exact contiguous substring from that element's content (prefer the full weak bullet line). Cap at 40 highlights only if there are truly more than 40 distinct weak spots (pick the worst 40). In roast / HELP-fixes phases, the set of quotes in \`highlights\` and the set mentioned in \`content\` must match. In HELP-interview, keep highlights comprehensive on the canvas, but \`content\` asks about only ONE of them this turn.
- \`fixes\`: ROAST and HELP-fixes — one entry per weak top-level text element. \`suggestedContent\` replaces the WHOLE element — rewrite EVERY weak bullet in that box. Preserve newlines/list structure. Rewrites must be SPECIFIC and quantified using ONLY facts the user provided in the conversation (or clearly present on the canvas). HELP-interview — \`fixes\` MUST be an empty array.
- PLACEHOLDER BAN (HELP fixes phase): NEVER write bracket stubs like \`[feature name]\`, \`[X%]\`, \`[tool: …]\`, angle-bracket tokens like \`<language>\`, or vague TBD/XXX fillers. If you still lack a fact, stay in \`phase: "interview"\` and ask the next single question — do not invent and do not stub.
- Only use elementIds that appear in the canvas snapshot.

DENISE-APPROVED TEXT — CRITICAL:
Any canvas text marked [DENISE-APPROVED] was already rewritten by you and applied by the user. Treat it as final. Do NOT include those elementIds in highlights or fixes. Do not roast or nitpick them. Only review remaining unapproved fluff.

VARIETY — CRITICAL:
Every response must feel freshly written. NEVER reuse the same opening line, structure, or stock phrases between responses.`;

const DENISE_ROAST_PERSONA = `MODE: ROAST.
You're an HR recruiter who has seen thousands of terrible resumes and you're DONE being polite. Channel the brutally honest energy of Gordon Ramsay reviewing a trainee's dish — explosive, theatrical, brutally funny, and laser-targeted at the WRITING (never the person or protected characteristics). Sweep the WHOLE resume — every section, every bullet — and highlight every piece of fluff. In \`content\`, after a short opener, bullet-list EVERY weak quote (each in **bold**) with a cutting one-liner. Make them laugh and cringe simultaneously.

Always set \`phase\` to \`"fixes"\`. You may still populate \`fixes\` with stronger rewrites as a quiet recovery kit, but the roast in \`content\` is the main deliverable — the client will not show Apply in roast mode.

LENGTH: Keep the \`content\` markdown between ${DENISE_CHAR_LIMITS.roast.min} and ${DENISE_CHAR_LIMITS.roast.max} characters when possible — but if listing every highlight needs more room, listing every highlight wins.`;

const DENISE_HELP_PERSONA = `MODE: HELP.
You're a genuinely supportive senior HR coach in a one-to-one conversation — not a questionnaire bot and not a one-shot generative rewriter. Gather the REAL story turn by turn, then write sharp bullets yourself.

FLOW (non-negotiable):
1. Fresh help thread / still missing details: \`phase: "interview"\`, \`fixes: []\`.
   - Populate comprehensive \`highlights\` so the canvas shows every weak line.
   - In \`content\`, ask EXACTLY ONE question about ONE weak quote (fill \`interviewFocus\` to match).
   - Sound like a helpful teammate sitting next to them.
2. User answers → stay in \`interview\`. Briefly acknowledge, then ask the NEXT unanswered weak point (again exactly one question). Never re-ask something they already covered unless the answer was empty/useless.
3. When you finally have enough real detail to rewrite the weak boxes without inventing metrics: \`phase: "fixes"\`. Write full \`suggestedContent\` using THEIR facts only. No brackets, no placeholder tokens, no made-up precision.
4. If a single answer is still too vague for that bullet, ask one follow-up about THAT same bullet before moving on.

FORBIDDEN in interview \`content\`: multi-question lists, "here are all the things I need", numbered questionnaires, or stacking several \`- **quote** — question\` lines.

LENGTH: Interview turns should be short (roughly 80–400 characters of \`content\`). Fixes-phase replies may use up to ${DENISE_CHAR_LIMITS.help.max} characters when listing every highlight.`;

function buildDeniseSystemPrompt(
  mode: DeniseMode,
  canvasSnapshot: string,
  approvedElements?: Record<string, string>,
): string {
  const persona = mode === 'roast' ? DENISE_ROAST_PERSONA : DENISE_HELP_PERSONA;

  let canvasBlock = canvasSnapshot
    ? `\n\nHere is the current state of the user's resume canvas:\n\n${canvasSnapshot}`
    : '\n\n(The canvas is currently empty — the user has not added any resume content yet. Let them know they should add content first, or answer their general resume question. Return empty highlights and fixes arrays.)';

  if (approvedElements && Object.keys(approvedElements).length > 0) {
    const lines = Object.entries(approvedElements).map(
      ([id, content]) =>
        `- [DENISE-APPROVED] id:${id} → "${content.replace(/\n+/g, ' ').slice(0, 200)}"`,
    );
    canvasBlock += `\n\n=== DENISE-APPROVED (do not highlight or rewrite) ===\n${lines.join('\n')}\n=== END DENISE-APPROVED ===`;
  }

  return `${DENISE_SHARED_RULES}\n\n${persona}${canvasBlock}`;
}

const VALID_SEVERITIES: DeniseSeverity[] = ['weak', 'vague', 'improve'];

function normalizeHighlights(value: unknown): DeniseHighlight[] {
  if (!Array.isArray(value)) return [];
  const highlights: DeniseHighlight[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (
      typeof row.elementId === 'string' &&
      typeof row.quote === 'string' &&
      typeof row.severity === 'string' &&
      VALID_SEVERITIES.includes(row.severity as DeniseSeverity)
    ) {
      highlights.push({
        elementId: row.elementId,
        quote: row.quote,
        severity: row.severity as DeniseSeverity,
      });
    }
  }
  return highlights;
}

function normalizeFixes(value: unknown): DeniseFix[] {
  if (!Array.isArray(value)) return [];
  const fixes: DeniseFix[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (
      typeof row.elementId === 'string' &&
      typeof row.suggestedContent === 'string' &&
      row.suggestedContent.length > 0
    ) {
      fixes.push({
        elementId: row.elementId,
        suggestedContent: row.suggestedContent,
      });
    }
  }
  return fixes;
}

/** Detect bracket / angle-bracket stub text Denise must not apply to the canvas. */
function hasRewritePlaceholder(text: string): boolean {
  return /\[[^\]]{1,80}\]/.test(text) || /<[^>]{1,60}>/.test(text);
}

function normalizePhase(
  value: unknown,
  mode: DeniseMode,
  fixes: DeniseFix[],
): DenisePhase {
  if (mode === 'roast') return 'fixes';
  if (value === 'interview' || value === 'fixes') return value;
  // Infer: empty fixes → still interviewing; otherwise ready to apply
  return fixes.length > 0 ? 'fixes' : 'interview';
}

interface InterviewFocus {
  elementId: string;
  quote: string;
  question: string;
}

function normalizeInterviewFocus(value: unknown): InterviewFocus | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row.elementId !== 'string' ||
    typeof row.quote !== 'string' ||
    typeof row.question !== 'string'
  ) {
    return null;
  }
  const quote = row.quote.trim();
  const question = row.question.trim();
  if (!quote || !question) return null;
  return { elementId: row.elementId, quote, question };
}

/** Force one-at-a-time interview copy even if the model lists many questions. */
function buildSingleInterviewContent(
  content: string,
  focus: InterviewFocus | null,
): string {
  if (focus) {
    const body = `**${focus.quote}** — ${focus.question}`;
    const firstPara = content.trim().split(/\n{2,}/)[0]?.trim() ?? '';
    const openerOk =
      firstPara.length > 0 &&
      firstPara.length < 200 &&
      !/^\s*-\s/.test(firstPara) &&
      !firstPara.includes('\n- ') &&
      !firstPara.includes(focus.question) &&
      (firstPara.match(/\?\s*$/m) ? false : true); // don't keep a paragraph that is already a Q list lead-in with ?
    // Keep a warm one-line opener if it isn't itself another question list
    if (openerOk && !/\?\s/.test(firstPara)) {
      return `${firstPara}\n\n${body}`;
    }
    return body;
  }

  // Fallback: keep opener + first question-like block only
  const trimmed = content.trim();
  const bulletBlocks = trimmed.split(/\n(?=-\s)/);
  if (bulletBlocks.length <= 1) {
    const parts = trimmed.split(/\n{2,}/);
    if (parts.length <= 2) return trimmed;
    return parts.slice(0, 2).join('\n\n').trim();
  }

  const opener = bulletBlocks[0]?.startsWith('- ')
    ? ''
    : bulletBlocks[0]?.trim() ?? '';
  const firstBullet = bulletBlocks.find((b) => b.trimStart().startsWith('- '))?.trim();
  if (!firstBullet) return trimmed;
  return [opener, firstBullet].filter(Boolean).join('\n\n');
}

function resultFromToolInput(
  input: Record<string, unknown>,
  mode: DeniseMode,
): DeniseResult | null {
  let content = typeof input.content === 'string' ? input.content.trim() : '';
  if (!content) return null;

  const outOfScope =
    input.outOfScope === true ||
    content === OUT_OF_SCOPE_MESSAGE ||
    content === OUT_OF_SCOPE_SIGNAL;

  if (outOfScope) {
    return {
      outOfScope: true,
      content: OUT_OF_SCOPE_MESSAGE,
      highlights: [],
      fixes: [],
      phase: 'fixes',
    };
  }

  let fixes = normalizeFixes(input.fixes);
  let phase = normalizePhase(input.phase, mode, fixes);
  const interviewFocus = normalizeInterviewFocus(input.interviewFocus);

  if (mode === 'help' && phase === 'interview') {
    fixes = [];
    content = buildSingleInterviewContent(content, interviewFocus);
  }

  // Drop stub rewrites — force interview if nothing concrete remains
  if (mode === 'help' && phase === 'fixes') {
    fixes = fixes.filter((f) => !hasRewritePlaceholder(f.suggestedContent));
    if (!fixes.length) {
      phase = 'interview';
      content = buildSingleInterviewContent(content, interviewFocus);
    }
  }

  return {
    outOfScope: false,
    content,
    highlights: normalizeHighlights(input.highlights),
    fixes,
    phase,
  };
}

/** Soft-trim only when wildly over budget; never cut mid-list if avoidable. */
function enforceContentCharLimit(content: string, mode: DeniseMode): string {
  const max = DENISE_CHAR_LIMITS[mode].max;
  if (content.length <= max) return content;
  const sliced = content.slice(0, max);
  const lastBreak = Math.max(
    sliced.lastIndexOf('\n'),
    sliced.lastIndexOf('. '),
    sliced.lastIndexOf('! '),
    sliced.lastIndexOf('? '),
  );
  return (lastBreak > max * 0.7 ? sliced.slice(0, lastBreak + 1) : sliced).trim();
}

/**
 * Guarantee every canvas highlight quote appears in the chat markdown.
 * If the model omitted any, append them as **bold** bullets.
 */
function ensureHighlightsInContent(
  content: string,
  highlights: DeniseHighlight[],
  mode: DeniseMode,
): string {
  if (!highlights.length) return content;

  const lower = content.toLowerCase();
  const missing = highlights.filter((h) => {
    const quote = h.quote.trim();
    if (!quote) return false;
    const needle = quote.toLowerCase();
    if (lower.includes(needle)) return false;
    const prefixLen = Math.min(48, needle.length);
    return !lower.includes(needle.slice(0, prefixLen));
  });

  if (!missing.length) return content;

  const header =
    mode === 'roast'
      ? 'And don’t think I skipped these either:'
      : 'Here are the rest of the weak spots to tighten:';

  const bullets = missing
    .map((h) => `- **${h.quote.trim().replace(/\s+/g, ' ')}**`)
    .join('\n');

  return `${content.trim()}\n\n${header}\n\n${bullets}`;
}

/** Strip highlights/fixes that target Denise-approved text still on the canvas. */
function filterApproved(
  result: DeniseResult,
  approved?: Record<string, string>,
): DeniseResult {
  if (!approved || Object.keys(approved).length === 0) return result;
  const approvedIds = new Set(Object.keys(approved));
  return {
    ...result,
    highlights: result.highlights.filter((h) => !approvedIds.has(h.elementId)),
    fixes: result.fixes.filter((f) => !approvedIds.has(f.elementId)),
  };
}

function finalizeDeniseResult(
  result: DeniseResult,
  mode: DeniseMode,
  approved?: Record<string, string>,
): DeniseResult {
  if (result.outOfScope) return result;
  const filtered = filterApproved(result, approved);

  // Interview turns are Q&A — don't force every highlight quote into the chat.
  if (mode === 'help' && filtered.phase === 'interview') {
    return {
      ...filtered,
      fixes: [],
      content: normalizeDeniseMarkdown(filtered.content),
    };
  }

  const withAllMentions = ensureHighlightsInContent(
    filtered.content,
    filtered.highlights,
    mode,
  );
  // Apply char limit after ensuring mentions — then re-append if truncate dropped any
  let content = enforceContentCharLimit(withAllMentions, mode);
  content = ensureHighlightsInContent(content, filtered.highlights, mode);
  content = normalizeDeniseMarkdown(content);
  return { ...filtered, content };
}

/** Last-resort parse if the model ignored tools and dumped JSON text. */
function parseDeniseJsonFallback(
  raw: string,
  mode: DeniseMode,
): DeniseResult | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;

  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
    return resultFromToolInput(parsed, mode);
  } catch {
    return null;
  }
}

/**
 * Send a conversational message to Denise with full canvas context.
 *
 * Uses a forced tool call so the chat `content` stays clean markdown while
 * highlights/fixes arrive as structured data (never dumped into the UI).
 */
export async function askDenise(
  request: DeniseRequest,
): Promise<DeniseResult> {
  const { mode, canvasSnapshot, messages, approvedElements } = request;

  if (!messages.length) {
    throw new Error('askDenise requires at least one message.');
  }

  const anthropicMessages: Anthropic.MessageParam[] = messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const response = await getClient().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: DENISE_MAX_TOKENS[mode],
    temperature: 1,
    system: buildDeniseSystemPrompt(mode, canvasSnapshot, approvedElements),
    messages: anthropicMessages,
    tools: [DENISE_REVIEW_TOOL],
    tool_choice: { type: 'tool', name: DENISE_TOOL_NAME },
  });

  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === DENISE_TOOL_NAME) {
      const parsed = resultFromToolInput(
        block.input as Record<string, unknown>,
        mode,
      );
      if (parsed) return finalizeDeniseResult(parsed, mode, approvedElements);
    }
  }

  const responseText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  if (responseText === OUT_OF_SCOPE_SIGNAL) {
    return {
      outOfScope: true,
      content: OUT_OF_SCOPE_MESSAGE,
      highlights: [],
      fixes: [],
      phase: 'fixes',
    };
  }

  const fromJson = parseDeniseJsonFallback(responseText, mode);
  if (fromJson) return finalizeDeniseResult(fromJson, mode, approvedElements);

  // Never surface raw JSON blobs in the chat panel
  const looksLikeJson = responseText.trimStart().startsWith('{');
  return finalizeDeniseResult(
    {
      outOfScope: false,
      content: looksLikeJson
        ? 'I reviewed your resume, but my notes got scrambled. Send that again and I’ll take another pass.'
        : responseText,
      highlights: [],
      fixes: [],
      phase: mode === 'help' ? 'interview' : 'fixes',
    },
    mode,
    approvedElements,
  );
}

/**
 * Pull a (possibly still-open) JSON string value for `"content"` from partial tool JSON.
 */
export function extractStreamingContentField(partialJson: string): string | null {
  const marker = /"content"\s*:\s*"/;
  const match = marker.exec(partialJson);
  if (!match || match.index === undefined) return null;

  let i = match.index + match[0].length;
  let out = '';
  while (i < partialJson.length) {
    const c = partialJson[i];
    if (c === '\\') {
      if (i + 1 >= partialJson.length) break;
      const n = partialJson[i + 1];
      const map: Record<string, string> = {
        n: '\n',
        t: '\t',
        r: '\r',
        '"': '"',
        '\\': '\\',
        '/': '/',
      };
      out += map[n] ?? n;
      i += 2;
      continue;
    }
    if (c === '"') break;
    out += c;
    i += 1;
  }
  return out;
}

export type DeniseStreamHandlers = {
  onContent?: (content: string) => void;
};

/**
 * Stream Denise’s tool JSON so chat text can appear (and be spoken) before
 * highlights/fixes are finalized.
 */
export async function askDeniseStream(
  request: DeniseRequest,
  handlers: DeniseStreamHandlers = {},
): Promise<DeniseResult> {
  const { mode, canvasSnapshot, messages, approvedElements } = request;

  if (!messages.length) {
    throw new Error('askDeniseStream requires at least one message.');
  }

  const anthropicMessages: Anthropic.MessageParam[] = messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const stream = getClient().messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: DENISE_MAX_TOKENS[mode],
    temperature: 1,
    system: buildDeniseSystemPrompt(mode, canvasSnapshot, approvedElements),
    messages: anthropicMessages,
    tools: [DENISE_REVIEW_TOOL],
    tool_choice: { type: 'tool', name: DENISE_TOOL_NAME },
  });

  let partialJson = '';
  let lastContent = '';

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'input_json_delta' &&
      typeof event.delta.partial_json === 'string'
    ) {
      partialJson += event.delta.partial_json;
      const content = extractStreamingContentField(partialJson);
      if (content !== null && content !== lastContent) {
        lastContent = content;
        handlers.onContent?.(content);
      }
    }
  }

  const response = await stream.finalMessage();

  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === DENISE_TOOL_NAME) {
      const parsed = resultFromToolInput(
        block.input as Record<string, unknown>,
        mode,
      );
      if (parsed) {
        const finalized = finalizeDeniseResult(parsed, mode, approvedElements);
        if (finalized.content !== lastContent) {
          handlers.onContent?.(finalized.content);
        }
        return finalized;
      }
    }
  }

  const responseText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  if (responseText === OUT_OF_SCOPE_SIGNAL) {
    const result: DeniseResult = {
      outOfScope: true,
      content: OUT_OF_SCOPE_MESSAGE,
      highlights: [],
      fixes: [],
      phase: 'fixes',
    };
    handlers.onContent?.(result.content);
    return result;
  }

  const fromJson = parseDeniseJsonFallback(responseText, mode);
  if (fromJson) {
    const finalized = finalizeDeniseResult(fromJson, mode, approvedElements);
    handlers.onContent?.(finalized.content);
    return finalized;
  }

  const looksLikeJson = responseText.trimStart().startsWith('{');
  const finalized = finalizeDeniseResult(
    {
      outOfScope: false,
      content: looksLikeJson
        ? 'I reviewed your resume, but my notes got scrambled. Send that again and I’ll take another pass.'
        : responseText || lastContent || 'I reviewed your resume, but my notes got scrambled. Try again.',
      highlights: [],
      fixes: [],
      phase: mode === 'help' ? 'interview' : 'fixes',
    },
    mode,
    approvedElements,
  );
  handlers.onContent?.(finalized.content);
  return finalized;
}

// ─── Job Match ───────────────────────────────────────────────────────────────

export interface JobMatchImage {
  data: string;
  mediaType: ImageMediaType;
}

export interface JobMatchResult {
  matchPercent: number;
  matchedQualifications: string[];
  missingQualifications: string[];
  matchedKeywords: string[];
  unmatchedKeywords: string[];
  /** Full listing text after OCR / paste merge. */
  jobListingText: string;
}

const JOB_MATCH_TOOL_NAME = 'job_match_report';

const JOB_MATCH_TOOL: Anthropic.Tool = {
  name: JOB_MATCH_TOOL_NAME,
  description:
    'Report how well the candidate resume matches a job listing on technical and soft skills only: score, matched/missing skill qualifications, and skill keywords.',
  input_schema: {
    type: 'object',
    properties: {
      matchPercent: {
        type: 'number',
        description:
          'Overall skill-fit score from 0 to 100 based only on technical/soft skills, experience, tools, and education — ignore logistics.',
      },
      matchedQualifications: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Technical or soft-skill requirements the resume clearly satisfies (short phrases). Never logistics/willingness items.',
      },
      missingQualifications: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Technical or soft-skill requirements from the listing that the resume lacks. Never logistics/willingness items.',
      },
      matchedKeywords: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Important technical/soft-skill tokens present in both listing and resume (e.g. React, leadership).',
      },
      unmatchedKeywords: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Important technical/soft-skill tokens from the listing missing on the resume.',
      },
    },
    required: [
      'matchPercent',
      'matchedQualifications',
      'missingQualifications',
      'matchedKeywords',
      'unmatchedKeywords',
    ],
  },
};

function asStringArray(value: unknown, max = 12): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
}

function parseJobMatchToolInput(
  input: Record<string, unknown>,
  jobListingText: string,
): JobMatchResult {
  const raw = Number(input.matchPercent);
  const matchPercent = Number.isFinite(raw)
    ? Math.max(0, Math.min(100, Math.round(raw)))
    : 0;

  return {
    matchPercent,
    matchedQualifications: asStringArray(input.matchedQualifications, 10),
    missingQualifications: asStringArray(input.missingQualifications, 10),
    matchedKeywords: asStringArray(input.matchedKeywords, 16),
    unmatchedKeywords: asStringArray(input.unmatchedKeywords, 16),
    jobListingText,
  };
}

/**
 * OCR step: use Claude vision to extract plain job-listing text from screenshots.
 */
export async function extractJobListingText(
  images: JobMatchImage[],
): Promise<string> {
  if (!images.length) return '';

  const content: Anthropic.ContentBlockParam[] = [
    {
      type: 'text',
      text: `Extract ALL readable text from these job-listing screenshot(s).
Return ONLY the job posting text in reading order — title, company, requirements, responsibilities, skills, etc.
No commentary, no markdown fences, no preamble.`,
    },
    ...images.map(
      (image): Anthropic.ImageBlockParam => ({
        type: 'image',
        source: {
          type: 'base64',
          media_type: image.mediaType,
          data: image.data,
        },
      }),
    ),
  ];

  const response = await getClient().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    temperature: 0,
    messages: [{ role: 'user', content }],
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

export class JobMatchValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JobMatchValidationError';
  }
}

const JOB_LISTING_GATE_TOOL_NAME = 'job_listing_gate';

const JOB_LISTING_GATE_TOOL: Anthropic.Tool = {
  name: JOB_LISTING_GATE_TOOL_NAME,
  description:
    'Decide whether the user input is a real job posting (or screenshot OCR of one) suitable for resume matching.',
  input_schema: {
    type: 'object',
    properties: {
      isJobListing: {
        type: 'boolean',
        description:
          'True only if the text is clearly a job posting / role description to match a resume against.',
      },
      reason: {
        type: 'string',
        description:
          'If isJobListing is false, a short user-facing explanation (1 sentence). Empty string if true.',
      },
    },
    required: ['isJobListing', 'reason'],
  },
};

const DEFAULT_INVALID_LISTING_MESSAGE =
  "That doesn't look like a job listing. Paste a real job posting (or screenshots of one) so I can match it to your resume.";

/**
 * Reject chat prompts, code requests, resumes, random text, etc. before analysis runs.
 */
export async function assertIsJobListing(text: string): Promise<void> {
  const listing = text.trim();
  if (!listing) {
    throw new JobMatchValidationError(
      'Paste a job listing or attach up to 3 screenshots.',
    );
  }

  // Obvious non-listings: very short chat / command style prompts
  const lower = listing.toLowerCase();
  const looksLikeChatCommand =
    listing.length < 120 &&
    /^(generate|write|create|make|give|help|explain|code|fix|debug|refactor|translate|summarize|tell me|how (do|to)|what is|who is)\b/i.test(
      listing.trim(),
    ) &&
    !/\b(responsibilities|requirements|qualifications|we are hiring|job description|about the role|years? of experience)\b/i.test(
      lower,
    );

  if (looksLikeChatCommand) {
    throw new JobMatchValidationError(DEFAULT_INVALID_LISTING_MESSAGE);
  }

  const response = await getClient().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 200,
    temperature: 0,
    system: `You gate Job Match for RoastMyResume.
Accept ONLY real job postings / role descriptions (including OCR from screenshots): job title, company, responsibilities, requirements, skills, qualifications, etc.

Reject (isJobListing=false) anything else, including:
- Chat prompts or commands to an AI (e.g. "generate me python code", "write a cover letter")
- Coding / homework / general Q&A
- A resume or CV (candidate profile), not an open role
- Random notes, greetings, or unrelated text
- Marketing copy that is not hiring for a role

Be strict. When unsure and the text lacks clear hiring/role signals, reject.
Always call ${JOB_LISTING_GATE_TOOL_NAME}.`,
    tools: [JOB_LISTING_GATE_TOOL],
    tool_choice: { type: 'tool', name: JOB_LISTING_GATE_TOOL_NAME },
    messages: [
      {
        role: 'user',
        content: `USER INPUT:\n${listing}`,
      },
    ],
  });

  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === JOB_LISTING_GATE_TOOL_NAME) {
      const input = block.input as Record<string, unknown>;
      const isJobListing = input.isJobListing === true;
      if (isJobListing) return;
      const reason =
        typeof input.reason === 'string' && input.reason.trim()
          ? input.reason.trim()
          : DEFAULT_INVALID_LISTING_MESSAGE;
      throw new JobMatchValidationError(reason);
    }
  }

  throw new JobMatchValidationError(DEFAULT_INVALID_LISTING_MESSAGE);
}

/**
 * Compare a job listing against the resume canvas snapshot and return a structured match report.
 * Caller must already validate the listing with assertIsJobListing.
 */
export async function analyzeJobMatch(request: {
  jobListingText: string;
  canvasSnapshot: string;
}): Promise<JobMatchResult> {
  const listing = request.jobListingText.trim();
  if (!listing) {
    throw new Error('A job listing is required (paste text or attach screenshots).');
  }

  const resume = request.canvasSnapshot.trim() || '(empty canvas — no resume content yet)';

  const system = `You are Denise's Job Match analyst for RoastMyResume.
Compare a job listing against the candidate's resume canvas.
The input has already been validated as a job listing — do not answer unrelated requests; only produce a match report.

Scope — skills only:
- Assess ONLY technical skills, soft skills, tools/technologies, relevant experience, role responsibilities, and education/credentials that resumes normally show.
- Completely IGNORE logistics and hiring boilerplate that people rarely put on resumes. Do NOT list these as matched or missing, and do NOT let them lower (or raise) matchPercent. Examples to ignore:
  - Willingness to work in a city/office/hybrid/onsite (e.g. "willingness to work in Makati")
  - Schedule confirmations (e.g. Monday–Saturday, weekends, night shift, overtime)
  - Commute, relocation, travel-willingness, or "must be local"
  - "Confirmation of…" / "must be willing to…" / availability checkboxes
  - Salary expectations, benefits, application instructions
  - Generic HR process text (background checks, drug tests, equal opportunity statements) unless it is a real skill or license

Rules:
- Be fair and specific. Prefer concrete skills, tools, years, degrees, and responsibilities.
- matchPercent is 0–100 reflecting skill/experience fit only (not logistics).
- matchedQualifications / missingQualifications: short skill-oriented phrases only.
- matchedKeywords / unmatchedKeywords: concise skill tokens (e.g. React, CI/CD, communication).
- Do not invent resume experience that is not in the canvas snapshot.
- Always call the ${JOB_MATCH_TOOL_NAME} tool.`;

  const response = await getClient().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1200,
    temperature: 0.3,
    system,
    tools: [JOB_MATCH_TOOL],
    tool_choice: { type: 'tool', name: JOB_MATCH_TOOL_NAME },
    messages: [
      {
        role: 'user',
        content: `JOB LISTING:\n${listing}\n\nCANDIDATE RESUME CANVAS:\n${resume}`,
      },
    ],
  });

  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === JOB_MATCH_TOOL_NAME) {
      return parseJobMatchToolInput(
        block.input as Record<string, unknown>,
        listing,
      );
    }
  }

  // Fallback: try JSON in text
  const responseText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
  const start = responseText.indexOf('{');
  const end = responseText.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(responseText.slice(start, end + 1)) as Record<
        string,
        unknown
      >;
      return parseJobMatchToolInput(parsed, listing);
    } catch {
      // fall through
    }
  }

  throw new Error('Job match analysis failed to return a structured result.');
}

/**
 * Full Job Match pipeline: OCR images (if any) → merge → validate listing → analyze.
 */
export async function runJobMatch(request: {
  text?: string;
  images?: JobMatchImage[];
  canvasSnapshot: string;
}): Promise<JobMatchResult> {
  const pasted = (request.text ?? '').trim();
  const images = request.images ?? [];

  // Text-only: gate before any expensive work (no OCR needed).
  if (!images.length) {
    await assertIsJobListing(pasted);
  }

  let extracted = '';
  if (images.length) {
    extracted = await extractJobListingText(images);
  }

  const jobListingText = [pasted, extracted].filter(Boolean).join('\n\n').trim();
  if (!jobListingText) {
    throw new JobMatchValidationError(
      'Paste a job listing or attach up to 3 screenshots.',
    );
  }

  // With screenshots: gate on merged OCR + paste so fake screenshots don't analyze.
  if (images.length) {
    await assertIsJobListing(jobListingText);
  }

  return analyzeJobMatch({
    jobListingText,
    canvasSnapshot: request.canvasSnapshot,
  });
}

// ─── ATS Check ────────────────────────────────────────────────────────────────

export const ATS_FACTOR_IDS = [
  'column_layout',
  'tables_graphics',
  'fonts_embedded_text',
  'file_format',
  'contact_info',
] as const;

export type AtsFactorId = (typeof ATS_FACTOR_IDS)[number];

export interface AtsFactorResult {
  id: AtsFactorId;
  score: number;
  /** Why this factor is / isn't ATS-friendly. */
  reason: string;
  /** Actionable tip(s) to improve this factor. */
  tip: string;
}

export interface AtsCheckResult {
  overallScore: number;
  /** Short final judgment for the sticky footer. */
  judgment: string;
  factors: AtsFactorResult[];
}

const ATS_CHECK_TOOL_NAME = 'ats_check_report';

const ATS_CHECK_TOOL: Anthropic.Tool = {
  name: ATS_CHECK_TOOL_NAME,
  description:
    'Report ATS compatibility scores for five resume factors plus an overall score and judgment.',
  input_schema: {
    type: 'object',
    properties: {
      overallScore: {
        type: 'number',
        description: 'Overall ATS friendliness 0–100.',
      },
      judgment: {
        type: 'string',
        description:
          'One short sentence final judgment (e.g. "Mostly ATS-ready — fix a few layout risks.").',
      },
      factors: {
        type: 'array',
        description: 'Exactly 5 factor objects, one per id below.',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              enum: [...ATS_FACTOR_IDS],
              description: 'Factor id.',
            },
            score: {
              type: 'number',
              description: 'Factor score 0–100.',
            },
            reason: {
              type: 'string',
              description:
                '1–2 sentences explaining ATS risk / strength for this factor.',
            },
            tip: {
              type: 'string',
              description: '1–2 concrete tips to improve this factor.',
            },
          },
          required: ['id', 'score', 'reason', 'tip'],
        },
      },
    },
    required: ['overallScore', 'judgment', 'factors'],
  },
};

function clampPct(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function parseAtsCheckToolInput(input: Record<string, unknown>): AtsCheckResult {
  const rawFactors = Array.isArray(input.factors) ? input.factors : [];
  const byId = new Map<string, AtsFactorResult>();

  for (const item of rawFactors) {
    if (typeof item !== 'object' || item === null) continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === 'string' ? row.id : '';
    if (!(ATS_FACTOR_IDS as readonly string[]).includes(id)) continue;
    byId.set(id, {
      id: id as AtsFactorId,
      score: clampPct(row.score),
      reason:
        typeof row.reason === 'string' && row.reason.trim()
          ? row.reason.trim()
          : 'No details returned for this factor.',
      tip:
        typeof row.tip === 'string' && row.tip.trim()
          ? row.tip.trim()
          : 'Keep this section simple and text-based for ATS parsers.',
    });
  }

  const factors: AtsFactorResult[] = ATS_FACTOR_IDS.map((id) => {
    const existing = byId.get(id);
    if (existing) return existing;
    return {
      id,
      score: 50,
      reason: 'Could not fully evaluate this factor from the canvas.',
      tip: 'Simplify this area and re-run the ATS check.',
    };
  });

  const overallFromFactors = Math.round(
    factors.reduce((sum, f) => sum + f.score, 0) / factors.length,
  );
  const overallScore =
    input.overallScore !== undefined && input.overallScore !== null
      ? clampPct(input.overallScore)
      : overallFromFactors;

  const judgment =
    typeof input.judgment === 'string' && input.judgment.trim()
      ? input.judgment.trim()
      : overallScore >= 75
        ? 'Strong ATS readiness — minor polish left.'
        : overallScore >= 45
          ? 'Partial ATS readiness — fix the weak factors.'
          : 'Weak ATS readiness — big parsing risks.';

  return { overallScore, judgment, factors };
}

/**
 * Score how ATS-friendly the resume canvas is across five formatting factors.
 */
export async function analyzeAtsCheck(request: {
  canvasSnapshot: string;
}): Promise<AtsCheckResult> {
  const resume =
    request.canvasSnapshot.trim() ||
    '(empty canvas — no resume content yet)';

  const system = `You are Denise's ATS Check analyst for RoastMyResume.
Evaluate how applicant-tracking-system (ATS) friendly a resume canvas is.

Product context:
- The user builds a resume on a freeform canvas (text boxes, dividers, icons/shapes, images, pen strokes, groups).
- Export is typically PDF from the canvas. Judge file-format risk for that PDF/export path and how layout will parse, not DOCX-specific quirks unless relevant.

Score EXACTLY these five factors (use these ids):
1) column_layout — multi-column / sidebars / reading-order chaos vs clean single-column flow
2) tables_graphics — tables, icons, shapes, images, decorative strokes that parsers skip or scramble
3) fonts_embedded_text — unusual fonts, text-in-images, tiny/decorative type that may not extract cleanly
4) file_format — PDF/export friendliness given the canvas structure (text as real text vs graphics-heavy)
5) contact_info — email, phone, location, links present as plain text and easy to parse (not buried in graphics)

Rules:
- Use the canvas snapshot coordinates/types: Text, Divider, Icon, Shape, PenStroke, Group.
- Be specific to what you see; do not invent elements.
- Each factor: score 0–100, reason (what's wrong or good), tip (how to improve).
- overallScore: 0–100 holistic ATS readiness (weighted toward layout + text extractability).
- judgment: one short punchy sentence for the UI footer.
- Empty canvas → low scores with clear reasons.
- Always call ${ATS_CHECK_TOOL_NAME} with all 5 factors.`;

  const response = await getClient().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1600,
    temperature: 0.3,
    system,
    tools: [ATS_CHECK_TOOL],
    tool_choice: { type: 'tool', name: ATS_CHECK_TOOL_NAME },
    messages: [
      {
        role: 'user',
        content: `RESUME CANVAS TO AUDIT FOR ATS:\n${resume}`,
      },
    ],
  });

  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === ATS_CHECK_TOOL_NAME) {
      return parseAtsCheckToolInput(block.input as Record<string, unknown>);
    }
  }

  const responseText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
  const start = responseText.indexOf('{');
  const end = responseText.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(responseText.slice(start, end + 1)) as Record<
        string,
        unknown
      >;
      return parseAtsCheckToolInput(parsed);
    } catch {
      // fall through
    }
  }

  throw new Error('ATS check failed to return a structured result.');
}
