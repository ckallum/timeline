export const CATEGORIES = ['journal', 'capture', 'ingest', 'reminder', 'code', 'wiki', 'media', 'other'] as const;
export type Category = (typeof CATEGORIES)[number];

export const COUNT_KEYS = [
  'journal_entries', 'quicknotes', 'ingests',
  'reminders_set', 'reminders_completed',
  'git_commits', 'pages_created', 'pages_updated',
  'photos', 'voice_memos',
] as const;
export type CountKey = (typeof COUNT_KEYS)[number];

export interface DayEntry {
  date: string;
  title: string;
  summary: string;
  counts: Partial<Record<CountKey, number>>;
  dominant_category: Category;
  body_md: string;
  obsidian_uri: string;
}

export interface TimelineData {
  generated_at: string;
  days: DayEntry[];
  errors?: Array<{ file: string; error: string }>;
}
