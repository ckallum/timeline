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

export interface DateParts {
  weekday: string;
  weekdayFull: string;
  day: string;
  month: string;
  monthFull: string;
  year: string;
}

export function dateParts(dateStr: string): DateParts {
  const d = safeParse(dateStr);
  if (!d) return { weekday: '', weekdayFull: '', day: dateStr, month: '', monthFull: '', year: '' };
  return {
    weekday: format(d, 'EEE').toUpperCase(),
    weekdayFull: format(d, 'EEEE'),
    day: format(d, 'd'),
    month: format(d, 'MMM').toUpperCase(),
    monthFull: format(d, 'MMMM'),
    year: format(d, 'yyyy'),
  };
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

const COUNT_SHORT_LABELS: Record<CountKey, string> = {
  journal_entries: 'journal',
  quicknotes: 'notes',
  ingests: 'ingests',
  reminders_set: 'reminders',
  reminders_completed: 'done',
  git_commits: 'commits',
  pages_created: 'created',
  pages_updated: 'updated',
  photos: 'photos',
  voice_memos: 'voice',
};

export function formatCounts(counts: Partial<Record<CountKey, number>>): string[] {
  return Object.entries(counts)
    .filter(([, v]) => v != null && v > 0)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
    .slice(0, 5)
    .map(([key, value]) => `${value} ${COUNT_LABELS[key as CountKey] || key}`);
}

export interface StatEntry {
  key: CountKey;
  value: number;
  label: string;
  shortLabel: string;
}

export function formatStats(counts: Partial<Record<CountKey, number>>, limit = 5): StatEntry[] {
  return Object.entries(counts)
    .filter(([, v]) => v != null && v > 0)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
    .slice(0, limit)
    .map(([key, value]) => ({
      key: key as CountKey,
      value: value as number,
      label: COUNT_LABELS[key as CountKey] || key,
      shortLabel: COUNT_SHORT_LABELS[key as CountKey] || key,
    }));
}

export interface Bullet {
  text: string;
  subLead?: string;
  subItems?: string[];
}

export interface SplitSummary {
  lead: string | null;
  body: string;
  bullets: Bullet[];
}

// Split a string on a delimiter, ignoring occurrences inside parentheses.
function splitOutsideParens(text: string, delim: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let buf = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && text.substring(i, i + delim.length) === delim) {
      parts.push(buf);
      buf = '';
      i += delim.length - 1;
      continue;
    }
    buf += ch;
  }
  if (buf) parts.push(buf);
  return parts.map(s => s.trim()).filter(Boolean);
}

function cleanBullet(s: string): string {
  return s.replace(/\.$/, '').replace(/^and\s+/i, '').trim();
}

// For long "covering/across/including X, Y, Z, and W" clauses, expand the list
// into sub-items for readability.
function expandListBullet(bullet: string): Bullet {
  if (bullet.length < 120) return { text: bullet };
  const match = bullet.match(/^(.+?\b(?:covering|across|including|spanning|from|via)\s+)(.+)$/i);
  if (!match) return { text: bullet };
  const [, lead, list] = match;
  const items = splitOutsideParens(list, ', ').map(cleanBullet).filter(Boolean);
  if (items.length >= 3) {
    return { text: bullet, subLead: lead.trim().replace(/[,:]$/, ''), subItems: items };
  }
  return { text: bullet };
}

function toBullets(text: string): Bullet[] {
  if (!text) return [];
  let parts: string[] = [text];
  parts = parts.flatMap(p => splitOutsideParens(p, '; '));
  parts = parts.flatMap(p => splitOutsideParens(p, ' — '));
  parts = parts.flatMap(p => p.split(/\.\s+(?=[A-Z])/g));
  const cleaned = parts.map(cleanBullet).filter(Boolean);
  if (cleaned.length < 2) return [];
  return cleaned.map(expandListBullet);
}

// Split "Lead phrase: details..." into a headline + body, and break the body
// into bullets where possible.
export function splitSummary(summary: string): SplitSummary {
  if (!summary) return { lead: null, body: '', bullets: [] };
  let lead: string | null = null;
  let body = summary;

  const colonIdx = summary.indexOf(': ');
  if (colonIdx > 0 && colonIdx <= 60) {
    lead = summary.slice(0, colonIdx).trim();
    body = summary.slice(colonIdx + 2).trim();
  } else {
    const dashIdx = summary.indexOf(' — ');
    if (dashIdx > 0 && dashIdx <= 60) {
      lead = summary.slice(0, dashIdx).trim();
      body = summary.slice(dashIdx + 3).trim();
    }
  }

  return { lead, body, bullets: toBullets(body) };
}
