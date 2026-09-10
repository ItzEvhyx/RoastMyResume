import { text, divider } from '../build';
import type { TemplateSeedElements } from '../types';
import { SAFE, CANVAS_W } from '../types';

const W = CANVAS_W - SAFE * 2; // 698
const INK = '#111111';
const SUB = '#333333';
const MUTE = '#5b6472';
const RULE = '#9aa3b0';

const head = (content: string, y: number, docField: string) =>
  text({
    content,
    x: SAFE,
    y,
    width: W,
    fontSize: 12.5,
    fontWeight: 700,
    color: INK,
    textCategory: 'subheader',
    docField,
  });

const dates = (content: string, y: number, docField: string) =>
  text({
    content,
    x: CANVAS_W - SAFE - 200,
    y,
    width: 200,
    fontSize: 11,
    color: MUTE,
    textAlign: 'right',
    textCategory: 'meta',
    docField,
  });

/** ATS Classic — single column, plain text, full-page dense. */
export const atsClassicSeed: TemplateSeedElements = {
  texts: [
    text({ content: 'Your Name', x: SAFE, y: 46, width: W, fontSize: 30, fontWeight: 700, color: INK, textCategory: 'header', docField: 'personal.name' }),
    text({ content: 'Target Job Title', x: SAFE, y: 88, width: W, fontSize: 14, color: SUB, fontWeight: 600, textCategory: 'subheader', docField: 'personal.title' }),
    text({ content: 'City, Country  |  email@example.com  |  (555) 000-0000  |  linkedin.com/in/you  |  github.com/you', x: SAFE, y: 112, width: W, fontSize: 11, color: MUTE, textCategory: 'meta', docField: 'contact.0.value' }),

    head('PROFESSIONAL SUMMARY', 148, 'summary.heading'),
    text({ content: 'Two to three sentences summarizing your experience, core strengths, and the role you are targeting. Mention your years of experience, your specialty, and the measurable value you bring. Keep the language plain and specific so applicant tracking systems parse it cleanly.', x: SAFE, y: 168, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'summary.body' }),

    head('PROFESSIONAL EXPERIENCE', 236, 'experience.heading'),
    text({ content: 'Job Title', x: SAFE, y: 262, width: 480, fontSize: 12.5, fontWeight: 700, color: INK, textCategory: 'body', docField: 'experience.0.title' }),
    dates('Month Year – Present', 262, 'experience.0.dates'),
    text({ content: 'Company Name, City, Country', x: SAFE, y: 281, width: 480, fontSize: 11.5, color: MUTE, textCategory: 'body', docField: 'experience.0.company' }),
    text({ content: '• Led or delivered a key result — describe the impact with a number or percentage.\n• Owned a process, product area, or client relationship and the outcome it produced.\n• Collaborated across teams to ship something that mattered to the business.\n• Improved a metric (revenue, cost, speed, quality) through a specific action.\n• Recognized for a strength — award, promotion, or expanded responsibility.', x: SAFE, y: 301, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'experience.0.bullets' }),

    text({ content: 'Job Title', x: SAFE, y: 388, width: 480, fontSize: 12.5, fontWeight: 700, color: INK, textCategory: 'body', docField: 'experience.1.title' }),
    dates('Month Year – Month Year', 388, 'experience.1.dates'),
    text({ content: 'Company Name, City, Country', x: SAFE, y: 407, width: 480, fontSize: 11.5, color: MUTE, textCategory: 'body', docField: 'experience.1.company' }),
    text({ content: '• Strong action verb + what you did + the measurable result.\n• Responsibility tied to a business outcome, with tools or scope named.\n• Second achievement that shows growth or ownership.\n• Quantified improvement wherever you can back it up.', x: SAFE, y: 427, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'experience.1.bullets' }),

    text({ content: 'Job Title', x: SAFE, y: 500, width: 480, fontSize: 12.5, fontWeight: 700, color: INK, textCategory: 'body', docField: 'experience.2.title' }),
    dates('Month Year – Month Year', 500, 'experience.2.dates'),
    text({ content: 'Company Name, City, Country', x: SAFE, y: 519, width: 480, fontSize: 11.5, color: MUTE, textCategory: 'body', docField: 'experience.2.company' }),
    text({ content: '• Early-career contribution with a concrete outcome.\n• Skill you built and how you applied it.\n• Result that proves reliability or initiative.', x: SAFE, y: 539, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'experience.2.bullets' }),

    head('EDUCATION', 610, 'education.heading'),
    text({ content: 'Degree, Major', x: SAFE, y: 636, width: 480, fontSize: 12, fontWeight: 700, color: INK, textCategory: 'body', docField: 'education.0.degree' }),
    dates('Graduation Year', 636, 'education.0.dates'),
    text({ content: 'University Name, City, Country', x: SAFE, y: 655, width: 480, fontSize: 11.5, color: MUTE, textCategory: 'body', docField: 'education.0.school' }),
    text({ content: 'Relevant coursework, honors, or GPA if strong.', x: SAFE, y: 673, width: W, fontSize: 11, color: SUB, textCategory: 'meta', docField: 'education.0.meta' }),

    head('TECHNICAL SKILLS', 716, 'skills.heading'),
    text({ content: 'Languages: list your strongest languages\nTools & Platforms: list tools, frameworks, and platforms\nConcepts: methodologies, practices, and domain keywords from the job post', x: SAFE, y: 742, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'skills.0.body' }),

    head('CERTIFICATIONS', 810, 'certifications.heading'),
    text({ content: 'Certification Name — Issuing Organization, Year\nCertification Name — Issuing Organization, Year', x: SAFE, y: 836, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'certifications.0.body' }),

    head('ADDITIONAL', 892, 'additional.heading'),
    text({ content: 'Languages: list spoken languages and proficiency\nInterests: a short, relevant line', x: SAFE, y: 918, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'additional.0.body' }),
  ],
  icons: [],
  dividers: [
    divider({ x: SAFE, y: 136, width: W, thickness: 1, color: RULE }),
    divider({ x: SAFE, y: 228, width: W, thickness: 1, color: RULE }),
    divider({ x: SAFE, y: 602, width: W, thickness: 1, color: RULE }),
    divider({ x: SAFE, y: 708, width: W, thickness: 1, color: RULE }),
    divider({ x: SAFE, y: 802, width: W, thickness: 1, color: RULE }),
    divider({ x: SAFE, y: 884, width: W, thickness: 1, color: RULE }),
  ],
};
