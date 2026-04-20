import { useState, useRef } from 'react';
import { getCategoryColors, getCategoryLabel } from '../lib/colors';
import { dateParts, formatStats, splitSummary } from '../lib/format';
import type { DayEntry } from '../types';

interface DayNodeProps {
  day: DayEntry;
  side: 'left' | 'right';
  collapsed: boolean;
  onSelect: (day: DayEntry) => void;
  isSelected: boolean;
}

function DayCardContent({ day, dense = false }: { day: DayEntry; dense?: boolean }) {
  const colors = getCategoryColors(day.dominant_category);
  const { weekday, day: dayNum, month, year } = dateParts(day.date);
  const { lead, body, bullets } = splitSummary(day.summary);
  const stats = formatStats(day.counts, dense ? 3 : 5);
  const hasContent = day.summary || stats.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-[10px] uppercase tracking-eyebrow text-zinc-500">
            {weekday}
          </span>
          <span className="font-display text-2xl leading-none font-light text-zinc-100 tabular-nums">
            {dayNum}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-eyebrow text-zinc-500">
            {month} <span className="text-zinc-700">·</span> {year}
          </span>
        </div>
        <span className={`inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-eyebrow px-1.5 py-0.5 rounded-sm ${colors.bg} ${colors.text} border ${colors.border}`}>
          <span className={`w-1 h-1 rounded-full ${colors.dot}`} />
          {getCategoryLabel(day.dominant_category)}
        </span>
      </header>

      {hasContent && <div className="hairline" />}

      {day.summary ? (
        <div className="space-y-2.5">
          {lead && (
            <h3 className="font-display text-[17px] leading-snug font-normal text-zinc-100 tracking-tight">
              {lead}
            </h3>
          )}
          {bullets.length > 0 ? (
            <ul className="space-y-1.5">
              {bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-zinc-300">
                  <span className={`mt-[7px] h-1 w-1 shrink-0 rounded-full ${colors.dot} opacity-70`} />
                  <div className="flex-1 min-w-0">
                    {b.subItems ? (
                      <>
                        <span className="text-zinc-300">{b.subLead}</span>
                        <ul className="mt-1 space-y-0.5">
                          {b.subItems.slice(0, dense ? 3 : b.subItems.length).map((item, j) => (
                            <li key={j} className="flex gap-1.5 text-[12px] text-zinc-400">
                              <span className="text-zinc-600 shrink-0">›</span>
                              <span className="flex-1">{item}</span>
                            </li>
                          ))}
                          {dense && b.subItems.length > 3 && (
                            <li className="text-[11px] text-zinc-600 font-mono uppercase tracking-wider ml-3.5">
                              +{b.subItems.length - 3} more
                            </li>
                          )}
                        </ul>
                      </>
                    ) : (
                      <span>{b.text}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`text-[13px] leading-relaxed text-zinc-400 ${lead ? '' : 'font-display text-[15px] text-zinc-200 leading-snug'}`}>
              {body}
            </p>
          )}
        </div>
      ) : (
        <p className="text-[12px] text-zinc-600 italic font-display">Quiet day.</p>
      )}

      {stats.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {stats.map((s) => (
            <div key={s.key} className="stat-pill">
              <span className="stat-pill-num">{s.value}</span>
              <span className="stat-pill-label">{s.shortLabel}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DayNode({ day, side, collapsed, onSelect, isSelected }: DayNodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const colors = getCategoryColors(day.dominant_category);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setShowTooltip(true), 200);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    setShowTooltip(false);
  };

  if (collapsed) {
    return (
      <div className="flex items-center justify-end pr-4 py-2">
        <button
          onClick={() => onSelect(day)}
          className={`w-3 h-3 rounded-full transition-all duration-300 ${colors.dot} ${isSelected ? 'ring-2 ring-white/40 scale-125' : 'hover:scale-125'}`}
          aria-label={`Select ${day.date}`}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-stretch gap-6 py-4 ${side === 'left' ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div
        className={`day-card flex-1 max-w-[calc(50%-2rem)] ${isSelected ? 'day-card-selected' : 'border-zinc-800/70'} ${side === 'left' ? 'ml-auto mr-8' : 'mr-auto ml-8'}`}
        onClick={() => onSelect(day)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className={`absolute top-0 ${side === 'left' ? 'right-0' : 'left-0'} h-full w-px ${colors.dot} opacity-50`} />
        <DayCardContent day={day} />
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 z-10 top-1/2 -translate-y-1/2">
        <button
          onClick={() => onSelect(day)}
          className={`relative w-[14px] h-[14px] rounded-full border-2 border-zinc-950 ${colors.dot} transition-transform duration-200 ${isSelected ? 'scale-150' : 'hover:scale-125'}`}
          aria-label={`Select ${day.date}`}
        >
          <span className={`absolute inset-0 rounded-full ${colors.dot} opacity-50 animate-ping`} style={{ animationDuration: '3s' }} />
        </button>
      </div>

      {showTooltip && (
        <div className={`absolute z-40 w-80 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700/70 rounded-xl p-4 shadow-2xl ${side === 'left' ? 'right-[calc(50%+1.5rem)]' : 'left-[calc(50%+1.5rem)]'} top-1/2 -translate-y-1/2`}>
          <DayCardContent day={day} dense />
        </div>
      )}
    </div>
  );
}
