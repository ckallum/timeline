import { format, parseISO, differenceInCalendarDays } from 'date-fns';

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'EEEE, d MMMM yyyy');
}

export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM yyyy');
}

export function formatMonthYear(dateStr: string): string {
  return format(parseISO(dateStr), 'MMMM yyyy');
}

export function getYear(dateStr: string): number {
  return parseISO(dateStr).getFullYear();
}

export function dayGap(dateA: string, dateB: string): number {
  return Math.abs(differenceInCalendarDays(parseISO(dateA), parseISO(dateB)));
}

export function formatCounts(counts: Record<string, number>): string[] {
  const labels: Record<string, string> = {
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

  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([key, value]) => `${value} ${labels[key] || key}`);
}
