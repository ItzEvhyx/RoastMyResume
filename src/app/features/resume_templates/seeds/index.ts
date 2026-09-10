import type { ResumeTemplateMeta, TemplateSeedElements } from '../types';
import { atsClassicSeed } from './ats.classic';
import { atsCleanSeed } from './ats.clean';
import { businessExecutiveSeed } from './business.executive';
import { businessPanelSeed } from './business.panel';
import { techSidebarSeed } from './tech.sidebar';
import { techSplitSeed } from './tech.split';
import { genericMinimalSeed } from './generic.minimal';
import { genericBannerSeed } from './generic.banner';

export const TEMPLATE_META: ResumeTemplateMeta[] = [
  {
    id: 'blank',
    name: 'Design from scratch',
    tag: 'Blank canvas',
    category: 'Generic',
    blank: true,
  },
  {
    id: 'ats-classic',
    name: 'ATS Classic',
    tag: 'Single column · plain',
    category: 'ATS Friendly',
    accent: '#94a3b8',
  },
  {
    id: 'ats-clean',
    name: 'ATS Clean',
    tag: 'Clear sections',
    category: 'ATS Friendly',
    accent: '#1e40af',
  },
  {
    id: 'business-executive',
    name: 'Executive',
    tag: 'Centered · classic',
    category: 'Business',
    accent: '#0f172a',
  },
  {
    id: 'business-panel',
    name: 'Business Panel',
    tag: 'Right column',
    category: 'Business',
    accent: '#1e3a5f',
  },
  {
    id: 'tech-sidebar',
    name: 'Sidebar Pro',
    tag: 'Sidebar layout',
    category: 'Tech',
    accent: '#111827',
  },
  {
    id: 'tech-split',
    name: 'Tech Split',
    tag: 'Dual column',
    category: 'Tech',
    accent: '#2563eb',
  },
  {
    id: 'generic-minimal',
    name: 'Minimal',
    tag: 'Simple · top-down',
    category: 'Generic',
    accent: '#64748b',
  },
  {
    id: 'generic-banner',
    name: 'Bold Banner',
    tag: 'Accent header',
    category: 'Generic',
    accent: '#7c3aed',
  },
];

export const TEMPLATE_SEEDS: Record<string, TemplateSeedElements> = {
  'ats-classic': atsClassicSeed,
  'ats-clean': atsCleanSeed,
  'business-executive': businessExecutiveSeed,
  'business-panel': businessPanelSeed,
  'tech-sidebar': techSidebarSeed,
  'tech-split': techSplitSeed,
  'generic-minimal': genericMinimalSeed,
  'generic-banner': genericBannerSeed,
};

export function getLocalSeed(templateId: string): TemplateSeedElements | null {
  return TEMPLATE_SEEDS[templateId] ?? null;
}
