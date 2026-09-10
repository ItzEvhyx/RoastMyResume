import { text, divider } from '../build';
import type { TemplateSeedElements } from '../types';
import { SAFE, CANVAS_W } from '../types';

const W = CANVAS_W - SAFE * 2;
const INK = '#1a202c';
const SUB = '#2d3748';
const MUTE = '#5b6472';
const ACCENT = '#1e40af';

const head = (content: string, y: number, docField: string) =>
  text({
    content,
    x: SAFE,
    y,
    width: W,
    fontSize: 12.5,
    fontWeight: 700,
    color: ACCENT,
    textCategory: 'subheader',
    docField,
  });

const dates = (content: string, y: number, docField: string) =>
  text({
    content,
    x: CANVAS_W - SAFE - 190,
    y,
    width: 190,
    fontSize: 11,
    color: MUTE,
    textAlign: 'right',
    textCategory: 'meta',
    docField,
  });

/** ATS Clean — clear sections, blue accents, full-page dense. */
export const atsCleanSeed: TemplateSeedElements = {
  texts: [
    text({ content: 'Your Name', x: SAFE, y: 46, width: W, fontSize: 32, fontWeight: 700, color: INK, textCategory: 'header', docField: 'personal.name' }),
    text({ content: 'TARGET JOB TITLE', x: SAFE, y: 90, width: W, fontSize: 13, color: ACCENT, fontWeight: 700, textCategory: 'subheader', docField: 'personal.title' }),
    text({ content: 'email@example.com   ·   (555) 000-0000   ·   City, Country   ·   linkedin.com/in/you', x: SAFE, y: 114, width: W, fontSize: 11, color: MUTE, textCategory: 'meta', docField: 'contact.0.value' }),

    head('SUMMARY', 150, 'summary.heading'),
    text({ content: 'Brief professional summary tailored to the job description. State your years of experience, core strengths, and the specific value you deliver. Keep it factual and keyword-rich for applicant tracking systems.', x: SAFE, y: 172, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'summary.body' }),

    head('EXPERIENCE', 236, 'experience.heading'),
    text({ content: 'Job Title — Company Name', x: SAFE, y: 262, width: 500, fontSize: 12.5, fontWeight: 700, color: INK, textCategory: 'body', docField: 'experience.0.title' }),
    dates('Month Year – Present', 262, 'experience.0.dates'),
    text({ content: 'City, Country', x: SAFE, y: 281, width: 400, fontSize: 11, color: MUTE, textCategory: 'meta', docField: 'experience.0.location' }),
    text({ content: '• Strong action verb + what you did + measurable result.\n• Tool, system, or team you worked with and the outcome.\n• Quantified impact on revenue, cost, speed, or quality.\n• Cross-functional win or leadership moment worth highlighting.', x: SAFE, y: 301, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'experience.0.bullets' }),

    text({ content: 'Job Title — Company Name', x: SAFE, y: 378, width: 500, fontSize: 12.5, fontWeight: 700, color: INK, textCategory: 'body', docField: 'experience.1.title' }),
    dates('Month Year – Month Year', 378, 'experience.1.dates'),
    text({ content: 'City, Country', x: SAFE, y: 397, width: 400, fontSize: 11, color: MUTE, textCategory: 'meta', docField: 'experience.1.location' }),
    text({ content: '• Key contribution for this role with concrete ownership.\n• Second bullet showing scope, tools, or scale.\n• Result you can defend with a number.', x: SAFE, y: 417, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'experience.1.bullets' }),

    text({ content: 'Job Title — Company Name', x: SAFE, y: 478, width: 500, fontSize: 12.5, fontWeight: 700, color: INK, textCategory: 'body', docField: 'experience.2.title' }),
    dates('Month Year – Month Year', 478, 'experience.2.dates'),
    text({ content: 'City, Country', x: SAFE, y: 497, width: 400, fontSize: 11, color: MUTE, textCategory: 'meta', docField: 'experience.2.location' }),
    text({ content: '• Early role achievement tied to a real outcome.\n• Skill you developed and applied on the job.', x: SAFE, y: 517, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'experience.2.bullets' }),

    head('EDUCATION', 578, 'education.heading'),
    text({ content: 'Degree in Major — University Name', x: SAFE, y: 604, width: 500, fontSize: 12, fontWeight: 700, color: INK, textCategory: 'body', docField: 'education.0.degree' }),
    dates('Graduation Year', 604, 'education.0.dates'),
    text({ content: 'Relevant coursework, honors, activities, or GPA if strong.', x: SAFE, y: 623, width: W, fontSize: 11, color: MUTE, textCategory: 'meta', docField: 'education.0.meta' }),

    head('TECHNICAL SKILLS', 668, 'skills.heading'),
    text({ content: 'Languages: list your strongest languages\nFrameworks & Tools: list frameworks, libraries, and tools\nPractices: testing, CI/CD, agile, and other keywords from the posting', x: SAFE, y: 694, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'skills.0.body' }),

    head('PROJECTS', 764, 'additional.heading'),
    text({ content: 'Project Name — one-line description of what it does and the stack used.\nProject Name — one-line description of what it does and the stack used.', x: SAFE, y: 790, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'additional.0.body' }),

    head('CERTIFICATIONS & AWARDS', 846, 'certifications.heading'),
    text({ content: 'Certification or Award — Issuing Organization, Year\nCertification or Award — Issuing Organization, Year', x: SAFE, y: 872, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'certifications.0.body' }),
  ],
  icons: [],
  dividers: [
    divider({ x: SAFE, y: 138, width: W, thickness: 2, color: ACCENT }),
    divider({ x: SAFE, y: 166, width: W, thickness: 1, color: '#dfe5ee' }),
    divider({ x: SAFE, y: 230, width: W, thickness: 1, color: '#dfe5ee' }),
    divider({ x: SAFE, y: 572, width: W, thickness: 1, color: '#dfe5ee' }),
    divider({ x: SAFE, y: 662, width: W, thickness: 1, color: '#dfe5ee' }),
    divider({ x: SAFE, y: 758, width: W, thickness: 1, color: '#dfe5ee' }),
    divider({ x: SAFE, y: 840, width: W, thickness: 1, color: '#dfe5ee' }),
  ],
};
