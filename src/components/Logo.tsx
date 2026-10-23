interface LogoProps {
  showTagline?: boolean;
  className?: string;
}

// Globe wrapped by an orbit arrow with location pins; drawn for the dark theme
export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <g className="text-blue-400" stroke="currentColor" strokeWidth="1.6">
        <circle cx="16" cy="16" r="9" />
        <ellipse cx="16" cy="16" rx="4" ry="9" />
        <path d="M7 16h18M8.4 11.5h15.2M8.4 20.5h15.2" strokeWidth="1.2" />
      </g>
      <g className="text-emerald-400" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M4.2 21.5A13 13 0 0 1 24.5 5.6" />
        <path d="M21.4 4.3l3.4 1.2-1.3 3.3" strokeLinejoin="round" />
      </g>
      <circle cx="26.5" cy="23.5" r="2.3" className="fill-emerald-400" />
      <circle cx="5.5" cy="8" r="1.6" className="fill-sky-300" />
    </svg>
  );
}

export function Logo({ showTagline = false, className = '' }: LogoProps) {
  return (
    <div
      role="img"
      aria-label="International Meeting Planner"
      className={`flex items-center gap-2 select-none ${className}`}
    >
      <LogoMark className="h-8 w-8 shrink-0" />
      <div className="leading-none">
        <div className="text-[13px] font-semibold tracking-tight text-gray-100">International</div>
        <div className="text-[13px] font-semibold tracking-tight text-blue-300">Meeting Planner</div>
        {showTagline && (
          <div className="mt-1 text-[10px] text-gray-400">Connect Globally. Plan Seamlessly.</div>
        )}
      </div>
    </div>
  );
}
