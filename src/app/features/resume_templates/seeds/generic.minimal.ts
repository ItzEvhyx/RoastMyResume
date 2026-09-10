import { text, divider } from '../build';
import type { TemplateSeedElements } from '../types';
import { SAFE, CANVAS_W } from '../types';

const W = CANVAS_W - SAFE * 2;
const INK = '#1f2937';
const SUB = '#374151';
const MUTE = '#6b7280';
const RULE = '#d1d5db';

const head = (content: string, y: number) =>
  text({ content, x: SAFE, y, width: W, fontSize: 12.5, fontWeight: 700, color: INK, textCategory: 'subheader' });

const dates = (content: string, y: number) =>
  text({ content, x: CANVAS_W - SAFE - 190, y, width: 190, fontSize: 10.5, color: MUTE, textAlign: 'right', textCategory: 'meta' });

const role = (title: string, company: string, y: number) => [
  text({ content: title, x: SAFE, y, width: 480, fontSize: 12.5, fontWeight: 700, color: INK, textCategory: 'body' }),
  text({ content: company, x: SAFE, y: y + 18, width: 480, fontSize: 11.5, color: MUTE, textCategory: 'body' }),
];

/** Generic Minimal — clean centered header, calm single column, full page. */
export const genericMinimalSeed: TemplateSeedElements = {
  texts: [
    text({ content: 'Your Name', x: SAFE, y: 52, width: W, fontSize: 34, fontWeight: 700, color: INK, textAlign: 'center', textCategory: 'header' }),
    text({ content: 'Your Profession', x: SAFE, y: 100, width: W, fontSize: 13, color: MUTE, textAlign: 'center', textCategory: 'subheader' }),
    text({ content: 'City, Country   ·   email@example.com   ·   (555) 000-0000   ·   yourwebsite.com', x: SAFE, y: 124, width: W, fontSize: 11, color: MUTE, textAlign: 'center', textCategory: 'meta' }),

    head('SUMMARY', 164),
    text({ content: 'A short, versatile summary that works for most fields. State who you are, your top strengths, and what you want to do next. Keep it warm, clear, and specific to the role you are targeting.', x: SAFE, y: 186, width: W, fontSize: 11.5, color: SUB, textCategory: 'body' }),

    head('EXPERIENCE', 256),
    ...role('Job Title', 'Company Name, City', 284),
    dates('Month Year – Present', 284),
    text({ content: '• What you did + the result, ideally with a number.\n• A responsibility you owned and how it went.\n• Something you improved for the team or customer.\n• A moment that shows initiative or reliability.', x: SAFE, y: 324, width: W, fontSize: 11.5, color: SUB, textCategory: 'body' }),

    ...role('Job Title', 'Company Name, City', 404),
    dates('Month Year – Month Year', 404),
    text({ content: '• Contribution tied to a clear outcome.\n• Skill you used and the value it created.\n• A quantified win where you can back it up.\n• Teamwork or leadership highlight.', x: SAFE, y: 444, width: W, fontSize: 11.5, color: SUB, textCategory: 'body' }),

    ...role('Job Title', 'Company Name, City', 524),
    dates('Month Year – Month Year', 524),
    text({ content: '• Early role achievement with a real result.\n• A skill you built that still serves you today.', x: SAFE, y: 564, width: W, fontSize: 11.5, color: SUB, textCategory: 'body' }),

    head('EDUCATION', 630),
    text({ content: 'Degree, Major', x: SAFE, y: 656, width: 480, fontSize: 12, fontWeight: 700, color: INK, textCategory: 'body' }),
    dates('Graduation Year', 656),
    text({ content: 'University Name, City, Country', x: SAFE, y: 675, width: 480, fontSize: 11.5, color: MUTE, textCategory: 'body' }),
    text({ content: 'Relevant coursework, honors, or activities.', x: SAFE, y: 693, width: W, fontSize: 11, color: MUTE, textCategory: 'meta' }),

    head('SKILLS', 736),
    text({ content: 'Core: your strongest, most relevant skills\nTools: software and tools you know well', x: SAFE, y: 762, width: W, fontSize: 11.5, color: SUB, textCategory: 'body' }),

    head('INTERESTS & VOLUNTEER', 820),
    text({ content: 'Volunteer role or interest — one relevant line.\nLanguages: list any additional languages and level.', x: SAFE, y: 846, width: W, fontSize: 11.5, color: SUB, textCategory: 'body' }),
  ],
  icons: [],
  dividers: [
    divider({ x: SAFE, y: 152, width: W, thickness: 1, color: RULE }),
    divider({ x: SAFE, y: 248, width: W, thickness: 1, color: RULE }),
    divider({ x: SAFE, y: 622, width: W, thickness: 1, color: RULE }),
    divider({ x: SAFE, y: 728, width: W, thickness: 1, color: RULE }),
    divider({ x: SAFE, y: 812, width: W, thickness: 1, color: RULE }),
  ],
};
