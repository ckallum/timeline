import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import type { CountKey } from '../types';

function safeParse(dateStr: string) {
  const d = parseISO(dateStr);
  if (isNaN(d.getTime())) return null;
  return d;
}

export function formatDate(dateStr: string): string {
  const d = safeParse(dateStr);
  return d ? format(d, 'EEEE, d MMMM yyyy') : dateStr;
}

export function formatShortDate(dateStr: string): string {
  const d = safeParse(dateStr);
  return d ? format(d, 'd MMM yyyy') : dateStr;
}

export function formatMonthYear(dateStr: string): string {
  const d = safeParse(dateStr);
  return d ? format(d, 'MMMM yyyy') : dateStr;
}

export function getYear(dateStr: string): number {
  const d = safeParse(dateStr);
  return d ? d.getFullYear() : 0;
}

export function dayGap(dateA: string, dateB: string): number {
  const a = safeParse(dateA);
  const b = safeParse(dateB);
  return a && b ? Math.abs(differenceInCalendarDays(a, b)) : 0;
}

const COUNT_LABELS: Record<CountKey, string> = {
  journal_entries: 'journal entries',
  quicknotes: 'quicknotes',
  ingests: 'ingests',
  reminders_set: 'reminders set',
  reminders_completed: 'reminders completed',
  git_commits: 'git commits',
  pages_created: 'pages created',
  pages_updated: 'pages updated',
  photos: 'photos',
  voice_memos: 'voice memos',
};

export function formatCounts(counts: Partial<Record<CountKey, number>>): string[] {
  return Object.entries(counts)
    .filter(([, v]) => v != null && v > 0)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
    .slice(0, 5)
    .map(([key, value]) => `${value} ${COUNT_LABELS[key as CountKey] || key}`);
}
