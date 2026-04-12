interface YearNavProps {
  years: number[];
  onJump: (year: number) => void;
  collapsed: boolean;
}

export default function YearNav({ years, onJump, collapsed }: YearNavProps) {
  if (years.length === 0) return null;

  return (
    <nav className={`fixed top-0 left-0 h-full flex flex-col justify-center z-30 transition-opacity duration-300 ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="flex flex-col gap-1 px-3">
        {years.map(year => (
          <button
            key={year}
            onClick={() => onJump(year)}
            className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors py-1 px-2 rounded hover:bg-zinc-800/50 text-right tabular-nums"
          >
            {year}
          </button>
        ))}
      </div>
    </nav>
  );
}
