import { useEffect } from 'react';
import Markdown from 'react-markdown';
import { getCategoryColors, getCategoryLabel } from '../lib/colors';
import { dateParts, formatStats, splitSummary } from '../lib/format';
import type { DayEntry } from '../types';

interface DetailPanelProps {
  day: DayEntry | null;
  onClose: () => void;
}

export default function DetailPanel({ day, onClose }: DetailPanelProps) {
  useEffect(() => {
    if (!day) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [day, onClose]);

  if (!day) return null;

  const colors = getCategoryColors(day.dominant_category);
  const { weekdayFull, day: dayNum, monthFull, year, weekday, month } = dateParts(day.date);
  const { lead, body, bullets } = splitSummary(day.summary);
  const stats = formatStats(day.counts, 8);

  return (
    <div className="detail-panel w-[70%]">
      <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/60 px-8 py-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="back-button group"
          aria-label="Back to timeline"
        >
          <svg className="back-arrow w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to timeline</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-eyebrow text-zinc-600">
            ESC to close
          </span>
          <a
            href={day.obsidian_uri}
            className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-eyebrow text-sky-400 hover:text-sky-300 transition-colors"
            title="Open in Obsidian"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Obsidian
          </a>
        </div>
      </div>

      <div className="px-8 py-8 max-w-3xl">
        <header className="mb-8">
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-mono text-[11px] uppercase tracking-eyebrow text-zinc-500">
              {weekday}
            </span>
            <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-eyebrow px-2 py-0.5 rounded-sm ${colors.bg} ${colors.text} border ${colors.border}`}>
              <span className={`w-1 h-1 rounded-full ${colors.dot}`} />
              {getCategoryLabel(day.dominant_category)}
            </span>
          </div>

          <h1 className="font-display text-5xl font-light text-zinc-50 leading-[0.95] tracking-tight mb-2">
            <span className="tabular-nums">{dayNum}</span>
            <span className="text-zinc-500 mx-2 font-light">/</span>
            <span className="italic font-normal">{monthFull}</span>
          </h1>
          <p className="font-mono text-xs uppercase tracking-eyebrow text-zinc-500">
            {weekdayFull} <span className="text-zinc-700 mx-1.5">·</span> {year}
          </p>

          {day.summary && (
            <div className="mt-6 pt-6 border-t border-zinc-800/60">
              <p className="font-mono text-[10px] uppercase tracking-eyebrow text-zinc-500 mb-2">
                Précis
              </p>
              {lead && (
                <h2 className="font-display text-xl font-normal text-zinc-100 leading-snug tracking-tight mb-4">
                  {lead}
                </h2>
              )}
              {bullets.length > 0 ? (
                <ul className="space-y-2.5">
                  {bullets.map((b, i) => (
                    <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-zinc-300">
                      <span className={`mt-[9px] h-1 w-1 shrink-0 rounded-full ${colors.dot}`} />
                      <div className="flex-1">
                        {b.subItems ? (
                          <>
                            <span>{b.subLead}</span>
                            <ul className="mt-1.5 ml-1 space-y-1 text-[13px] text-zinc-400">
                              {b.subItems.map((item, j) => (
                                <li key={j} className="flex gap-2">
                                  <span className="text-zinc-600">›</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          b.text
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`${lead ? 'text-[14px] text-zinc-400' : 'font-display text-lg text-zinc-200'} leading-relaxed`}>
                  {body}
                </p>
              )}
            </div>
          )}
        </header>

        {stats.length > 0 && (
          <section className="mb-8">
            <p className="font-mono text-[10px] uppercase tracking-eyebrow text-zinc-500 mb-3">
              By the numbers
            </p>
            <div className="grid grid-cols-4 gap-px bg-zinc-800/60 border border-zinc-800/60 rounded-lg overflow-hidden">
              {stats.map((s) => (
                <div key={s.key} className="bg-zinc-950 px-4 py-3 flex flex-col gap-0.5">
                  <span className="font-display text-2xl font-light text-zinc-100 tabular-nums leading-none">
                    {s.value}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-eyebrow text-zinc-500">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center gap-3 mb-5">
            <p className="font-mono text-[10px] uppercase tracking-eyebrow text-zinc-500">
              Day note
            </p>
            <div className="flex-1 h-px bg-zinc-800/60" />
            <span className="font-mono text-[10px] text-zinc-600">{month} {dayNum}</span>
          </div>
          <article className="prose prose-invert prose-sm max-w-none
            prose-headings:font-display prose-headings:font-normal prose-headings:tracking-tight prose-headings:text-zinc-100
            prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-zinc-800/60
            prose-h3:text-base prose-h3:font-sans prose-h3:uppercase prose-h3:tracking-eyebrow prose-h3:text-zinc-400 prose-h3:text-xs
            prose-p:text-zinc-300 prose-p:leading-relaxed
            prose-a:text-sky-400 prose-a:no-underline hover:prose-a:text-sky-300 hover:prose-a:underline
            prose-strong:text-zinc-100 prose-strong:font-medium
            prose-ul:text-zinc-300 prose-li:text-zinc-300 prose-li:marker:text-zinc-600
            prose-code:text-amber-300 prose-code:bg-zinc-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-[12px] prose-code:before:content-none prose-code:after:content-none
            prose-hr:border-zinc-800/60
            prose-blockquote:border-l-2 prose-blockquote:border-zinc-700 prose-blockquote:text-zinc-400 prose-blockquote:italic prose-blockquote:font-display">
            <Markdown>{day.body_md}</Markdown>
          </article>
        </section>
      </div>
    </div>
  );
}
