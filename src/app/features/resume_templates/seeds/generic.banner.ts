import { text, divider, shape } from '../build';
import type { TemplateSeedElements } from '../types';
import { SAFE, CANVAS_W } from '../types';

const W = CANVAS_W - SAFE * 2;
const BANNER_H = 158;
const ACCENT = '#6d28d9';
const INK = '#1f2233';
const SUB = '#3b3f52';
const MUTE = '#6b7280';

const head = (content: string, y: number) =>
  text({ content, x: SAFE, y, width: W, fontSize: 12.5, fontWeight: 700, color: ACCENT, textCategory: 'subheader' });

const dates = (content: string, y: number) =>
  text({ content, x: CANVAS_W - SAFE - 190, y, width: 190, fontSize: 10.5, color: MUTE, textAlign: 'right', textCategory: 'meta' });

const role = (title: string, company: string, y: number) => [
  text({ content: title, x: SAFE, y, width: 480, fontSize: 12.5, fontWeight: 700, color: INK, textCategory: 'body' }),
  text({ content: company, x: SAFE, y: y + 18, width: 480, fontSize: 11.5, color: ACCENT, fontWeight: 600, textCategory: 'body' }),
];

/** Generic Banner — full-bleed accent band header, dense single column. */
export const genericBannerSeed: TemplateSeedElements = {
  texts: [
    // On the banner
    text({ content: 'Your Name', x: SAFE, y: 44, width: W, fontSize: 34, fontWeight: 700, color: '#ffffff', textCategory: 'header' }),
    text({ content: 'Your Profession', x: SAFE, y: 92, width: W, fontSize: 14, color: '#e9d5ff', fontWeight: 600, textCategory: 'subheader' }),
    text({ content: 'City, Country   ·   email@example.com   ·   (555) 000-0000   ·   linkedin.com/in/you', x: SAFE, y: 118, width: W, fontSize: 11, color: '#ddd0f5', textCategory: 'meta' }),

    // Body
    head('PROFILE', 188),
    text({ content: 'Two to three sentence summary of who you are, your strongest skills, and the value you bring. Tailor it to the role and lead with what makes you a strong fit.', x: SAFE, y: 210, width: W, fontSize: 11.5, color: SUB, textCategory: 'body' }),

    head('EXPERIENCE', 280),
    ...role('Job Title', 'Company Name, City', 308),
    dates('Month Year – Present', 308),
    text({ content: '• Your biggest win here — quantify the impact.\n• A responsibility you owned and its outcome.\n• Something you improved for the team or customer.\n• A result that proves your reliability.', x: SAFE, y: 348, width: W, fontSize: 11.5, color: SUB, textCategory: 'body' }),

    ...role('Job Title', 'Company Name, City', 428),
    dates('Month Year – Month Year', 428),
    text({ content: '• Contribution tied to a measurable outcome.\n• Skill you applied and the value it created.\n• Teamwork, leadership, or initiative highlight.\n• Quantified improvement where you can.', x: SAFE, y: 468, width: W, fontSize: 11.5, color: SUB, textCategory: 'body' }),

    ...role('Job Title', 'Company Name, City', 548),
    dates('Month Year – Month Year', 548),
    text({ content: '• Early role achievement with a real result.\n• A skill you built that still serves you.', x: SAFE, y: 588, width: W, fontSize: 11.5, color: SUB, textCategory: 'body' }),

    head('EDUCATION', 654),
    text({ content: 'Degree, Major', x: SAFE, y: 680, width: 480, fontSize: 12, fontWeight: 700, color: INK, textCategory: 'body' }),
    dates('Graduation Year', 680),
    text({ content: 'University Name, City, Country', x: SAFE, y: 699, width: 480, fontSize: 11.5, color: MUTE, textCategory: 'body' }),

    head('SKILLS', 742),
    text({ content: 'Core: your strongest, most relevant skills\nTools: software and tools you know well\nSoft: communication, teamwork, problem solving', x: SAFE, y: 768, width: W, fontSize: 11.5, color: SUB, textCategory: 'body' }),

    head('ACHIEVEMENTS & INTERESTS', 850),
    text({ content: 'Award, certification, or achievement — Year.\nInterests or volunteer work — one relevant line.', x: SAFE, y: 876, width: W, fontSize: 11.5, color: SUB, textCategory: 'body' }),
  ],
  icons: [
    shape({ x: 0, y: 0, width: CANVAS_W, height: BANNER_H, color: ACCENT, bypassSafeArea: true, zIndex: 0 }),
  ],
  dividers: [
    divider({ x: SAFE, y: 272, width: W, thickness: 1, color: '#e5e0f2' }),
    divider({ x: SAFE, y: 646, width: W, thickness: 1, color: '#e5e0f2' }),
    divider({ x: SAFE, y: 734, width: W, thickness: 1, color: '#e5e0f2' }),
    divider({ x: SAFE, y: 842, width: W, thickness: 1, color: '#e5e0f2' }),
  ],
};
