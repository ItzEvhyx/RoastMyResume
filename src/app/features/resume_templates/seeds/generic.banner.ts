import { text, divider, shape } from '../build';
import type { TemplateSeedElements } from '../types';
import { SAFE, CANVAS_W } from '../types';

const W = CANVAS_W - SAFE * 2;
const BANNER_H = 158;
const ACCENT = '#6d28d9';
const INK = '#1f2233';
const SUB = '#3b3f52';
const MUTE = '#6b7280';

const head = (content: string, y: number, docField: string) =>
  text({ content, x: SAFE, y, width: W, fontSize: 12.5, fontWeight: 700, color: ACCENT, textCategory: 'subheader', docField });

const dates = (content: string, y: number, docField: string) =>
  text({ content, x: CANVAS_W - SAFE - 190, y, width: 190, fontSize: 10.5, color: MUTE, textAlign: 'right', textCategory: 'meta', docField });

const role = (title: string, company: string, y: number, titleField: string, companyField: string) => [
  text({ content: title, x: SAFE, y, width: 480, fontSize: 12.5, fontWeight: 700, color: INK, textCategory: 'body', docField: titleField }),
  text({ content: company, x: SAFE, y: y + 18, width: 480, fontSize: 11.5, color: ACCENT, fontWeight: 600, textCategory: 'body', docField: companyField }),
];

/** Generic Banner — full-bleed accent band header, dense single column. */
export const genericBannerSeed: TemplateSeedElements = {
  texts: [
    // On the banner
    text({ content: 'Your Name', x: SAFE, y: 44, width: W, fontSize: 34, fontWeight: 700, color: '#ffffff', textCategory: 'header', docField: 'personal.name' }),
    text({ content: 'Your Profession', x: SAFE, y: 92, width: W, fontSize: 14, color: '#e9d5ff', fontWeight: 600, textCategory: 'subheader', docField: 'personal.title' }),
    text({ content: 'City, Country   ·   email@example.com   ·   (555) 000-0000   ·   linkedin.com/in/you', x: SAFE, y: 118, width: W, fontSize: 11, color: '#ddd0f5', textCategory: 'meta', docField: 'contact.0.value' }),

    // Body
    head('PROFILE', 188, 'summary.heading'),
    text({ content: 'Two to three sentence summary of who you are, your strongest skills, and the value you bring. Tailor it to the role and lead with what makes you a strong fit.', x: SAFE, y: 210, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'summary.body' }),

    head('EXPERIENCE', 280, 'experience.heading'),
    ...role('Job Title', 'Company Name, City', 308, 'experience.0.title', 'experience.0.company'),
    dates('Month Year – Present', 308, 'experience.0.dates'),
    text({ content: '• Your biggest win here — quantify the impact.\n• A responsibility you owned and its outcome.\n• Something you improved for the team or customer.\n• A result that proves your reliability.', x: SAFE, y: 348, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'experience.0.bullets' }),

    ...role('Job Title', 'Company Name, City', 428, 'experience.1.title', 'experience.1.company'),
    dates('Month Year – Month Year', 428, 'experience.1.dates'),
    text({ content: '• Contribution tied to a measurable outcome.\n• Skill you applied and the value it created.\n• Teamwork, leadership, or initiative highlight.\n• Quantified improvement where you can.', x: SAFE, y: 468, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'experience.1.bullets' }),

    ...role('Job Title', 'Company Name, City', 548, 'experience.2.title', 'experience.2.company'),
    dates('Month Year – Month Year', 548, 'experience.2.dates'),
    text({ content: '• Early role achievement with a real result.\n• A skill you built that still serves you.', x: SAFE, y: 588, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'experience.2.bullets' }),

    head('EDUCATION', 654, 'education.heading'),
    text({ content: 'Degree, Major', x: SAFE, y: 680, width: 480, fontSize: 12, fontWeight: 700, color: INK, textCategory: 'body', docField: 'education.0.degree' }),
    dates('Graduation Year', 680, 'education.0.dates'),
    text({ content: 'University Name, City, Country', x: SAFE, y: 699, width: 480, fontSize: 11.5, color: MUTE, textCategory: 'body', docField: 'education.0.school' }),

    head('SKILLS', 742, 'skills.heading'),
    text({ content: 'Core: your strongest, most relevant skills\nTools: software and tools you know well\nSoft: communication, teamwork, problem solving', x: SAFE, y: 768, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'skills.0.body' }),

    head('ACHIEVEMENTS & INTERESTS', 850, 'additional.heading'),
    text({ content: 'Award, certification, or achievement — Year.\nInterests or volunteer work — one relevant line.', x: SAFE, y: 876, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'additional.0.body' }),
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
