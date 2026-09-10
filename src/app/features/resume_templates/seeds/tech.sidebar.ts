import { text, divider, shape, icon } from '../build';
import type { TemplateSeedElements } from '../types';
import { SAFE, CANVAS_W, CANVAS_H } from '../types';

const SIDEBAR_W = 264;
const SB_TX = 40;
const SB_TW = SIDEBAR_W - SB_TX - 22;
const ICON_X = 40;
const ICON_TX = 64;

const MAIN_X = SIDEBAR_W + 28; // 292
const MAIN_W = CANVAS_W - SAFE - MAIN_X; // to right safe margin
const DARK = '#111827';
const INK = '#1a2233';
const SUB = '#33415c';
const MUTE = '#5b6472';
const ACCENT = '#2563eb';

const mainHead = (content: string, y: number, docField: string) =>
  text({ content, x: MAIN_X, y, width: MAIN_W, fontSize: 13, fontWeight: 700, color: INK, textCategory: 'subheader', docField });

const sbHead = (content: string, y: number, docField: string) =>
  text({ content, x: SB_TX, y, width: SB_TW, fontSize: 11.5, fontWeight: 700, color: '#e5e7eb', textCategory: 'subheader', docField });

const CONTACT: { iconify: string; value: string; y: number; docField: string }[] = [
  { iconify: 'mdi:email-outline', value: 'email@example.com', y: 174, docField: 'contact.0.value' },
  { iconify: 'mdi:phone-outline', value: '(555) 000-0000', y: 196, docField: 'contact.1.value' },
  { iconify: 'mdi:map-marker-outline', value: 'City, Country', y: 218, docField: 'contact.2.value' },
  { iconify: 'mdi:github', value: 'github.com/you', y: 240, docField: 'contact.3.value' },
  { iconify: 'mdi:linkedin', value: 'linkedin.com/in/you', y: 262, docField: 'contact.4.value' },
];

const contactText = (value: string, y: number, docField: string) =>
  text({ content: value, x: ICON_TX, y, width: SIDEBAR_W - ICON_TX - 18, fontSize: 10.5, color: '#c7d0de', textCategory: 'meta', docField });

const contactIcon = (iconify: string, y: number) =>
  icon({ x: ICON_X, y: y + 1, size: 14, color: '#93a4bf', iconify, zIndex: 2 });

const role = (title: string, company: string, period: string, y: number, titleField: string, datesField: string, companyField: string) => [
  text({ content: title, x: MAIN_X, y, width: 300, fontSize: 13, fontWeight: 700, color: INK, textCategory: 'body', docField: titleField }),
  text({ content: period, x: CANVAS_W - SAFE - 160, y, width: 160, fontSize: 10.5, color: MUTE, textAlign: 'right', textCategory: 'meta', docField: datesField }),
  text({ content: company, x: MAIN_X, y: y + 19, width: 320, fontSize: 11.5, color: ACCENT, fontWeight: 600, textCategory: 'body', docField: companyField }),
];

