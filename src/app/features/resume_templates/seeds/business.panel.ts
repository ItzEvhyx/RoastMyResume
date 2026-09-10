import { text, divider, shape, frame } from '../build';
import type { TemplateSeedElements } from '../types';
import { SAFE, CANVAS_W, CANVAS_H } from '../types';

const SIDEBAR_W = 262;
const SB_X = CANVAS_W - SIDEBAR_W; // 532
const SB_TX = SB_X + 26; // sidebar text x
const SB_TW = CANVAS_W - SAFE - SB_TX; // sidebar text width

const MAIN_X = SAFE;
const MAIN_W = SB_X - 28 - SAFE; // main column width

const ACCENT = '#1e3a5f';
const INK = '#1a2233';
const SUB = '#33415c';
const MUTE = '#5b6472';

const mainHead = (content: string, y: number, docField: string) =>
  text({ content, x: MAIN_X, y, width: MAIN_W, fontSize: 12.5, fontWeight: 700, color: ACCENT, textCategory: 'subheader', docField });

const sbHead = (content: string, y: number, docField: string) =>
  text({ content, x: SB_TX, y, width: SB_TW, fontSize: 12, fontWeight: 700, color: '#ffffff', textCategory: 'subheader', docField });

const role = (title: string, company: string, period: string, y: number, titleField: string, companyField: string, datesField: string) => [
  text({ content: title, x: MAIN_X, y, width: MAIN_W, fontSize: 13, fontWeight: 700, color: INK, textCategory: 'body', docField: titleField }),
  text({ content: company, x: MAIN_X, y: y + 19, width: MAIN_W, fontSize: 11.5, color: ACCENT, fontWeight: 600, textCategory: 'body', docField: companyField }),
  text({ content: period, x: MAIN_X, y: y + 37, width: MAIN_W, fontSize: 10.5, color: MUTE, textCategory: 'meta', docField: datesField }),
];

/** Business Panel — full-bleed navy right sidebar with photo, dense main column. */
export const businessPanelSeed: TemplateSeedElements = {
  texts: [
    // Main column
    text({ content: 'Your Name', x: MAIN_X, y: 54, width: MAIN_W, fontSize: 30, fontWeight: 700, color: INK, textCategory: 'header', docField: 'personal.name' }),
    text({ content: 'Professional Title', x: MAIN_X, y: 96, width: MAIN_W, fontSize: 13, color: ACCENT, fontWeight: 600, textCategory: 'subheader', docField: 'personal.title' }),

    mainHead('PROFILE', 138, 'summary.heading'),
    text({ content: 'Two to three sentences about who you are professionally, your specialty, and what you deliver. Tailor this to the role you want and lead with your strongest, most relevant value.', x: MAIN_X, y: 160, width: MAIN_W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'summary.body' }),

    mainHead('KEY ACHIEVEMENTS', 234, 'additional.heading'),
    text({ content: '• A standout result — quantify the impact you made.\n• A second achievement showing scope or leadership.\n• A third win tied to a clear business outcome.', x: MAIN_X, y: 256, width: MAIN_W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'additional.0.body' }),

    mainHead('EMPLOYMENT HISTORY', 322, 'experience.heading'),
    ...role('Job Title', 'Company Name', 'Month Year – Present', 348, 'experience.0.title', 'experience.0.company', 'experience.0.dates'),
    text({ content: '• Describe your biggest win in this role with a metric.\n• Tools, clients, or scope you owned end to end.\n• A result that proves measurable impact.\n• Collaboration or leadership highlight.', x: MAIN_X, y: 405, width: MAIN_W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'experience.0.bullets' }),

    ...role('Job Title', 'Company Name', 'Month Year – Month Year', 490, 'experience.1.title', 'experience.1.company', 'experience.1.dates'),
    text({ content: '• Achievement bullet with concrete ownership.\n• Second bullet showing scale or improvement.\n• Outcome you can back with a number.', x: MAIN_X, y: 547, width: MAIN_W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'experience.1.bullets' }),

    ...role('Job Title', 'Company Name', 'Month Year – Month Year', 618, 'experience.2.title', 'experience.2.company', 'experience.2.dates'),
    text({ content: '• Early role contribution with a real outcome.\n• Skill you built and applied on the job.', x: MAIN_X, y: 675, width: MAIN_W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'experience.2.bullets' }),

    mainHead('EDUCATION', 738, 'education.heading'),
    text({ content: 'Degree, Major', x: MAIN_X, y: 764, width: MAIN_W, fontSize: 12, fontWeight: 700, color: INK, textCategory: 'body', docField: 'education.0.degree' }),
    text({ content: 'University Name — Graduation Year', x: MAIN_X, y: 783, width: MAIN_W, fontSize: 11, color: MUTE, textCategory: 'body', docField: 'education.0.school' }),

    mainHead('REFERENCES', 826, 'additional.heading'),
    text({ content: 'Reference Name — Title, Company\nphone · email@example.com\n\nReference Name — Title, Company\nphone · email@example.com', x: MAIN_X, y: 852, width: MAIN_W, fontSize: 11, color: SUB, textCategory: 'body', docField: 'additional.1.body' }),

    // Sidebar
    sbHead('DETAILS', 190, 'contact.heading'),
    text({ content: 'Address\nStreet, City, Country\n\nPhone\n(555) 000-0000\n\nEmail\nemail@example.com\n\nLinkedIn\nlinkedin.com/in/you', x: SB_TX, y: 214, width: SB_TW, fontSize: 10.5, color: '#d7deea', textCategory: 'meta', docField: 'contact.0.value' }),

    sbHead('SKILLS', 400, 'skills.heading'),
    text({ content: 'Skill One\nSkill Two\nSkill Three\nSkill Four\nSkill Five\nSkill Six', x: SB_TX, y: 424, width: SB_TW, fontSize: 11, color: '#d7deea', textCategory: 'body', docField: 'skills.0.body' }),

    sbHead('LANGUAGES', 552, 'additional.heading'),
    text({ content: 'Language — Native\nLanguage — Fluent\nLanguage — Basic', x: SB_TX, y: 576, width: SB_TW, fontSize: 11, color: '#d7deea', textCategory: 'body', docField: 'additional.2.body' }),

    sbHead('STRENGTHS', 664, 'skills.heading'),
    text({ content: 'Communication\nLeadership\nProblem Solving\nAdaptability', x: SB_TX, y: 688, width: SB_TW, fontSize: 11, color: '#d7deea', textCategory: 'body', docField: 'skills.1.body' }),
  ],
  icons: [
    shape({ x: SB_X, y: 0, width: SIDEBAR_W, height: CANVAS_H, color: ACCENT, bypassSafeArea: true, zIndex: 0 }),
    frame({ x: SB_X + (SIDEBAR_W - 108) / 2, y: 52, width: 108, height: 108, size: 108, shapeKind: 'circle', borderWidth: 3, borderColor: '#ffffff', zIndex: 2 }),
  ],
  dividers: [
    divider({ x: MAIN_X, y: 126, width: MAIN_W, thickness: 2, color: ACCENT }),
    divider({ x: MAIN_X, y: 314, width: MAIN_W, thickness: 1, color: '#d7deea' }),
    divider({ x: MAIN_X, y: 730, width: MAIN_W, thickness: 1, color: '#d7deea' }),
    divider({ x: MAIN_X, y: 818, width: MAIN_W, thickness: 1, color: '#d7deea' }),
  ],
};
