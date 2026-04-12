import type { Category } from '../types';

type ColorSet = { dot: string; border: string; bg: string; text: string };

const CATEGORY_COLORS: Record<Category, ColorSet> = {
  journal:  { dot: 'bg-amber-400',   border: 'border-amber-400/30',  bg: 'bg-amber-400/5',  text: 'text-amber-400' },
  capture:  { dot: 'bg-orange-400',  border: 'border-orange-400/30', bg: 'bg-orange-400/5', text: 'text-orange-400' },
  ingest:   { dot: 'bg-sky-400',     border: 'border-sky-400/30',    bg: 'bg-sky-400/5',    text: 'text-sky-400' },
  reminder: { dot: 'bg-rose-400',    border: 'border-rose-400/30',   bg: 'bg-rose-400/5',   text: 'text-rose-400' },
  code:     { dot: 'bg-emerald-400', border: 'border-emerald-400/30', bg: 'bg-emerald-400/5', text: 'text-emerald-400' },
  wiki:     { dot: 'bg-violet-400',  border: 'border-violet-400/30', bg: 'bg-violet-400/5', text: 'text-violet-400' },
  media:    { dot: 'bg-pink-400',    border: 'border-pink-400/30',   bg: 'bg-pink-400/5',   text: 'text-pink-400' },
  other:    { dot: 'bg-zinc-400',    border: 'border-zinc-400/30',   bg: 'bg-zinc-400/5',   text: 'text-zinc-400' },
};

export function getCategoryColors(category: Category): ColorSet {
  return CATEGORY_COLORS[category];
}

const CATEGORY_LABELS: Record<Category, string> = {
  journal: 'Journal',
  capture: 'Captures',
  ingest: 'Ingests',
  reminder: 'Reminders',
  code: 'Code',
  wiki: 'Wiki',
  media: 'Media',
  other: 'Activity',
};

export function getCategoryLabel(category: Category): string {
  return CATEGORY_LABELS[category];
}
