import { useState, useRef } from 'react';
import { getCategoryColors } from '../lib/colors';
import { formatDate, formatCounts } from '../lib/format';
import type { DayEntry } from '../hooks/useTimelineData';

interface DayNodeProps {
  day: DayEntry;
  side: 'left' | 'right';
  collapsed: boolean;
  onSelect: (day: DayEntry) => void;
  isSelected: boolean;
}

export default function DayNode({ day, side, collapsed, onSelect, isSelected }: DayNodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const colors = getCategoryColors(day.dominant_category);
  const countLines = formatCounts(day.counts);

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
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center gap-6 py-4 ${side === 'left' ? 'flex-row-reverse' : 'flex-row'}`}
      data-year={new Date(day.date).getFullYear()}
    >
      {/* Card */}
      <div
        className={`day-card flex-1 max-w-[calc(50%-2rem)] ${colors.border} ${colors.bg} ${side === 'left' ? 'ml-auto mr-8' : 'mr-auto ml-8'}`}
        onClick={() => onSelect(day)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
          <span className="text-xs text-zinc-500 tabular-nums">{formatDate(day.date)}</span>
        </div>
        {day.summary && (
          <p className="text-sm text-zinc-300 leading-relaxed mb-2">{day.summary}</p>
        )}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {countLines.map((line, i) => (
            <span key={i} className="text-xs text-zinc-500">{line}</span>
          ))}
        </div>
      </div>

      {/* Dot on spine */}
      <div className="absolute left-1/2 -translate-x-1/2 z-10">
        <button
          onClick={() => onSelect(day)}
          className={`w-[14px] h-[14px] rounded-full border-2 border-zinc-950 ${colors.dot} transition-transform duration-200 ${isSelected ? 'scale-150' : 'hover:scale-125'}`}
        />
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className={`absolute z-40 w-72 bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl ${side === 'left' ? 'right-[calc(50%+1.5rem)]' : 'left-[calc(50%+1.5rem)]'} top-1/2 -translate-y-1/2`}>
          <p className="text-sm font-medium text-zinc-200 mb-1">{formatDate(day.date)}</p>
          {day.summary && <p className="text-xs text-zinc-400 mb-2">{day.summary}</p>}
          <ul className="space-y-0.5">
            {countLines.map((line, i) => (
              <li key={i} className="text-xs text-zinc-500">{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
