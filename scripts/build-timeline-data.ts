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

import { readFile, writeFile, stat, mkdir, readdir } from 'fs/promises';
import { existsSync, readdirSync, statSync } from 'fs';
import { join, relative, basename, extname } from 'path';
import matter from 'gray-matter';
import type { DayEntry, TimelineData, Category, CountKey } from '../timeline/src/types';

const VAULT_ROOT = join(import.meta.dirname, '..');
const JOURNAL_DIR = join(VAULT_ROOT, 'journal');
const OUTPUT_DIR = join(VAULT_ROOT, 'timeline', 'data');
const OUTPUT_FILE = join(OUTPUT_DIR, 'timeline.json');
const VAULT_NAME = 'timeline';

const CATEGORY_MAP: Record<CountKey, Category> = {
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

function walkDir(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, out);
    } else if (entry.name.endsWith('.md') && !entry.name.startsWith('_')) {
      out.push(full);
    }
  }
  return out;
}

async function shouldRebuild(journalFiles: string[]): Promise<boolean> {
  try {
    const outputStat = await stat(OUTPUT_FILE);
    const outputMtime = outputStat.mtimeMs;
    const stats = await Promise.all(journalFiles.map(f => stat(f).then(s => s.mtimeMs)));
    return stats.some(mtime => mtime > outputMtime);
  } catch {
    return true; // output file doesn't exist
  }
}

function resolveWikilinks(body: string): string {
  return body.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target: string, alias?: string) => {
    const display = alias || target;
    const encoded = encodeURIComponent(target);
    return `[${display}](obsidian://open?vault=${VAULT_NAME}&file=${encoded})`;
  });
}

function resolveImages(body: string): string {
  const relToVault = relative(join(VAULT_ROOT, 'timeline', 'dist'), VAULT_ROOT);
  return body.replace(/!\[\[([^\]]+)\]\]/g, (_match, filename: string) => {
    const sanitized = basename(filename);
    const name = basename(sanitized, extname(sanitized));
    return `![${name}](${relToVault}/_attachments/${sanitized})`;
  });
}

function computeDominantCategory(counts: Partial<Record<CountKey, number>>): Category {
  let maxCount = 0;
  let dominant: Category = 'journal';

  const categoryTotals: Partial<Record<Category, number>> = {};
  for (const [key, value] of Object.entries(counts)) {
    if (typeof value !== 'number') continue;
    const category = CATEGORY_MAP[key as CountKey] || 'other';
    categoryTotals[category] = (categoryTotals[category] || 0) + value;
  }

  for (const [category, total] of Object.entries(categoryTotals)) {
    if (total! > maxCount) {
      maxCount = total!;
      dominant = category as Category;
    }
  }

  return dominant;
}

async function processFile(filePath: string): Promise<DayEntry | null> {
  const raw = await readFile(filePath, 'utf-8');
  const { data: fm, content } = matter(raw);

  if (fm.type !== 'day') return null;

  const counts = fm.counts || {};
  const totalActivity = Object.values(counts).reduce(
    (sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0
  );

  if (totalActivity === 0) return null;

  const relPath = relative(VAULT_ROOT, filePath);
  let body = content;
  body = resolveWikilinks(body);
  body = resolveImages(body);

  const dateStr = fm.date instanceof Date
    ? fm.date.toISOString().slice(0, 10)
    : String(fm.date || basename(filePath, '.md'));

  return {
    date: dateStr,
    title: String(fm.title || basename(filePath, '.md')),
    summary: fm.summary_one_liner || '',
    counts,
    dominant_category: computeDominantCategory(counts),
    body_md: body.trim(),
    obsidian_uri: `obsidian://open?vault=${VAULT_NAME}&file=${encodeURIComponent(relPath)}`,
  };
}

async function main() {
  const journalFiles = walkDir(JOURNAL_DIR);

  if (journalFiles.length === 0) {
    console.log('No journal files found. Writing empty timeline.');
    await mkdir(OUTPUT_DIR, { recursive: true });
    const empty: TimelineData = { generated_at: new Date().toISOString(), days: [] };
    await writeFile(OUTPUT_FILE, JSON.stringify(empty, null, 2));
    return;
  }

  if (!(await shouldRebuild(journalFiles))) {
    console.log('No journal files changed since last build. Skipping.');
    return;
  }

  console.log(`Processing ${journalFiles.length} journal files...`);

  const results = await Promise.allSettled(journalFiles.map(f =>
    processFile(f).then(entry => ({ file: f, entry }))
  ));

  const days: DayEntry[] = [];
  const errors: Array<{ file: string; error: string }> = [];

  for (const result of results) {
    if (result.status === 'rejected') {
      errors.push({ file: 'unknown', error: String(result.reason) });
    } else if (result.value.entry) {
      days.push(result.value.entry);
    }
  }

  if (errors.length > 0) {
    console.warn(`\nWARNING: ${errors.length} file(s) failed to process:`);
    errors.forEach(e => console.warn(`  - ${e.file}: ${e.error}`));
  }

  days.sort((a, b) => b.date.localeCompare(a.date));

  await mkdir(OUTPUT_DIR, { recursive: true });

  const output = {
    generated_at: new Date().toISOString(),
    days,
    ...(errors.length > 0 ? { errors } : {}),
  };

  await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`Built timeline.json: ${days.length} active days.${errors.length > 0 ? ` (${errors.length} errors)` : ''}`);
}

main().catch(err => {
  console.error('Build failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
