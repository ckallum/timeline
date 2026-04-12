import { useState, useEffect, useCallback, useRef } from 'react';

export interface DayEntry {
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

const PAGE_SIZE = 10;

export function useTimelineData() {
  const [allDays, setAllDays] = useState<DayEntry[]>([]);
  const [visibleDays, setVisibleDays] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(1);

  useEffect(() => {
    fetch('./data/timeline.json')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load timeline data: ${res.status}`);
        return res.json() as Promise<TimelineData>;
      })
      .then(data => {
        setAllDays(data.days);
        const initial = data.days.slice(0, PAGE_SIZE);
        setVisibleDays(initial);
        setHasMore(data.days.length > PAGE_SIZE);
        setLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
  }, []);

  const loadMore = useCallback(() => {
    const nextPage = pageRef.current + 1;
    const end = nextPage * PAGE_SIZE;
    setVisibleDays(allDays.slice(0, end));
    setHasMore(end < allDays.length);
    pageRef.current = nextPage;
  }, [allDays]);

  const jumpToYear = useCallback((year: number) => {
    const idx = allDays.findIndex(d => new Date(d.date).getFullYear() <= year);
    if (idx === -1) return;
    const end = Math.max(idx + PAGE_SIZE, visibleDays.length);
    setVisibleDays(allDays.slice(0, end));
    setHasMore(end < allDays.length);
    pageRef.current = Math.ceil(end / PAGE_SIZE);

    // Scroll to the year after state update
    setTimeout(() => {
      const el = document.querySelector(`[data-year="${year}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, [allDays, visibleDays.length]);

  const years = [...new Set(allDays.map(d => new Date(d.date).getFullYear()))].sort((a, b) => b - a);

  return { visibleDays, loading, error, hasMore, loadMore, jumpToYear, years };
}
