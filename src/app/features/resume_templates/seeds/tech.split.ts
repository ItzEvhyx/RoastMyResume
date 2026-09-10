import { text, divider, shape } from '../build';
import type { TemplateSeedElements } from '../types';
import { SAFE, CANVAS_W } from '../types';

const W = CANVAS_W - SAFE * 2;
const L_X = SAFE;
const L_W = 428;
const R_X = 500;
const R_W = CANVAS_W - SAFE - R_X; // 246

const INK = '#1a2233';
const SUB = '#33415c';
const MUTE = '#5b6472';
const ACCENT = '#0ea5a4';

const lHead = (content: string, y: number, docField: string) =>
  text({ content, x: L_X, y, width: L_W, fontSize: 12.5, fontWeight: 700, color: INK, textCategory: 'subheader', docField });
const rHead = (content: string, y: number, docField: string) =>
  text({ content, x: R_X, y, width: R_W, fontSize: 12, fontWeight: 700, color: ACCENT, textCategory: 'subheader', docField });

const role = (title: string, company: string, period: string, y: number, titleField: string, companyField: string, datesField: string) => [
  text({ content: title, x: L_X, y, width: L_W, fontSize: 12.5, fontWeight: 700, color: INK, textCategory: 'body', docField: titleField }),
  text({ content: company, x: L_X, y: y + 18, width: L_W, fontSize: 11.5, color: ACCENT, fontWeight: 600, textCategory: 'body', docField: companyField }),
  text({ content: period, x: L_X, y: y + 36, width: L_W, fontSize: 10.5, color: MUTE, textCategory: 'meta', docField: datesField }),
];

/** Tech Split — full-width header, dense two-column body. */
export const techSplitSeed: TemplateSeedElements = {
  texts: [
    text({ content: 'Your Name', x: SAFE, y: 46, width: W, fontSize: 32, fontWeight: 700, color: INK, textCategory: 'header', docField: 'personal.name' }),
    text({ content: 'Software Engineer  ·  Full-Stack Developer', x: SAFE, y: 90, width: W, fontSize: 13, color: ACCENT, fontWeight: 600, textCategory: 'subheader', docField: 'personal.title' }),
    text({ content: 'email@example.com   ·   (555) 000-0000   ·   City, Country   ·   github.com/you   ·   linkedin.com/in/you', x: SAFE, y: 114, width: W, fontSize: 11, color: MUTE, textCategory: 'meta', docField: 'contact.0.value' }),

    text({ content: 'SUMMARY', x: SAFE, y: 150, width: W, fontSize: 12.5, fontWeight: 700, color: INK, textCategory: 'subheader', docField: 'summary.heading' }),
    text({ content: 'Two to three sentence summary of what you build, your core stack, and the impact you deliver. Aim it at the specific role and lead with your strongest, most relevant skill.', x: SAFE, y: 172, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'summary.body' }),

    // Left column
    lHead('EXPERIENCE', 250, 'experience.heading'),
    ...role('Job Title', 'Company Name', 'Month Year – Present', 278, 'experience.0.title', 'experience.0.company', 'experience.0.dates'),
    text({ content: '• Built a feature or service with a measurable result.\n• Owned a system area end to end and improved it.\n• Cut latency, cost, or defects with a specific change.\n• Shipped with design, product, and infra partners.', x: L_X, y: 320, width: L_W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'experience.0.bullets' }),

    ...role('Job Title', 'Company Name', 'Month Year – Month Year', 400, 'experience.1.title', 'experience.1.company', 'experience.1.dates'),
    text({ content: '• Delivered an improvement backed by a metric.\n• Introduced a tool or practice that stuck.\n• Reduced toil or flakiness measurably.\n• Owned a project across the stack.', x: L_X, y: 442, width: L_W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'experience.1.bullets' }),

    ...role('Job Title', 'Company Name', 'Month Year – Month Year', 522, 'experience.2.title', 'experience.2.company', 'experience.2.dates'),
    text({ content: '• Early contribution with a shippable outcome.\n• A skill you built and put into production.', x: L_X, y: 564, width: L_W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'experience.2.bullets' }),

    lHead('PROJECTS', 634, 'additional.heading'),
    text({ content: 'Project Name', x: L_X, y: 660, width: L_W, fontSize: 12, fontWeight: 700, color: INK, textCategory: 'body', docField: 'additional.0.body' }),
    text({ content: 'One-line pitch. Stack: React, Node, PostgreSQL. Link optional.', x: L_X, y: 679, width: L_W, fontSize: 11, color: SUB, textCategory: 'body', docField: 'additional.1.body' }),
    text({ content: 'Project Name', x: L_X, y: 716, width: L_W, fontSize: 12, fontWeight: 700, color: INK, textCategory: 'body', docField: 'additional.2.body' }),
    text({ content: 'One-line pitch. What it does and why it is notable.', x: L_X, y: 735, width: L_W, fontSize: 11, color: SUB, textCategory: 'body', docField: 'additional.3.body' }),

    lHead('ACHIEVEMENTS', 780, 'additional.heading'),
    text({ content: '• Talk, hackathon win, or open-source contribution.\n• A second line to round out your profile.', x: L_X, y: 806, width: L_W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'additional.4.body' }),

    // Right column
    rHead('SKILLS', 250, 'skills.heading'),
    text({ content: 'TypeScript · JavaScript\nReact / Next.js\nNode.js · Express\nPython · SQL\nGraphQL · REST\nAWS · Docker · CI/CD', x: R_X, y: 274, width: R_W, fontSize: 11, color: SUB, textCategory: 'body', docField: 'skills.0.body' }),

    rHead('EDUCATION', 402, 'education.heading'),
    text({ content: 'Degree, Major\nUniversity Name\nCity, Country\nGraduation Year', x: R_X, y: 426, width: R_W, fontSize: 11, color: SUB, textCategory: 'body', docField: 'education.0.degree' }),

    rHead('CERTIFICATIONS', 516, 'certifications.heading'),
    text({ content: 'Certification — Year\nCertification — Year\nCertification — Year', x: R_X, y: 540, width: R_W, fontSize: 11, color: SUB, textCategory: 'body', docField: 'certifications.0.body' }),

    rHead('LANGUAGES', 622, 'additional.heading'),
    text({ content: 'Language — Native\nLanguage — Fluent\nLanguage — Basic', x: R_X, y: 646, width: R_W, fontSize: 11, color: SUB, textCategory: 'body', docField: 'additional.5.body' }),

    rHead('STRENGTHS', 720, 'skills.heading'),
    text({ content: 'Problem Solving\nOwnership\nCommunication\nCuriosity', x: R_X, y: 744, width: R_W, fontSize: 11, color: SUB, textCategory: 'body', docField: 'skills.1.body' }),
  ],
  icons: [
    shape({ x: R_X - 26, y: 250, width: 1, height: 600, color: '#dbe3ea', zIndex: 0 }),
  ],
  dividers: [
    divider({ x: SAFE, y: 138, width: W, thickness: 2, color: ACCENT }),
    divider({ x: SAFE, y: 232, width: W, thickness: 1, color: '#dbe3ea' }),
  ],
};
