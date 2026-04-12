#!/usr/bin/env npx tsx
/**
 * build-timeline-data.ts
 *
 * Walks journal/**\/*.md, parses frontmatter with gray-matter,
 * computes dominant_category, and writes timeline/data/timeline.json.
 *
 * Mtime-based skip: exits immediately if no journal file has been
 * modified since the last build (decision 14).
 *
 * Wikilink resolution: [[Page Title]] → [Page Title](obsidian://open?vault=timeline&file=...)
 * Image resolution: ![[photo.jpg]] → ![photo](../../_attachments/photo.jpg)
 */

import { readFileSync, writeFileSync, statSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, relative, basename, extname } from 'path';
import matter from 'gray-matter';

const VAULT_ROOT = join(import.meta.dirname, '..');
const JOURNAL_DIR = join(VAULT_ROOT, 'journal');
const OUTPUT_DIR = join(VAULT_ROOT, 'timeline', 'data');
const OUTPUT_FILE = join(OUTPUT_DIR, 'timeline.json');
const VAULT_NAME = 'timeline';

interface DayEntry {
  date: string;
  title: string;
  summary: string;
  counts: Record<string, number>;
  dominant_category: string;
  body_md: string;
  obsidian_uri: string;
}

interface TimelineData {
  generated_at: string;
  days: DayEntry[];
}

// Category mapping for dominant_category computation
const CATEGORY_MAP: Record<string, string> = {
  journal_entries: 'journal',
  quicknotes: 'capture',
  ingests: 'ingest',
  reminders_set: 'reminder',
  reminders_completed: 'reminder',
  git_commits: 'code',
  pages_created: 'wiki',
  pages_updated: 'wiki',
  photos: 'media',
  voice_memos: 'media',
};

function walkDir(dir: string): string[] {
  const files: string[] = [];
  if (!existsSync(dir)) return files;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(full));
    } else if (entry.name.endsWith('.md') && !entry.name.startsWith('_')) {
      files.push(full);
    }
  }
  return files;
}

function shouldRebuild(journalFiles: string[]): boolean {
  if (!existsSync(OUTPUT_FILE)) return true;

  const outputMtime = statSync(OUTPUT_FILE).mtimeMs;
  return journalFiles.some(f => statSync(f).mtimeMs > outputMtime);
}

function resolveWikilinks(body: string): string {
  // [[Page Title]] → [Page Title](obsidian://open?vault=timeline&file=Page%20Title)
  return body.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target: string, alias?: string) => {
    const display = alias || target;
    const encoded = encodeURIComponent(target);
    return `[${display}](obsidian://open?vault=${VAULT_NAME}&file=${encoded})`;
  });
}

function resolveImages(body: string, filePath: string): string {
  // ![[photo.jpg]] → ![photo](../../_attachments/photo.jpg)
  const relToVault = relative(join(VAULT_ROOT, 'timeline', 'dist'), VAULT_ROOT);
  return body.replace(/!\[\[([^\]]+)\]\]/g, (_match, filename: string) => {
    const name = basename(filename, extname(filename));
    return `![${name}](${relToVault}/_attachments/${filename})`;
  });
}

function computeDominantCategory(counts: Record<string, number>): string {
  let maxCount = 0;
  let dominant = 'journal';

  const categoryTotals: Record<string, number> = {};
  for (const [key, value] of Object.entries(counts)) {
    if (typeof value !== 'number') continue;
    const category = CATEGORY_MAP[key] || 'other';
    categoryTotals[category] = (categoryTotals[category] || 0) + value;
  }

  for (const [category, total] of Object.entries(categoryTotals)) {
    if (total > maxCount) {
      maxCount = total;
      dominant = category;
    }
  }

  return dominant;
}

function main() {
  const journalFiles = walkDir(JOURNAL_DIR);

  if (journalFiles.length === 0) {
    console.log('No journal files found. Writing empty timeline.');
    if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
    const empty: TimelineData = { generated_at: new Date().toISOString(), days: [] };
    writeFileSync(OUTPUT_FILE, JSON.stringify(empty, null, 2));
    return;
  }

  // Mtime check (decision 14)
  if (!shouldRebuild(journalFiles)) {
    console.log('No journal files changed since last build. Skipping.');
    return;
  }

  console.log(`Processing ${journalFiles.length} journal files...`);

  const days: DayEntry[] = [];

  for (const filePath of journalFiles) {
    try {
      const raw = readFileSync(filePath, 'utf-8');
      const { data: fm, content } = matter(raw);

      if (fm.type !== 'day') continue;

      const counts = fm.counts || {};
      const totalActivity = Object.values(counts).reduce(
        (sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0
      );

      // Skip days with zero activity
      if (totalActivity === 0) continue;

      const relPath = relative(VAULT_ROOT, filePath);
      let body = content;
      body = resolveWikilinks(body);
      body = resolveImages(body, filePath);

      // gray-matter parses YAML dates as Date objects; normalize to string
      const dateStr = fm.date instanceof Date
        ? fm.date.toISOString().slice(0, 10)
        : String(fm.date || basename(filePath, '.md'));

      days.push({
        date: dateStr,
        title: String(fm.title || basename(filePath, '.md')),
        summary: fm.summary_one_liner || '',
        counts,
        dominant_category: computeDominantCategory(counts),
        body_md: body.trim(),
        obsidian_uri: `obsidian://open?vault=${VAULT_NAME}&file=${encodeURIComponent(relPath)}`,
      });
    } catch (err) {
      console.error(`Error processing ${filePath}:`, err);
    }
  }

  // Sort by date descending (newest first)
  days.sort((a, b) => b.date.localeCompare(a.date));

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const timeline: TimelineData = {
    generated_at: new Date().toISOString(),
    days,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(timeline, null, 2));
  console.log(`Built timeline.json: ${days.length} active days.`);
}

main();
