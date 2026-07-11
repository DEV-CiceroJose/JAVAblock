import { useId } from 'react';

export default function BlockPattern({ className = '', color = '#4f8cff', opacity = 0.08 }) {
  const patternId = useId();

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden="true"
      style={{ opacity }}
    >
      <defs>
        <pattern id={patternId} width="56" height="56" patternUnits="userSpaceOnUse">
          <rect x="4" y="4" width="18" height="18" rx="4" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M22 13 h10" stroke={color} strokeWidth="1.5" />
          <rect x="34" y="4" width="18" height="18" rx="4" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M13 22 v10" stroke={color} strokeWidth="1.5" />
          <rect x="4" y="34" width="18" height="18" rx="4" fill="none" stroke={color} strokeWidth="1.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
