import { useRef, useCallback, useState, useEffect } from 'react';
import DayNode from './DayNode';
import DetailPanel from './DetailPanel';
import YearNav from './YearNav';
import EmptyState from './EmptyState';
import { useTimelineData } from '../hooks/useTimelineData';
import type { DayEntry } from '../hooks/useTimelineData';
import { dayGap, formatMonthYear } from '../lib/format';

export default function Timeline() {
  const { visibleDays, loading, error, hasMore, loadMore, jumpToYear, years } = useTimelineData();
  const [selectedDay, setSelectedDay] = useState<DayEntry | null>(null);
  const observerRef = useRef<IntersectionObserver>(undefined);

  // Infinite scroll sentinel
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node || !hasMore) return;

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore();
    }, { threshold: 0.1 });

    observerRef.current.observe(node);
  }, [hasMore, loadMore]);

  // Track current month/year for sticky header
  const [stickyHeader, setStickyHeader] = useState('');
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = timelineRef.current;
    if (!container) return;

    const handleScroll = () => {
      const nodes = container.querySelectorAll('[data-date]');
      for (const node of nodes) {
        const rect = node.getBoundingClientRect();
        if (rect.top >= 0 && rect.top < 200) {
          const date = node.getAttribute('data-date');
          if (date) setStickyHeader(formatMonthYear(date));
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleDays]);

  const collapsed = selectedDay !== null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (visibleDays.length === 0) return <EmptyState />;

  return (
    <div className="relative">
      <YearNav years={years} onJump={jumpToYear} collapsed={collapsed} />

      {/* Sticky month/year header */}
      {stickyHeader && !collapsed && (
        <div className="fixed top-0 left-0 right-0 z-20 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800/50 py-2 px-4 text-center">
          <span className="text-sm text-zinc-400 font-medium">{stickyHeader}</span>
        </div>
      )}

      {/* Detail panel (slides in from left) */}
      <DetailPanel day={selectedDay} onClose={() => setSelectedDay(null)} />

      {/* Timeline */}
      <div
        ref={timelineRef}
        className={`relative transition-all duration-300 ease-out ${collapsed ? 'ml-[70%]' : 'mx-auto max-w-5xl'} pt-12 pb-24 px-4`}
      >
        {/* Spine */}
        <div className={collapsed ? 'timeline-spine-collapsed' : 'timeline-spine'} />

        {/* Day nodes */}
        {visibleDays.map((day, idx) => {
          const side = idx % 2 === 0 ? 'left' : 'right';
          const prevDay = idx > 0 ? visibleDays[idx - 1] : null;
          const gap = prevDay ? dayGap(prevDay.date, day.date) : 0;
          const showGap = gap > 1;
          const isNewMonth = !prevDay || formatMonthYear(prevDay.date) !== formatMonthYear(day.date);

          return (
            <div key={day.date} data-date={day.date} data-year={new Date(day.date).getFullYear()}>
              {/* Month divider */}
              {isNewMonth && !collapsed && (
                <div className="text-center py-3">
                  <span className="text-xs text-zinc-600 font-medium uppercase tracking-wider">
                    {formatMonthYear(day.date)}
                  </span>
                </div>
              )}
              {/* Gap marker */}
              {showGap && (
                <div className="gap-marker">... {gap} days ...</div>
              )}
              <DayNode
                day={day}
                side={collapsed ? 'left' : side}
                collapsed={collapsed}
                onSelect={setSelectedDay}
                isSelected={selectedDay?.date === day.date}
              />
            </div>
          );
        })}

        {/* Infinite scroll sentinel */}
        {hasMore && (
          <div ref={sentinelRef} className="h-20 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
