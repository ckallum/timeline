import { useRef, useCallback, useState, useEffect } from 'react';
import DayNode from './DayNode';
import DetailPanel from './DetailPanel';
import YearNav from './YearNav';
import EmptyState from './EmptyState';
import Spinner from './Spinner';
import Search from './Search';
import { useTimelineData } from '../hooks/useTimelineData';
import type { DayEntry } from '../types';
import { dayGap, formatMonthYear, getYear } from '../lib/format';

export default function Timeline() {
  const { visibleDays, loading, error, hasMore, loadMore, jumpToYear, years, scrollTarget, clearScrollTarget } = useTimelineData();
  const [selectedDay, setSelectedDay] = useState<DayEntry | null>(null);
  const observerRef = useRef<IntersectionObserver>(undefined);

  const handleSearchNavigate = useCallback((date: string) => {
    const match = visibleDays.find(d => d.date === date);
    if (match) {
      setSelectedDay(match);
      requestAnimationFrame(() => {
        document.querySelector(`[data-date="${date}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    // Date exists in the vault but isn't in the loaded infinite-scroll window yet.
    // Fall through to Obsidian rather than silently no-op.
    const year = date.slice(0, 4);
    const month = date.slice(5, 7);
    const path = `journal/${year}/${month}/${date}.md`;
    window.open(`obsidian://open?path=${encodeURIComponent(path)}`, '_blank');
  }, [visibleDays]);

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node || !hasMore) return;

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore();
    }, { threshold: 0.1 });

    observerRef.current.observe(node);
  }, [hasMore, loadMore]);

  // Sticky header via IntersectionObserver on month dividers
  const [stickyHeader, setStickyHeader] = useState('');
  const headerObserverRef = useRef<IntersectionObserver>(undefined);

  const monthDividerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    if (!headerObserverRef.current) {
      headerObserverRef.current = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const label = entry.target.getAttribute('data-month');
            if (label) setStickyHeader(label);
          }
        }
      }, { rootMargin: '-10% 0px -80% 0px' });
    }
    headerObserverRef.current.observe(node);
  }, []);

  // Clean up header observer
  useEffect(() => {
    return () => headerObserverRef.current?.disconnect();
  }, []);

  // Handle scroll-to-year requests from the hook
  useEffect(() => {
    if (scrollTarget == null) return;
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-year="${scrollTarget}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      clearScrollTarget();
    });
  }, [scrollTarget, clearScrollTarget]);

  const collapsed = selectedDay !== null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
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

  let prevMonthYear = '';

  return (
    <div className="relative">
      <Search onNavigate={handleSearchNavigate} />
      <YearNav years={years} onJump={jumpToYear} collapsed={collapsed} />

      {stickyHeader && !collapsed && (
        <div className="fixed top-0 left-0 right-0 z-20 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800/50 py-2 px-4 text-center">
          <span className="text-sm text-zinc-400 font-medium">{stickyHeader}</span>
        </div>
      )}

      <DetailPanel day={selectedDay} onClose={() => setSelectedDay(null)} />

      <div
        className={`relative transition-all duration-300 ease-out ${collapsed ? 'ml-[70%]' : 'mx-auto max-w-5xl'} pt-12 pb-24 px-4`}
      >
        <div className={collapsed ? 'timeline-spine-collapsed' : 'timeline-spine'} />

        {visibleDays.map((day, idx) => {
          const side = idx % 2 === 0 ? 'left' : 'right';
          const prevDay = idx > 0 ? visibleDays[idx - 1] : null;
          const gap = prevDay ? dayGap(prevDay.date, day.date) : 0;
          const showGap = gap > 1;
          const monthYear = formatMonthYear(day.date);
          const isNewMonth = monthYear !== prevMonthYear;
          prevMonthYear = monthYear;

          return (
            <div key={day.date} data-date={day.date} data-year={getYear(day.date)}>
              {isNewMonth && !collapsed && (
                <div ref={monthDividerRef} data-month={monthYear} className="text-center py-3">
                  <span className="text-xs text-zinc-600 font-medium uppercase tracking-wider">
                    {monthYear}
                  </span>
                </div>
              )}
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

        {hasMore && (
          <div ref={sentinelRef} className="h-20 flex items-center justify-center">
            <Spinner size="sm" />
          </div>
        )}
      </div>
    </div>
  );
}