/** Sidebar Pro — full-bleed dark left column, icons, dense main. */
export const techSidebarSeed: TemplateSeedElements = {
  texts: [
    // Sidebar
    text({ content: 'Your Name', x: SB_TX, y: 54, width: SB_TW, fontSize: 22, fontWeight: 700, color: '#f8fafc', textCategory: 'header', docField: 'personal.name' }),
    text({ content: 'Software Engineer', x: SB_TX, y: 90, width: SB_TW, fontSize: 12, color: '#93a4bf', textCategory: 'subheader', docField: 'personal.title' }),

    sbHead('CONTACT', 146, 'contact.heading'),
    ...CONTACT.map((c) => contactText(c.value, c.y, c.docField)),

    sbHead('SKILLS', 306, 'skills.heading'),
    text({ content: 'TypeScript\nReact / Next.js\nNode.js\nPython\nSQL / PostgreSQL\nGraphQL\nAWS / Docker\nSystem Design', x: SB_TX, y: 330, width: SB_TW, fontSize: 11, color: '#c7d0de', textCategory: 'body', docField: 'skills.0.body' }),

    sbHead('TOOLS', 508, 'additional.heading'),
    text({ content: 'VS Code, Git, Figma\nJest, Playwright\nGitHub Actions, Terraform', x: SB_TX, y: 532, width: SB_TW, fontSize: 11, color: '#c7d0de', textCategory: 'body', docField: 'additional.0.body' }),

    sbHead('EDUCATION', 604, 'education.heading'),
    text({ content: 'Degree, Major\nUniversity Name\nGraduation Year', x: SB_TX, y: 628, width: SB_TW, fontSize: 11, color: '#c7d0de', textCategory: 'body', docField: 'education.0.degree' }),

    sbHead('CERTIFICATIONS', 706, 'certifications.heading'),
    text({ content: 'Certification — Year\nCertification — Year', x: SB_TX, y: 730, width: SB_TW, fontSize: 11, color: '#c7d0de', textCategory: 'body', docField: 'certifications.0.body' }),

    // Main column
    mainHead('SUMMARY', 54, 'summary.heading'),
    text({ content: 'Engineer summary focused on what you build, your core stack, and the problems you solve. Swap this for a sharp two to three sentence pitch aimed at the role you want.', x: MAIN_X, y: 76, width: MAIN_W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'summary.body' }),

    mainHead('EXPERIENCE', 158, 'experience.heading'),
    ...role('Job Title', 'Company Name', 'Month Year – Present', 186, 'experience.0.title', 'experience.0.dates', 'experience.0.company'),
    text({ content: '• Built a feature or service with measurable user or performance impact.\n• Owned an API, frontend surface, or system area end to end.\n• Cut latency, cost, or bugs through a specific technical change.\n• Collaborated with design, product, or infra to ship on time.\n• Mentored peers or improved developer experience.', x: MAIN_X, y: 226, width: MAIN_W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'experience.0.bullets' }),

    ...role('Job Title', 'Company Name', 'Month Year – Month Year', 328, 'experience.1.title', 'experience.1.dates', 'experience.1.company'),
    text({ content: '• Shipped an improvement with a clear metric behind it.\n• Introduced a tool, test, or process that stuck.\n• Reduced toil or flakiness in a measurable way.\n• Delivered a project across the full stack.', x: MAIN_X, y: 368, width: MAIN_W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'experience.1.bullets' }),

    ...role('Job Title', 'Company Name', 'Month Year – Month Year', 456, 'experience.2.title', 'experience.2.dates', 'experience.2.company'),
    text({ content: '• Early contribution with a real, shippable outcome.\n• A skill you built and put into production.', x: MAIN_X, y: 496, width: MAIN_W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'experience.2.bullets' }),

    mainHead('PROJECTS', 558, 'additional.heading'),
    text({ content: 'Project Name', x: MAIN_X, y: 584, width: MAIN_W, fontSize: 12, fontWeight: 700, color: INK, textCategory: 'body', docField: 'additional.1.body' }),
    text({ content: 'One-line pitch. Stack: React, Node, PostgreSQL. Link or GitHub optional.', x: MAIN_X, y: 603, width: MAIN_W, fontSize: 11, color: SUB, textCategory: 'body', docField: 'additional.2.body' }),
    text({ content: 'Project Name', x: MAIN_X, y: 640, width: MAIN_W, fontSize: 12, fontWeight: 700, color: INK, textCategory: 'body', docField: 'additional.3.body' }),
    text({ content: 'One-line pitch. Stack: your tools. What it does and why it is notable.', x: MAIN_X, y: 659, width: MAIN_W, fontSize: 11, color: SUB, textCategory: 'body', docField: 'additional.4.body' }),

    mainHead('OPEN SOURCE & ACHIEVEMENTS', 704, 'additional.heading'),
    text({ content: '• Contribution, talk, hackathon win, or notable achievement.\n• A second line to round out your profile.', x: MAIN_X, y: 730, width: MAIN_W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'additional.5.body' }),
  ],
  icons: [
    shape({ x: 0, y: 0, width: SIDEBAR_W, height: CANVAS_H, color: DARK, bypassSafeArea: true, zIndex: 0 }),
    ...CONTACT.map((c) => contactIcon(c.iconify, c.y)),
  ],
  dividers: [
    divider({ x: MAIN_X, y: 150, width: MAIN_W, thickness: 2, color: ACCENT }),
    divider({ x: MAIN_X, y: 550, width: MAIN_W, thickness: 1, color: '#e2e8f0' }),
    divider({ x: MAIN_X, y: 696, width: MAIN_W, thickness: 1, color: '#e2e8f0' }),
  ],
};
