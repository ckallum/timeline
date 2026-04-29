export default function EmptyState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-zinc-800 mx-auto mb-6 flex items-center justify-center">
          <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-zinc-300 mb-2">No day notes yet</h2>
        <p className="text-zinc-500 text-sm leading-relaxed">
          Run <code className="text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded text-xs">/journal</code> or{' '}
          <code className="text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded text-xs">/autoingest</code> in
          your vault to start building your timeline.
        </p>
      </div>
    </div>
  );
}
