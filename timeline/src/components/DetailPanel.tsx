import Markdown from 'react-markdown';
import { getCategoryColors, getCategoryLabel } from '../lib/colors';
import { formatDate, formatCounts } from '../lib/format';
import type { DayEntry } from '../hooks/useTimelineData';

interface DetailPanelProps {
  day: DayEntry | null;
  onClose: () => void;
}

export default function DetailPanel({ day, onClose }: DetailPanelProps) {
  if (!day) return null;

  const colors = getCategoryColors(day.dominant_category);
  const countLines = formatCounts(day.counts);

  return (
    <div className="detail-panel w-[70%] p-8 pt-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 mb-1">{formatDate(day.date)}</h1>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              {getCategoryLabel(day.dominant_category)}
            </span>
            {day.summary && (
              <span className="text-sm text-zinc-500 italic">{day.summary}</span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
          title="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 mb-6 pb-4 border-b border-zinc-800">
        {countLines.map((line, i) => (
          <span key={i} className="text-xs text-zinc-400 bg-zinc-900 px-2 py-1 rounded">{line}</span>
        ))}
        <a
          href={day.obsidian_uri}
          className="text-xs text-sky-400 hover:text-sky-300 transition-colors ml-auto"
          title="Open in Obsidian"
        >
          Open in Obsidian
        </a>
      </div>

      {/* Markdown body */}
      <article className="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-200 prose-headings:font-medium prose-p:text-zinc-300 prose-a:text-sky-400 prose-strong:text-zinc-200 prose-ul:text-zinc-400 prose-li:text-zinc-400 prose-code:text-amber-300 prose-code:bg-zinc-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-hr:border-zinc-800">
        <Markdown>{day.body_md}</Markdown>
      </article>
    </div>
  );
}
