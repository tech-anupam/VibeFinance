"use client";

export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function TrendUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

export function TrendDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  );
}

export function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

export function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

export function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}

export function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

export function SourceIcon({ publisher, className }: { publisher: string; className?: string }) {
  const lower = publisher.toLowerCase();
  if (lower.includes("reddit")) return <RedditIcon className={className} />;
  if (lower.includes("twitter") || lower.includes("x (")) return <XIcon className={className} />;
  if (lower.includes("quora")) return <QuoraIcon className={className} />;
  if (lower.includes("yahoo")) return <YahooIcon className={className} />;
  return <GlobeIcon className={className} />;
}

function RedditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.066 13.98c.042.307.064.62.064.936 0 3.39-3.946 6.142-8.813 6.142S.504 18.306.504 14.916c0-.317.022-.63.065-.937A1.752 1.752 0 0 1 .93 11.17a1.755 1.755 0 0 1 2.475.106 8.55 8.55 0 0 1 4.666-1.49l.882-4.148a.35.35 0 0 1 .416-.278l2.94.619a1.24 1.24 0 1 1-.14.66l-2.63-.554-.783 3.68a8.51 8.51 0 0 1 4.601 1.496 1.753 1.753 0 1 1 2.726 2.12zM8.07 13.68c-.967 0-1.75.784-1.75 1.75s.783 1.75 1.75 1.75 1.75-.783 1.75-1.75-.784-1.75-1.75-1.75zm7.86 0c-.967 0-1.75.784-1.75 1.75s.783 1.75 1.75 1.75 1.75-.783 1.75-1.75-.783-1.75-1.75-1.75zm-3.93 5.56c1.34 0 2.56-.488 3.39-1.26a.28.28 0 0 0-.004-.395.28.28 0 0 0-.396-.004c-.706.66-1.8 1.07-2.99 1.07s-2.284-.41-2.99-1.07a.28.28 0 0 0-.396.004.28.28 0 0 0-.004.395c.83.772 2.05 1.26 3.39 1.26z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function QuoraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.738 16.988c-.71-1.436-1.582-2.87-3.048-2.87-.378 0-.79.112-1.134.334l-.586-1.166c.76-.576 1.726-.904 2.826-.904 2.146 0 3.492 1.152 4.466 2.892.382-1.07.59-2.342.59-3.786 0-4.736-1.902-7.866-5.29-7.866-3.36 0-5.26 3.13-5.26 7.866 0 4.708 1.9 7.81 5.26 7.81.882 0 1.67-.2 2.376-.576zM10.562 24C4.626 24 0 18.624 0 12S4.626 0 10.562 0c5.908 0 10.574 5.376 10.574 12 0 2.67-.694 5.132-1.9 7.19l1.516 2.16-2.462 1.15-1.37-1.95C15.3 22.41 13.06 24 10.562 24z" />
    </svg>
  );
}

function YahooIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.957 13.262l4.284-8.906h-3.474l-2.503 5.78-2.636-5.78H5.17l4.442 8.906v6.494h3.345z" />
    </svg>
  );
}
