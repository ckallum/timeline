import { useState, useEffect, useCallback, useMemo } from 'react';
import type { DayEntry } from '../types';
import { getYear } from '../lib/format';

const PAGE_SIZE = 10;

export function useTimelineData() {
  const [allDays, setAllDays] = useState<DayEntry[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollTarget, setScrollTarget] = useState<number | null>(null);

  useEffect(() => {
    fetch('./data/timeline.json')
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) throw new Error('Timeline data not found. Run `npm run build:data` first.');
          throw new Error(`Failed to load timeline data: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (!data || !Array.isArray(data.days)) {
          throw new Error('Invalid timeline data: missing days array');
        }
        setAllDays(data.days);
        setLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
  }, []);

  const visibleDays = useMemo(() => allDays.slice(0, page * PAGE_SIZE), [allDays, page]);
  const hasMore = visibleDays.length < allDays.length;

  const loadMore = useCallback(() => {
    setPage(p => p + 1);
  }, []);

  const jumpToYear = useCallback((year: number) => {
    const idx = allDays.findIndex(d => getYear(d.date) <= year);
    if (idx === -1) return;
    const needed = Math.ceil((idx + 1) / PAGE_SIZE);
    setPage(p => Math.max(p, needed));
    setScrollTarget(year);
  }, [allDays]);

  const years = useMemo(
    () => [...new Set(allDays.map(d => getYear(d.date)).filter(y => y > 0))].sort((a, b) => b - a),
    [allDays],
  );

  const clearScrollTarget = useCallback(() => setScrollTarget(null), []);

  return { visibleDays, loading, error, hasMore, loadMore, jumpToYear, years, scrollTarget, clearScrollTarget };
}
