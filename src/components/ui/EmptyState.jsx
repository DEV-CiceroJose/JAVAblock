export default function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <svg viewBox="0 0 96 64" className="w-24 h-16 mb-3 text-slate-600" fill="none" aria-hidden="true">
        <rect x="6" y="8" width="26" height="26" rx="5" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
        <rect x="64" y="30" width="26" height="26" rx="5" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
        <path d="M32 21 L46 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 4" />
        <path d="M64 43 L50 43" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 4" />
      </svg>
      <p className="text-sm text-slate-400">{title}</p>
      {description && <p className="text-xs text-slate-600 mt-1">{description}</p>}
    </div>
  );
}
