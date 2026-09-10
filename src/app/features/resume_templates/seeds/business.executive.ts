import { text, divider, shape } from '../build';
import type { TemplateSeedElements } from '../types';
import { SAFE, CANVAS_W, CANVAS_H } from '../types';

const W = CANVAS_W - SAFE * 2;
const SERIF = 'Georgia, "Times New Roman", serif';
const INK = '#1a2233';
const SUB = '#33415c';
const MUTE = '#5b6472';
const ACCENT = '#0f172a';

const sectionTitle = (content: string, y: number, docField: string) =>
  text({
    content,
    x: SAFE,
    y,
    width: W,
    fontSize: 13,
    fontWeight: 700,
    color: ACCENT,
    fontFamily: SERIF,
    textAlign: 'center',
    textCategory: 'subheader',
    docField,
  });

const dates = (content: string, y: number, docField: string) =>
  text({
    content,
    x: CANVAS_W - SAFE - 170,
    y,
    width: 170,
    fontSize: 11,
    color: MUTE,
    fontFamily: SERIF,
    textAlign: 'right',
    textCategory: 'meta',
    docField,
  });

const role = (title: string, company: string, y: number, titleField: string, companyField: string) => [
  text({ content: title, x: SAFE, y, width: 470, fontSize: 13, fontWeight: 700, color: INK, fontFamily: SERIF, textCategory: 'body', docField: titleField }),
  text({ content: company, x: SAFE, y: y + 19, width: 470, fontSize: 11.5, color: MUTE, fontFamily: SERIF, textCategory: 'body', docField: companyField }),
];

/** Executive — centered serif business layout, full page. */
export const businessExecutiveSeed: TemplateSeedElements = {
  texts: [
    text({ content: 'Your Name', x: SAFE, y: 60, width: W, fontSize: 38, fontWeight: 700, color: ACCENT, fontFamily: SERIF, textAlign: 'center', textCategory: 'header', docField: 'personal.name' }),
    text({ content: 'Professional Title', x: SAFE, y: 112, width: W, fontSize: 14, color: SUB, fontFamily: SERIF, textAlign: 'center', textCategory: 'subheader', docField: 'personal.title' }),
    text({ content: 'City, Country   ·   email@example.com   ·   (555) 000-0000   ·   linkedin.com/in/you', x: SAFE, y: 140, width: W, fontSize: 11, color: MUTE, fontFamily: SERIF, textAlign: 'center', textCategory: 'meta', docField: 'contact.0.value' }),

    sectionTitle('PROFILE', 190, 'summary.heading'),
    text({ content: 'A senior-level summary highlighting your leadership scope, industry focus, and the outcomes you are known for. Keep it confident, specific, and results-oriented — two to three polished sentences that frame the rest of the page.', x: SAFE + 30, y: 214, width: W - 60, fontSize: 11.5, color: SUB, fontFamily: SERIF, textAlign: 'center', textCategory: 'body', docField: 'summary.body' }),

    sectionTitle('EXPERIENCE', 288, 'experience.heading'),
    ...role('Job Title', 'Company Name — City, Country', 316, 'experience.0.title', 'experience.0.company'),
    dates('Year – Present', 316, 'experience.0.dates'),
    text({ content: '• Led an initiative with clear business impact — quantify revenue, growth, or savings.\n• Managed stakeholders, budget, or a team; state the size and the result.\n• Delivered a strategic outcome tied to company objectives.\n• Drove a measurable improvement in a core operating metric.', x: SAFE, y: 356, width: W, fontSize: 11.5, color: SUB, fontFamily: SERIF, textCategory: 'body', docField: 'experience.0.bullets' }),

    ...role('Job Title', 'Company Name — City, Country', 436, 'experience.1.title', 'experience.1.company'),
    dates('Year – Year', 436, 'experience.1.dates'),
    text({ content: '• Ownership bullet with a measurable outcome and scope.\n• Cross-functional leadership or transformation highlight.\n• Result that proves strategic value to the organization.', x: SAFE, y: 476, width: W, fontSize: 11.5, color: SUB, fontFamily: SERIF, textCategory: 'body', docField: 'experience.1.bullets' }),

    ...role('Job Title', 'Company Name — City, Country', 542, 'experience.2.title', 'experience.2.company'),
    dates('Year – Year', 542, 'experience.2.dates'),
    text({ content: '• Contribution that shows a clear upward trajectory.\n• Outcome tied to a business result or client success.', x: SAFE, y: 582, width: W, fontSize: 11.5, color: SUB, fontFamily: SERIF, textCategory: 'body', docField: 'experience.2.bullets' }),

    sectionTitle('EDUCATION', 636, 'education.heading'),
    text({ content: 'Degree, Major', x: SAFE, y: 664, width: 470, fontSize: 12.5, fontWeight: 700, color: INK, fontFamily: SERIF, textCategory: 'body', docField: 'education.0.degree' }),
    dates('Year', 664, 'education.0.dates'),
    text({ content: 'University Name — City, Country', x: SAFE, y: 683, width: 470, fontSize: 11.5, color: MUTE, fontFamily: SERIF, textCategory: 'body', docField: 'education.0.school' }),

    sectionTitle('CORE COMPETENCIES', 728, 'skills.heading'),
    text({ content: 'Leadership   ·   Strategy   ·   Operations   ·   Communication   ·   Stakeholder Management   ·   P&L', x: SAFE, y: 756, width: W, fontSize: 11.5, color: SUB, fontFamily: SERIF, textAlign: 'center', textCategory: 'body', docField: 'skills.0.body' }),

    sectionTitle('BOARD & RECOGNITION', 800, 'certifications.heading'),
    text({ content: 'Award, honor, or board role — Organization, Year\nAward, honor, or board role — Organization, Year', x: SAFE, y: 828, width: W, fontSize: 11.5, color: SUB, fontFamily: SERIF, textAlign: 'center', textCategory: 'body', docField: 'certifications.0.body' }),
  ],
  icons: [
    shape({ x: 0, y: 0, width: CANVAS_W, height: 10, color: ACCENT, bypassSafeArea: true, zIndex: 0 }),
    shape({ x: 0, y: CANVAS_H - 10, width: CANVAS_W, height: 10, color: ACCENT, bypassSafeArea: true, zIndex: 0 }),
  ],
  dividers: [
    divider({ x: SAFE + 150, y: 170, width: W - 300, thickness: 1, color: '#c7ced9' }),
    divider({ x: SAFE + 120, y: 278, width: W - 240, thickness: 1, color: '#c7ced9' }),
    divider({ x: SAFE + 120, y: 626, width: W - 240, thickness: 1, color: '#c7ced9' }),
    divider({ x: SAFE + 120, y: 718, width: W - 240, thickness: 1, color: '#c7ced9' }),
    divider({ x: SAFE + 120, y: 790, width: W - 240, thickness: 1, color: '#c7ced9' }),
  ],
};
