export default function Spinner({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const px = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return <div className={`${px} border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin`} />;
}
