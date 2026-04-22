import { useEffect, useRef, useState } from 'react';
import type { Deck, DecksData } from '../types';

export default function DecksPicker() {
  const [decks, setDecks] = useState<Deck[] | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('./data/decks.json')
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) {
            setDecks([]);
            return null;
          }
          throw new Error(`Failed to load decks: ${res.status}`);
        }
        return res.json();
      })
      .then((data: DecksData | null) => {
        if (!data) return;
        setDecks(Array.isArray(data.decks) ? data.decks : []);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : String(err));
        setDecks([]);
      });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (decks === null) return null;

  const count = decks.length;

  return (
    <div ref={containerRef} className="fixed top-3 right-3 z-30">
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-eyebrow bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-md text-zinc-300 hover:text-zinc-100 hover:border-zinc-500 focus:outline-none focus:border-zinc-500"
        aria-label="Open decks picker"
        aria-expanded={open}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="5" width="18" height="12" rx="1.5" />
          <path d="M7 21h10" strokeLinecap="round" />
        </svg>
        Decks
        <span className="text-zinc-500 tabular-nums">{count}</span>
      </button>

      {open && (
        <div className="mt-2 w-80 bg-zinc-900/95 backdrop-blur-sm border border-zinc-800 rounded-md overflow-hidden shadow-2xl">
          {error && (
            <div className="px-3 py-2 text-xs text-red-400 border-b border-zinc-800">{error}</div>
          )}
          {count === 0 ? (
            <div className="px-3 py-4 text-xs text-zinc-500">
              No decks yet. Build one with <code className="text-amber-300">/marp</code>.
            </div>
          ) : (
            <ul className="max-h-[70vh] overflow-y-auto">
              {decks.map(deck => (
                <li key={deck.slug} className="border-b border-zinc-800 last:border-b-0">
                  <div className="px-3 py-2.5 hover:bg-zinc-800/60">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm text-zinc-100 font-medium truncate">{deck.title}</span>
                      {typeof deck.slides === 'number' && (
                        <span className="text-[10px] text-zinc-500 tabular-nums shrink-0">
                          {deck.slides} slides
                        </span>
                      )}
                    </div>
                    {deck.subtitle && (
                      <div className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">{deck.subtitle}</div>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {deck.html && (
                        <a
                          href={`./${deck.html}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-mono uppercase tracking-eyebrow text-sky-400 hover:text-sky-300"
                        >
                          Open HTML →
                        </a>
                      )}
                      {deck.pdf && (
                        <a
                          href={`./${deck.pdf}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-mono uppercase tracking-eyebrow text-zinc-400 hover:text-zinc-200"
                        >
                          PDF
                        </a>
                      )}
                      {deck.updated && (
                        <span className="ml-auto text-[10px] font-mono text-zinc-600">
                          {deck.updated}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
