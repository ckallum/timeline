import { useState, useRef, useEffect, useCallback, Fragment } from 'react';

// In dev we proxy through Vite (/api/qmd → localhost:3001) to avoid CORS.
// In production, either serve the viewer from the same origin as qmd or set
// this to an absolute URL — qmd 2.1.0 does not emit CORS headers.
const QMD_URL = '/api/qmd/query';

interface SearchResult {
  docid?: string;
  file?: string;
  path?: string;
  title?: string;
  snippet?: string;
  score?: number;
  context?: string;
}

interface SearchProps {
  onNavigate?: (path: string) => void;
}

// A hit is only renderable if it has a non-empty file or path — otherwise
// clicks would open a broken obsidian://open?path= URI.
function isRenderable(hit: unknown): hit is SearchResult {
  if (!hit || typeof hit !== 'object') return false;
  const r = hit as SearchResult;
  return (typeof r.file === 'string' && r.file.length > 0)
      || (typeof r.path === 'string' && r.path.length > 0);
}

function resultPath(result: SearchResult): string {
  return result.file ?? result.path ?? '';
}

function deriveTitle(result: SearchResult): string {
  if (result.title) return result.title;
  const p = resultPath(result);
  const base = p.split('/').pop() ?? p;
  return base.replace(/\.md$/, '');
}

function dayFromPath(path: string): string | null {
  const match = path.match(/journal\/\d{4}\/\d{2}\/(\d{4}-\d{2}-\d{2})\.md$/);
  return match ? match[1] : null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlight(snippet: string, query: string) {
  const rawTerms = query.trim().split(/\s+/).filter(Boolean);
  if (rawTerms.length === 0) return snippet;
  const termSet = new Set(rawTerms.map((t) => t.toLowerCase()));
  const splitRe = new RegExp(`(${rawTerms.map(escapeRegex).join('|')})`, 'gi');
  const parts = snippet.split(splitRe);
  return parts.map((part, i) =>
    termSet.has(part.toLowerCase()) ? (
      <mark key={i} className="bg-amber-300/30 text-amber-100 rounded-sm px-0.5">{part}</mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

export default function Search({ onNavigate }: SearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'unavailable'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (q: string) => {
    // Cancel any in-flight request before starting a new one so stale responses
    // can't overwrite the newest query's results.
    abortRef.current?.abort();

    if (!q.trim()) {
      setResults([]);
      setStatus('idle');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('loading');
    try {
      const res = await fetch(QMD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searches: [
            { type: 'lex', query: q },
            { type: 'vec', query: q },
          ],
          limit: 10,
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`QMD returned ${res.status}`);
      const data = await res.json();

      // Detect the "none of the expected shapes matched" case explicitly —
      // otherwise an upstream shape change silently renders as zero results.
      let rawHits: unknown;
      if (Array.isArray(data)) rawHits = data;
      else if (Array.isArray(data?.results)) rawHits = data.results;
      else if (Array.isArray(data?.hits)) rawHits = data.hits;
      else {
        console.error('[search] unknown QMD response shape:', data);
        setStatus('error');
        setErrorMsg('Unknown QMD response shape — index may need rebuilding');
        setResults([]);
        return;
      }

      // Validate each hit has a usable path so clicks don't open broken URIs.
      // Drop malformed hits silently but report if the whole response is bad.
      const hits = (rawHits as unknown[]).filter(isRenderable);
      if (hits.length === 0 && (rawHits as unknown[]).length > 0) {
        console.error('[search] all QMD hits missing file/path:', rawHits);
        setStatus('error');
        setErrorMsg('QMD returned results without file paths');
        setResults([]);
        return;
      }

      setResults(hits);
      setStatus('idle');
    } catch (err) {
      // Aborts are expected (user typed another character) — not an error.
      if (err instanceof DOMException && err.name === 'AbortError') return;

      // Discriminate by error type, not message string:
      //  - TypeError from fetch() = network down / CORS / server not listening
      //  - SyntaxError from res.json() = malformed response (version mismatch?)
      //  - anything else = logic error or non-2xx we threw ourselves
      console.error('[search] query failed:', err);
      if (err instanceof TypeError) {
        setStatus('unavailable');
        setErrorMsg('Cannot reach QMD server on :3001');
      } else if (err instanceof SyntaxError) {
        setStatus('error');
        setErrorMsg('QMD returned malformed JSON');
      } else {
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
      setResults([]);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 250);
    return () => clearTimeout(debounceRef.current);
  }, [query, runSearch]);

  const handleClick = (result: SearchResult) => {
    const p = resultPath(result);
    const day = dayFromPath(p);
    if (day && onNavigate) {
      onNavigate(day);
      return;
    }
    const uri = `obsidian://open?path=${encodeURIComponent(p)}`;
    window.open(uri, '_blank');
  };

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search vault…"
        className="w-full px-3 py-2 text-sm bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-md text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
      />

      {query && status !== 'idle' && (
        <div className="mt-2 px-3 py-2 bg-zinc-900/90 border border-zinc-800 rounded-md text-xs text-zinc-500">
          {status === 'loading' && 'Searching…'}
          {status === 'unavailable' && 'QMD server unavailable. Start it via scripts/serve-timeline.sh.'}
          {status === 'error' && `Search error: ${errorMsg}`}
        </div>
      )}

      {results.length > 0 && (
        <ul className="mt-2 bg-zinc-900/95 backdrop-blur-sm border border-zinc-800 rounded-md overflow-hidden max-h-[70vh] overflow-y-auto">
          {results.map((r, i) => (
            <li key={`${resultPath(r)}-${i}`}>
              <button
                onClick={() => handleClick(r)}
                className="w-full text-left px-3 py-2 hover:bg-zinc-800 border-b border-zinc-800 last:border-b-0"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-zinc-200 font-medium truncate">{deriveTitle(r)}</span>
                  {typeof r.score === 'number' && (
                    <span className="text-[10px] text-zinc-500 tabular-nums shrink-0">{r.score.toFixed(2)}</span>
                  )}
                </div>
                <div className="text-[10px] text-zinc-500 truncate">{resultPath(r)}</div>
                {r.snippet && (
                  <div className="text-xs text-zinc-400 mt-1 line-clamp-2">{highlight(r.snippet, query)}</div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
